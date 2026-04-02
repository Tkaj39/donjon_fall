# Donjon Fall — Further Steps

## Overview

Now that the core of the game is implemented (see implementation-plan.md), there are still many improvements to be made.

---

## AI Opponent

A computer-controlled player that can take any player slot. All bots share a common interface so the game loop treats them identically to human players.

### 1 AI player interface
- `AIPlayer { id: string, getAction(state): Promise<GameAction> }` — abstract interface all bots implement
- The game loop calls `getAction` automatically when `currentPlayer` matches an AI player's ID
- A small artificial delay is added before the bot commits its action so moves feel natural
- The game setup screen (@docs/implementation-plan.md Phase 9.5) allows each player slot to be assigned to a human or to a bot at a chosen difficulty level

### 2 Random bot
- Enumerates all legal actions and picks one uniformly at random
- Useful as a baseline and for automated testing of game logic

### 3 Heuristic bot
Rule-based decision-making, evaluated in priority order:
- Attack any enemy that can be beaten (highest attack-strength advantage first)
- Occupy active focal points if reachable
- Move towards the nearest enemy
- Reroll any die whose value is below average
- Fall back to a random legal move

### 4 Minimax bot (with alpha-beta pruning)
- Builds a game tree to a configurable search depth
- Evaluation function considers: score differential, focal point control, total die value on board, board position (proximity to focal points)
- Alpha-beta pruning to reduce search space
- Runs in a Web Worker to avoid blocking the UI thread

### 5 Difficulty levels
| Level  | Bot            | Notes                          |
|--------|----------------|--------------------------------|
| Easy   | Random bot     | Completely unpredictable       |
| Medium | Heuristic bot  | Plays sensibly, no lookahead   |
| Hard   | Minimax depth 3| Looks ahead, plays well        |
| Expert | Minimax depth 5| Slow but strong                |

### 6 Game loop integration
- `createInitialState` accepts a `botPlayers: { [playerId]: AIPlayer }` map
- After each human action that ends a turn, the reducer detects the next player is a bot and dispatches `BOT_MOVE` automatically
- Bot actions go through the same reducer as human actions — no special-casing in game logic

---

## Board Creator

A standalone editor tool (separate React route or page) for designing, saving, and loading game maps. Produces JSON files consumed by the game itself.

### 1 Board data format (JSON)
```
BoardDefinition {
  id: string               // unique map identifier
  name: string
  hexes: HexField[]        // all fields with their coords and properties
}
```
- `HexField` reuses the structure from @docs/implementation-plan.md Phase 1.2 (`coords` + `properties[]`)
- `minPlayers`, `maxPlayers` derived from number of distinct `startingField` base owners; `victoryPoints` set by map author
- Save/load via `JSON.stringify` / `JSON.parse`; persist to `localStorage` keyed by `id`, with export/import as `.json` file

### 2 Board Creator state model
```
BoardCreatorState {
  board: BoardDefinition
  selectedHex: HexKey | null
  tool: "place" | "delete" | "assignProperty" | "removeProperty"
  activeTool PropertyType | null   // which property to assign/remove
}
```

### 3 Field operations
Pure functions (no side effects):
- `addHex(board, coords)` — adds a new empty field; no-op if already exists
- `removeHex(board, coords)` — removes field and all its properties
- `assignProperty(board, coords, property)` — adds or replaces a property of that type on the field
- `removeProperty(board, coords, type)` — removes property of given type from field

### 4 Persistence
- `saveBoard(board)` — serialises to JSON, saves to `localStorage`
- `loadBoard(id)` — reads from `localStorage`, deserialises
- `listBoards()` — returns array of `{ id, name }` for all saved boards
- `deleteBoard(id)` — removes from `localStorage`
- `exportBoardJSON(board)` — triggers browser download of `.json` file
- `importBoardJSON(file)` — reads uploaded `.json` file, returns `BoardDefinition`

### 5 Board Creator UI
- `<BoardCreator>` — top-level editor component
- `<EditorBoard>` — renders the hex grid in edit mode; click adds/removes/selects fields
- `<ToolPanel>` — selects active tool (place, delete, assign property, remove property)
- `<PropertyPanel>` — when a hex is selected, shows its current properties and allows editing; inputs for `owner` (startingField) and `group` / `active` (focalPoint)
- `<MapManager>` — lists saved maps with load, delete, export buttons; import button for `.json` upload
- `<BoardNameInput>` — editable map name field

---

## Tutorial

### 1 Tutorial structure
- A guided interactive tutorial that teaches the game rules step by step through actual gameplay
- Runs as a special game mode (separate route / screen state), accessible from the main menu
- The board, dice, and game UI are fully functional — the tutorial drives the player through a scripted scenario using highlighted prompts and tooltips
- Progress is saved to `localStorage` so the player can resume if interrupted

### 2 Tutorial scenario
- Pre-defined board setup with specific dice positions designed to demonstrate each rule in sequence
- Steps are scripted: each step has a condition that must be met before advancing (e.g. "move this die here")
- Covers in order: moving a die, forming a tower, combat (push and occupy), focal point scoring, tower collapse, reroll, win condition

### 3 Tutorial UI components
- `<TutorialOverlay>` — shows the current instruction text and highlights the relevant piece or hex
- Arrow / pointer indicator pointing at the relevant UI element
- **Skip** button to exit the tutorial at any time
- **Next** button to advance when the step is completed (or auto-advances on correct action)
- Progress indicator showing current step out of total steps

### 4 Scripted scenario engine
- `TutorialStep { instruction: string, highlightHexes: hexKey[], expectedAction: GameAction | null, autoAdvance: boolean }`
- `tutorialReducer(tutorialState, gameAction)` — checks if the player's action matches `expectedAction`; advances the step if so
- Tutorial state is separate from game state; tutorial can inject forced initial game state per step if needed

---

## Online Multiplayer

Online multiplayer allows players to play against each other over the internet. This phase introduces a backend for the first time. The hot-seat local mode remains fully functional alongside online play.

### 1 Backend & transport
- Lightweight Node.js server (e.g. Express + `ws` or Socket.IO) handling game rooms and real-time message passing
- WebSocket connection between clients and server
- All game logic continues to run on the server (authoritative state); clients send actions and receive state updates
- Server validates every action using the same pure game logic functions from @docs/implementation-plan.md Phases 3, 5–7

### 2 Room system
- **Create room** — generates a short room code; host chooses map, player count, and bot slots
- **Join room** — enter room code to join; assigned to a free player slot
- **Lobby screen** — shows connected players, their chosen coats of arms, and ready status; host can start the game when all slots are filled
- **Spectator mode** — additional players can join as observers (no action rights)

### 3 Game state synchronization
- Server holds the authoritative `GameState`; clients hold a local read-only copy
- Client dispatches `GameAction` → server validates → server broadcasts new state to all clients
- Bot players run on the server side in online games

### 4 Reconnection & disconnection handling
- If a player disconnects, their slot is marked as disconnected; other players see a waiting indicator
- Player can rejoin using the same room code within a grace period (TBD); full state is resent on reconnect
- If disconnected player does not reconnect within the grace period, their slot is taken over by a heuristic bot

### 5 Player identity
- Anonymous session-based identity (no account required); player name and coat of arms chosen before joining
- Optional: persistent player profile stored in `localStorage` (name + coat of arms preference)

### 6 Network resilience
- Client shows a connection status indicator (connected / reconnecting / disconnected)
- Optimistic local rendering for own actions where safe; server state always wins on conflict

---

## Open Questions (from CLAUDE.md TODOs)

- **Off-map mixed tower scoring**: does only the attacker score, or both players per die?
- **Tower entry condition**: is the entry check on face value or attack strength? (Plan assumes face value.)
- **Initial die placement**: exact starting hex positions for 5 dice per player.
- **Starting die values**: fixed (e.g., all 3) or random rolls?

---

## Additional Resources

See https://www.redblobgames.com/grids/hexagons/.
