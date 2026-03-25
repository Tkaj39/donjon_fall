# Donjon Fall — Implementation Plan

## TODO

- **Code style** — define and document a consistent code style across `src/` (naming conventions, file structure, JSDoc patterns, import order etc.)
- **Split Phase 7 (UI components)** — instead of implementing all UI components at once in Phase 7, distribute individual components into the phases where their logic is implemented (e.g. `<Die>` in Phase 2, `<HexTile>` / `<Board>` in Phase 1, `<CombatOverlay>` in Phase 4, etc.)

---

## Overview

Build a multi-player hex-grid board game as a React web app. The default configuration is two players, but all game logic is designed for N players (N ≥ 2). Phases 1–15 run entirely client-side (hot-seat local play). Phase 16 introduces a backend for online multiplayer over the internet.

---

## Phase 1: Hex Grid Foundation

### 1.1 Hex coordinate system
- Use cube coordinates (q, r, s) exclusively throughout the codebase. Offset coordinates are not used.
- Utility: `cubeDistance`
- Utility: `getNeighbors(hex)` — returns the 6 adjacent hexes
- Utility: `hexesInRange(hex, range)` — returns all hexes within N steps
- Utility: `getPath(from, to)` — returns ordered list of hexes on a straight line
- Utility: `isOnBoard(hex)` — validates hex belongs to the 61-field large hexagon

### 1.2 Hex field properties
Fields are plain objects with an optional `properties` bag. Two built-in property types:

```
HexField {
  coords: { q, r, s }
  properties: HexProperty[]
}

HexProperty =
  | { type: 'startingField', owner: string }
  | { type: 'focalPoint', active: boolean, group: string }
```

- **`startingField`** — marks a field as belonging to a player's base; `owner` is a player ID string (e.g. `'red'`, `'blue'`, or any future player ID). One base per player.
- **`focalPoint`** — marks a field as a focal point; `active` is its initial state (true = active at game start, false = passive); `group` is a string identifier (e.g. `'left'`, `'center'`, `'right'`) — each group represents one logical focal point position that can migrate between fields sharing the same group. The board definition fully controls the number of focal points, their groups, and which start active.

Helpers:
- `getProperty(field, type)` — returns the property object or null
- `hasProperty(field, type)` — boolean

### 1.3 Board shape definition
- Define the 61-field large hexagon as a set of valid cube coordinates
- Map center at (0,0,0); radius 4 (standard hex grid: 1+6+12+18+24 = 61 fields)
- Assign `startingField` property to each player's base row; `owner` = player ID (default map: `'red'` top row, `'blue'` bottom row)
- Assign `focalPoint` property to the 3 middle-row fields; all three share the same group ID (e.g. `'main'`), meaning they form one focal point group where the D6 roll picks which passive hex activates next; center starts `active: true`, left and right start `active: false`
- Export constants: `BOARD_HEXES`, `BASE_HEXES` (map `{ [playerId]: HexField[] }`), `FOCAL_POINT_HEXES`, `ACTIVE_FOCAL_HEXES`, `PASSIVE_FOCAL_HEXES`

### 1.5 Hex rendering component
- `<HexTile hex coords, content, state, onClick>` — renders a single SVG hexagon
- Props: `hex`, `isHighlighted`, `isFocalPoint`, `isSelected`, `onClick`
- Flat-top or pointy-top orientation (pick one, stay consistent — pointy-top recommended)
- Pixel conversion: `hexToPixel(hex, size)` for SVG positioning

### 1.6 Board rendering component
- `<Board>` — renders all 61 `<HexTile>` components inside an SVG
- Handles board-level click delegation
- Static render with no game state yet — just the empty board with focal point markers

---

## Phase 2: Game State Model

### 2.1 Data structures
Define the canonical shape of game state as plain JS objects (no classes):

```
GameState {
  players: string[]            // ordered list of player IDs, e.g. ['red', 'blue']
  currentPlayer: string        // player ID of the active player
  phase: 'focal' | 'action' | 'combat' | 'victory'
  dice: {
    [hexKey]: Die[]            // hexKey = "q,r,s"
  }
  focalPoints: {
    [hexKey]: FocalPointState
  }
  scores: { [playerId]: number }
  activeFocalHolders: { [playerId]: hexKey|null }
    // tracks which hex each player's die held an active focal point on at end of previous turn
  combat: CombatState | null
  selectedHex: hexKey | null
  highlightedHexes: hexKey[]
  actionTaken: boolean
}

Die {
  owner: string        // player ID
  value: 1..6
}

FocalPointState {
  isActive: boolean
  group: string        // copied from board definition; used to find sibling fields in the same group
}

CombatState {
  attackerHex: hexKey
  defenderHex: hexKey
  options: ('push' | 'occupy')[]
}
```

### 2.2 Derived selectors
Pure functions that compute derived data from state:
- `getDiceAt(state, hex)` — array of dice at a hex
- `getTopDie(state, hex)` — topmost die
- `getController(state, hex)` — player ID | null (player whose die is on top)
- `getTowerSize(state, hex)` — number of dice
- `getAttackStrength(state, attackerHex)` — top die value + own count − enemy count
- `canEnterTower(state, moverDie, targetHex)` — checks if mover's value > current top die value
- `isFocalPointActive(state, hex)` — boolean
- `getActiveFocalPoints(state)` — list of active focal point hexes

### 2.3 Initial state factory
- `createInitialState(players, boardFields)` — takes ordered player ID list and board field definitions; places 5 dice per player on their respective base rows (exact starting positions TBD), initialises focal point states from `boardFields` (`active`/`passive` as defined in the board), all scores 0

---

## Phase 3: Movement Logic

### 3.1 Path validation for Move Die
- `getReachableHexes(state, fromHex)` — BFS/DFS up to die's face value steps
  - Cannot pass through enemy dice
  - Can pass through own dice only if mover has higher value than top die at that step
  - Returns set of reachable destination hexes (not intermediate paths)
- `getPathsToHex(state, fromHex, toHex)` — returns valid paths (needed for push direction)
- `getApproachDirections(state, fromHex, toHex)` — returns the set of distinct directions from which the attacker can arrive at `toHex` (i.e. unique last-step neighbors), derived from all valid paths; only relevant when destination is enemy-occupied

### 3.2 Move Die action
- `applyMoveAction(state, fromHex, toHex)` — returns new state
  - Moves die from source to destination
  - If destination occupied by own die: stack (if canEnterTower)
  - If destination occupied by enemy: set phase to 'combat', record CombatState
  - If more than one approach direction is available, wait for player to confirm direction before committing (see section 11.4); `CombatState` includes `approachDirection`

### 3.3 Tower jump
- `getJumpRange(state, towerHex)` — own dice − enemy dice (min 1)
- `getJumpReachableHexes(state, towerHex)` — hexes reachable by jumping die
- `applyJumpAction(state, towerHex, targetHex)` — returns new state (detach top die, move it)
- **Attack strength for a jump** uses the jumping die's face value alone — no tower bonus. This differs from a normal move that ends on an enemy (where attack strength = top die value + own dice count − enemy dice count). `getAttackStrength` must receive context indicating whether the attacker jumped.

### 3.4 Move Whole Tower action
- `getTowerMoveRange(state, towerHex)` — own dice − enemy dice (min 1)
- `getTowerReachableHexes(state, towerHex)` — valid destination hexes for whole tower
- `applyMoveTowerAction(state, fromHex, toHex)` — returns new state
  - If destination has enemy: combat with push only

### 3.5 Tower Collapse action
- `canCollapse(state, hex)` — tower has 3+ dice AND current player is on top
- `applyCollapseAction(state, hex)` — removes bottom die, scores point if enemy

### 3.6 Reroll action
- `applyRerollAction(state, hex, newValue)` — rerolls top die, keeps original if new < original
  - Accept `newValue` as parameter so logic is pure/testable; UI passes actual random roll

---

## Phase 4: Combat Logic

### 4.1 Combat eligibility
- `canAttack(state, attackerHex, defenderHex)` — attacker strength > defender strength
- `getAvailableCombatOptions(state)` — ['push', 'occupy'] or just ['push'] for tower-vs-tower move

### 4.2 Push resolution
- `getPushDirection(attackerHex, defenderHex)` — cube direction vector
- `getPushChain(state, defenderHex, direction)` — ordered list of formations to push
- `canPush(state, defenderHex, direction)` — checks free field exists at end of chain
- `applyPush(state)` — returns new state
  - Moves each formation 1 hex in push direction
  - Detects encirclement (own unit blocks retreat) → destroy, score
  - Detects off-map → destroy, score
  - Rerolls one defeated enemy die (min(roll, original))
  - Attacker die decreases by 1 (min 1)

### 4.3 Occupy resolution
- `applyOccupy(state)` — returns new state
  - Places attacker die on top of defender formation
  - Attacker die decreases by 1 (min 1)
  - No defender reroll

---

## Phase 5: Focal Point Logic

### 5.1 Focal point scoring phase
- `applyFocalPhase(state, extraDieRoll)` — processes focal points at turn start
  - For each active focal point held by current player at end of previous turn:
    - Award 1 point
    - Reroll that die: min(roll, original − 1)
  - For each scored active focal point: roll extra D6 to select which other passive hex **within the same group** becomes the next active focal point; the mapping of roll values to passive hexes is determined by the number of passive hexes in that group (e.g. with 2 passive hexes: even = first, odd = second)
  - Accept roll values as parameters for purity

### 5.2 Focal point detection (end of action phase)
- `updateFocalHolders(state)` — after action, record which focal points each player's die currently holds

---

## Phase 6: Turn & Phase Management

### 6.1 Phase transitions
- `advancePhase(state, ...rollResults)` — handles transitions:
  - `focal → action`
  - `action → combat` (if combat triggered) or `action → victory` check → `focal` (next turn)
  - `combat → victory` check → `focal` (next turn)
  - `victory → (game over)`
- `endTurn(state)` — advances `currentPlayer` to the next player in `state.players` (wraps around), resets per-turn flags, updates focal holders

### 6.2 Legal move detection
- `hasLegalMoves(state)` — returns false if no action is available (sudden death loss)
- Check: any die can move, any collapse available, any reroll available

---

## Phase 7: UI Components

### 7.1 Die component
- `<Die value, owner, isTop>` — renders die face (pip count or number) on a hex
- Stacked dice shown with offset/shadow to indicate tower height

### 7.2 Focal point marker
- Visual indicator on focal point hexes (active vs. inactive)
- Victory point token count display on focal point

### 7.3 Score display
- `<ScoreBoard players, scores>` — shows current VP totals for all players; `players` is the ordered list of player IDs

### 7.4 Action panel
- `<ActionPanel currentPlayer, availableActions, activeAction, onActionSelect>` — shown at the bottom of the screen after the player selects a piece
- Actions are listed in this fixed order: **Move tower** (hidden if selected piece is not a tower), **Move die**, **Reroll**
- The first applicable action in that order is pre-selected automatically when a piece is selected
- Switching the active action updates the highlighted reachable hexes on the board immediately
- Disabled state when action already taken or action not legal

### 7.5 Phase indicator
- `<PhaseIndicator phase, currentPlayer>` — shows whose turn and current phase

### 7.6 Combat modal / overlay
- `<CombatOverlay options, onChoose>` — appears when combat is triggered
- Shows attacker/defender strength, available options (push / occupy)

### 7.7 Victory screen
- `<VictoryScreen winner>` — shown when a player reaches 5 VP or opponent has no moves

### 7.8 Rules viewer
- `<RulesViewer onClose>` — modal or full-screen overlay displaying the game rules
- Accessible from the main menu (section 8.3) and from within an active game (e.g. a **?** button in the game UI)
- Content mirrors the rules defined in CLAUDE.md; structured into collapsible sections (Board & Components, Win Condition, Turn Structure, Actions, Combat, Towers)
- Opening the rules viewer during a game does not pause or affect the game state

---

## Phase 8: Game Setup & Navigation

### 8.1 App screen flow
The app has the following screens in order:

```
Splash screen → Main menu → Map selection → Player setup → Game loading screen → Game
```

Navigation is handled via React Router or a simple top-level screen state machine.

### 8.2 Splash screen
- Shown briefly on app start while assets load
- Displays game logo / title

### 8.3 Main menu
- **Play** button → navigates to Map selection
- **Rules** button → opens the rules viewer (see section 8.7)
- (Further menu options TBD, e.g. credits)

### 8.4 Map selection
- Lists all available maps (built-in default map + any saved maps from Board Creator)
- Each map card displays:
  - Preview thumbnail of the board layout
  - Map name
  - Number of players (min–max supported by the map, derived from number of `startingField` bases)
  - Victory point target (e.g. "First to 5 VP")
- Selecting a map proceeds to Player setup

`BoardDefinition` is extended with:
```
BoardDefinition {
  ...
  minPlayers: number      // derived from number of distinct base owners in the map
  maxPlayers: number      // same as minPlayers for fixed-player maps; may differ for flexible maps
  victoryPoints: number   // VP needed to win
}
```

### 8.5 Player setup
- One player slot per base defined in the selected map
- Each player enters a name and chooses a **coat of arms** (heraldic emblem) from a preset selection
- **Color is not chosen** — it is assigned automatically based on the player's base position in the map (e.g. top base = red, bottom base = blue); the coat of arms is overlaid on that color in the UI
- Confirm → Game loading screen

### 8.6 Game loading screen
- Brief screen shown while `createInitialState` runs and assets for the game screen are prepared
- Shows player names, their colors and coats of arms as a summary before the game begins

---

## Phase 9: Dice Rolling

### 9.1 Random utilities
- `rollD6()` — returns 1–6
- `rollFocalDie()` — returns 1–6 (used to determine which focal point activates)

### 9.2 Initial die placement
- Decide starting positions and values for 5 dice per player (within their base rows)
- Starting values: all dice start at value 3 (or roll randomly — TBD)

---

## Phase 10: Game Orchestration

### 10.1 Game reducer
- `gameReducer(state, action)` — central reducer handling all game actions:
  - `MOVE_DIE`, `MOVE_TOWER`, `JUMP`, `COLLAPSE`, `REROLL`
  - `CHOOSE_COMBAT_OPTION` (push / occupy)
  - `ADVANCE_FOCAL_PHASE`
  - `CONFIRM_ACTION`, `END_TURN`

### 10.2 React state integration
- `useGameState(players, boardFields)` hook — wraps `useReducer(gameReducer, createInitialState(players, boardFields))`
- Exposes: `state`, `dispatch`, and convenience selectors

### 10.3 Top-level game component
- `<Game>` — orchestrates board, UI panels, modals
- Manages selection state (selected hex → highlighted hexes)
- Handles click flow: select unit → select destination → confirm

---

## Phase 11: Interactivity & Polish

### 11.1 Hex selection & highlighting
- Click own piece → select it; action panel appears at the bottom with the first applicable action pre-selected; reachable hexes are highlighted
- Switching action in the panel re-computes and re-highlights reachable hexes
- Deselect on second click on the same piece or Escape

### 11.2 Trajectory planning (Move die / Move tower)
Movement goes through a two-step flow — planning and confirmation:

**Step 1 — Plan trajectory.** Two equivalent input methods:
- **Manual path**: click hexes one by one along the desired route from the selected piece; each click extends the trajectory by one step (highlighted as a path on the board)
- **Auto path**: click directly on any reachable destination hex; the shortest valid path is computed automatically and shown as the planned trajectory

Both methods produce the same result: a highlighted trajectory from the selected piece to a destination hex. The move is **not yet committed** at this point.

**Step 2 — Commit.** Once a trajectory is planned, two options appear:
- **Click the destination hex** (end of trajectory) — commits the move as a plain move; turn moves to the next phase
- **Click an enemy piece** that is reachable from the destination (i.e. adjacent to it and within attack range) — commits the move and immediately triggers combat; the trajectory approach direction determines the push direction (see section 11.3)

Enemy pieces that are reachable from the current trajectory endpoint are highlighted distinctly while a trajectory is planned, signalling that they can be targeted to end the turn.

Pressing Escape or clicking the selected piece cancels the planned trajectory and returns to step 1.

### 11.3 Action disambiguation (non-movement)
- When multiple actions apply to the same hex (e.g. reroll vs. collapse), show a small popup to choose

### 11.4 Approach direction picker
When a player hovers over an enemy-occupied reachable hex and more than one approach direction is available, the hex is visually divided into up to 6 directional segments (like a pie chart). Each segment corresponds to one valid approach direction. The highlighted segment indicates the selected direction — hovering near a segment selects it. Confirming (click) locks in that direction and triggers combat with `approachDirection` set accordingly. If only one approach direction is available, the picker is skipped and the attack proceeds directly.

### 11.6 Animations (optional, later)
- Die movement transition
- Combat flash
- Score increment animation

### 11.7 Responsive layout
- Board scales to viewport
- UI panels reflow for narrow screens

---

## Phase 12: Testing

### 12.1 Unit tests for game logic
- Test all pure logic functions (movement, combat, focal points, scoring)
- Install Vitest + React Testing Library

### 12.2 Integration tests
- Full turn sequences
- Edge cases: die value 1 attacking, tower collapse scoring, chain push encirclement, off-map scoring

---

## Phase 13: AI Opponent

A computer-controlled player that can take any player slot. All bots share a common interface so the game loop treats them identically to human players.

### 13.1 AI player interface
- `AIPlayer { id: string, getAction(state): Promise<GameAction> }` — abstract interface all bots implement
- The game loop calls `getAction` automatically when `currentPlayer` matches an AI player's ID
- A small artificial delay is added before the bot commits its action so moves feel natural
- The game setup screen (Phase 8.5) allows each player slot to be assigned to a human or to a bot at a chosen difficulty level

### 13.2 Random bot
- Enumerates all legal actions and picks one uniformly at random
- Useful as a baseline and for automated testing of game logic

### 13.3 Heuristic bot
Rule-based decision making, evaluated in priority order:
- Attack any enemy that can be beaten (highest attack-strength advantage first)
- Occupy active focal points if reachable
- Move towards the nearest enemy
- Reroll any die whose value is below average
- Fall back to a random legal move

### 13.4 Minimax bot (with alpha-beta pruning)
- Builds a game tree to a configurable search depth
- Evaluation function considers: score differential, focal point control, total die value on board, board position (proximity to focal points)
- Alpha-beta pruning to reduce search space
- Runs in a Web Worker to avoid blocking the UI thread

### 13.5 Difficulty levels
| Level  | Bot            | Notes                          |
|--------|----------------|--------------------------------|
| Easy   | Random bot     | Completely unpredictable       |
| Medium | Heuristic bot  | Plays sensibly, no lookahead   |
| Hard   | Minimax depth 3| Looks ahead, plays well        |
| Expert | Minimax depth 5| Slow but strong                |

### 13.6 Game loop integration
- `createInitialState` accepts a `botPlayers: { [playerId]: AIPlayer }` map
- After each human action that ends a turn, the reducer detects the next player is a bot and dispatches `BOT_MOVE` automatically
- Bot actions go through the same reducer as human actions — no special-casing in game logic

---

## Phase 14: Board Creator

A standalone editor tool (separate React route or page) for designing, saving, and loading game maps. Produces JSON files consumed by the game itself.

### 14.1 Board data format (JSON)
```
BoardDefinition {
  id: string               // unique map identifier
  name: string
  hexes: HexField[]        // all fields with their coords and properties
}
```
- `HexField` reuses the structure from Phase 1.2 (`coords` + `properties[]`)
- `minPlayers`, `maxPlayers` derived from number of distinct `startingField` base owners; `victoryPoints` set by map author
- Save/load via `JSON.stringify` / `JSON.parse`; persist to `localStorage` keyed by `id`, with export/import as `.json` file

### 14.2 Board Creator state model
```
BoardCreatorState {
  board: BoardDefinition
  selectedHex: HexKey | null
  tool: 'place' | 'delete' | 'assignProperty' | 'removeProperty'
  activeTool PropertyType | null   // which property to assign/remove
}
```

### 14.3 Field operations
Pure functions (no side effects):
- `addHex(board, coords)` — adds a new empty field; no-op if already exists
- `removeHex(board, coords)` — removes field and all its properties
- `assignProperty(board, coords, property)` — adds or replaces a property of that type on the field
- `removeProperty(board, coords, type)` — removes property of given type from field

### 14.4 Persistence
- `saveBoard(board)` — serialises to JSON, saves to `localStorage`
- `loadBoard(id)` — reads from `localStorage`, deserialises
- `listBoards()` — returns array of `{ id, name }` for all saved boards
- `deleteBoard(id)` — removes from `localStorage`
- `exportBoardJSON(board)` — triggers browser download of `.json` file
- `importBoardJSON(file)` — reads uploaded `.json` file, returns `BoardDefinition`

### 14.5 Board Creator UI
- `<BoardCreator>` — top-level editor component
- `<EditorBoard>` — renders the hex grid in edit mode; click adds/removes/selects fields
- `<ToolPanel>` — selects active tool (place, delete, assign property, remove property)
- `<PropertyPanel>` — when a hex is selected, shows its current properties and allows editing; inputs for `owner` (startingField) and `group` / `active` (focalPoint)
- `<MapManager>` — lists saved maps with load, delete, export buttons; import button for `.json` upload
- `<BoardNameInput>` — editable map name field

---

## Phase 15: Tutorial

### 15.1 Tutorial structure
- A guided interactive tutorial that teaches the game rules step by step through actual gameplay
- Runs as a special game mode (separate route / screen state), accessible from the main menu
- The board, dice, and game UI are fully functional — the tutorial drives the player through a scripted scenario using highlighted prompts and tooltips
- Progress is saved to `localStorage` so the player can resume if interrupted

### 15.2 Tutorial scenario
- Pre-defined board setup with specific dice positions designed to demonstrate each rule in sequence
- Steps are scripted: each step has a condition that must be met before advancing (e.g. "move this die here")
- Covers in order: moving a die, forming a tower, combat (push and occupy), focal point scoring, tower collapse, reroll, win condition

### 15.3 Tutorial UI components
- `<TutorialOverlay>` — shows the current instruction text and highlights the relevant piece or hex
- Arrow / pointer indicator pointing at the relevant UI element
- **Skip** button to exit the tutorial at any time
- **Next** button to advance when the step is completed (or auto-advances on correct action)
- Progress indicator showing current step out of total steps

### 15.4 Scripted scenario engine
- `TutorialStep { instruction: string, highlightHexes: hexKey[], expectedAction: GameAction | null, autoAdvance: boolean }`
- `tutorialReducer(tutorialState, gameAction)` — checks if the player's action matches `expectedAction`; advances the step if so
- Tutorial state is separate from game state; tutorial can inject forced initial game state per step if needed

---

## Phase 16: Online Multiplayer

Online multiplayer allows players to play against each other over the internet. This phase introduces a backend for the first time. The hot-seat local mode remains fully functional alongside online play.

### 16.1 Backend & transport
- Lightweight Node.js server (e.g. Express + `ws` or Socket.IO) handling game rooms and real-time message passing
- WebSocket connection between clients and server
- All game logic continues to run on the server (authoritative state); clients send actions and receive state updates
- Server validates every action using the same pure game logic functions from Phase 3–6

### 16.2 Room system
- **Create room** — generates a short room code; host chooses map, player count, and bot slots
- **Join room** — enter room code to join; assigned to a free player slot
- **Lobby screen** — shows connected players, their chosen coats of arms, and ready status; host can start the game when all slots are filled
- **Spectator mode** — additional players can join as observers (no action rights)

### 16.3 Game state synchronisation
- Server holds the authoritative `GameState`; clients hold a local read-only copy
- Client dispatches `GameAction` → server validates → server broadcasts new state to all clients
- Bot players (Phase 13) run on the server side in online games

### 16.4 Reconnection & disconnection handling
- If a player disconnects, their slot is marked as disconnected; other players see a waiting indicator
- Player can rejoin using the same room code within a grace period (TBD); full state is resent on reconnect
- If disconnected player does not reconnect within the grace period, their slot is taken over by a heuristic bot

### 16.5 Player identity
- Anonymous session-based identity (no account required); player name and coat of arms chosen before joining
- Optional: persistent player profile stored in `localStorage` (name + coat of arms preference)

### 16.6 Network resilience
- Client shows a connection status indicator (connected / reconnecting / disconnected)
- Optimistic local rendering for own actions where safe; server state always wins on conflict

---

## Phase 17: UI Tuning & Debugging

### 17.1 Debug overlay
- Toggleable debug mode (keyboard shortcut, e.g. `Ctrl+D`) that overlays game state information on the board:
  - Hex coordinates on each field
  - Attack strength values for each occupied field
  - Focal point group labels and active/passive state
  - Current player, phase, and action taken flag

### 17.2 State inspector
- Read-only panel (collapsible) showing the full serialised `GameState` as formatted JSON
- Useful for diagnosing unexpected game behaviour during development

### 17.3 Action replay
- Ability to record a sequence of game actions and replay them step by step
- Useful for reproducing bugs and verifying rule correctness

### 17.4 Visual tuning
- Fine-tune hex size, spacing, colors, and typography across different screen sizes
- Adjust focal point markers, tower stack visuals, and trajectory highlighting
- Verify color contrast and readability for all player colors

### 17.5 Performance profiling
- Identify and fix rendering bottlenecks (e.g. unnecessary re-renders of all 61 HexTile components)
- Measure minimax bot response time at each difficulty level; adjust depth limits if needed

---

## Suggested Implementation Order

1. Phase 1 (hex utilities + board render) — visual foundation
2. Phase 2 (state model) — data foundation
3. Phase 9.1 (roll utilities) — needed by almost everything
4. Phase 3 (movement logic) — core gameplay
5. Phase 4 (combat) — core gameplay
6. Phase 5 (focal points) — scoring
7. Phase 6 (turn management) — game loop
8. Phase 10 (reducer + hook) — wire logic to React
9. Phase 7 (UI components) — playable UI
10. Phase 11 (interactivity polish) — UX
11. Phase 8 (game setup & navigation) — full app flow
12. Phase 12 (tests) — confidence
13. Phase 13 (AI opponent) — single-player support
14. Phase 14 (board creator) — map authoring tool
15. Phase 15 (tutorial) — guided interactive tutorial
16. Phase 16 (online multiplayer) — play over the internet
17. Phase 17 (UI tuning & debugging) — polish and diagnostics

---

## Open Questions (from CLAUDE.md TODOs)

- **Off-map mixed tower scoring**: does only the attacker score, or both players per die?
- **Tower entry condition**: is the entry check on face value or attack strength? (Plan assumes face value.)
- **Initial die placement**: exact starting hex positions for 5 dice per player.
- **Starting die values**: fixed (e.g., all 3) or random rolls?

---

## Additional Resources

See https://www.redblobgames.com/grids/hexagons/.
