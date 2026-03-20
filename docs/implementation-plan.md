# Donjon Fall — Implementation Plan

## Overview

Build a multi-player hex-grid board game as a React web app. The default configuration is two players, but all game logic is designed for N players (N ≥ 2). All logic runs client-side; no backend needed for now. Players share one screen (hot-seat).

---

## Phase 1: Hex Grid Foundation

### 1.1 Hex coordinate system
- Implement cube coordinates (q, r, s) for hexagons
- Utility: `cubeToOffset`, `offsetToCube`, `cubeDistance`
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
- Assign `focalPoint` property to the 3 middle-row fields (groups: `'left'`, `'center'`, `'right'`); center starts `active: true`, left and right start `active: false`
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
  - If more than one approach direction is available, wait for player to confirm direction before committing (see section 10.3); `CombatState` includes `approachDirection`

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
  - If any passive focal points exist: roll extra D6 to select one passive group to activate; the mapping of roll values to groups is determined by the number of passive groups (e.g. with 2 passive groups: even = first, odd = second)
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
- `<ActionPanel currentPlayer, availableActions, onAction>` — buttons for the 4 actions
- Disabled state when action already taken or action not legal

### 7.5 Phase indicator
- `<PhaseIndicator phase, currentPlayer>` — shows whose turn and current phase

### 7.6 Combat modal / overlay
- `<CombatOverlay options, onChoose>` — appears when combat is triggered
- Shows attacker/defender strength, available options (push / occupy)

### 7.7 Victory screen
- `<VictoryScreen winner>` — shown when a player reaches 5 VP or opponent has no moves

---

## Phase 8: Dice Rolling

### 8.1 Random utilities
- `rollD6()` — returns 1–6
- `rollFocalDie()` — returns 1–6 (used to determine which focal point activates)

### 8.2 Initial die placement
- Decide starting positions and values for 5 dice per player (within their base rows)
- Starting values: all dice start at value 3 (or roll randomly — TBD)

---

## Phase 9: Game Orchestration

### 9.1 Game reducer
- `gameReducer(state, action)` — central reducer handling all game actions:
  - `MOVE_DIE`, `MOVE_TOWER`, `JUMP`, `COLLAPSE`, `REROLL`
  - `CHOOSE_COMBAT_OPTION` (push / occupy)
  - `ADVANCE_FOCAL_PHASE`
  - `CONFIRM_ACTION`, `END_TURN`

### 9.2 React state integration
- `useGameState(players, boardFields)` hook — wraps `useReducer(gameReducer, createInitialState(players, boardFields))`
- Exposes: `state`, `dispatch`, and convenience selectors

### 9.3 Top-level game component
- `<Game>` — orchestrates board, UI panels, modals
- Manages selection state (selected hex → highlighted hexes)
- Handles click flow: select unit → select destination → confirm

---

## Phase 10: Interactivity & Polish

### 10.1 Hex selection & highlighting
- Click own die → highlight reachable hexes for the chosen action
- Click highlighted hex → dispatch action
- Deselect on second click or Escape

### 10.2 Action disambiguation
- When multiple actions apply to same hex (e.g. move vs. jump), show a small popup to choose

### 10.3 Approach direction picker
When a player hovers over an enemy-occupied reachable hex and more than one approach direction is available, the hex is visually divided into up to 6 directional segments (like a pie chart). Each segment corresponds to one valid approach direction. The highlighted segment indicates the selected direction — hovering near a segment selects it. Confirming (click) locks in that direction and triggers combat with `approachDirection` set accordingly. If only one approach direction is available, the picker is skipped and the attack proceeds directly.

### 10.5 Animations (optional, later)
- Die movement transition
- Combat flash
- Score increment animation

### 10.6 Responsive layout
- Board scales to viewport
- UI panels reflow for narrow screens

---

## Phase 11: Testing

### 11.1 Unit tests for game logic
- Test all pure logic functions (movement, combat, focal points, scoring)
- Install Vitest + React Testing Library

### 11.2 Integration tests
- Full turn sequences
- Edge cases: die value 1 attacking, tower collapse scoring, chain push encirclement, off-map scoring

---

## Phase 12: Board Creator

A standalone editor tool (separate React route or page) for designing, saving, and loading game maps. Produces JSON files consumed by the game itself.

### 12.1 Board data format (JSON)
```
BoardDefinition {
  id: string               // unique map identifier
  name: string
  hexes: HexField[]        // all fields with their coords and properties
}
```
- `HexField` reuses the structure from Phase 1.2 (`coords` + `properties[]`)
- Save/load via `JSON.stringify` / `JSON.parse`; persist to `localStorage` keyed by `id`, with export/import as `.json` file

### 12.2 Board Creator state model
```
BoardCreatorState {
  board: BoardDefinition
  selectedHex: HexKey | null
  tool: 'place' | 'delete' | 'assignProperty' | 'removeProperty'
  activeTool PropertyType | null   // which property to assign/remove
}
```

### 12.3 Field operations
Pure functions (no side effects):
- `addHex(board, coords)` — adds a new empty field; no-op if already exists
- `removeHex(board, coords)` — removes field and all its properties
- `assignProperty(board, coords, property)` — adds or replaces a property of that type on the field
- `removeProperty(board, coords, type)` — removes property of given type from field

### 12.4 Persistence
- `saveBoard(board)` — serialises to JSON, saves to `localStorage`
- `loadBoard(id)` — reads from `localStorage`, deserialises
- `listBoards()` — returns array of `{ id, name }` for all saved boards
- `deleteBoard(id)` — removes from `localStorage`
- `exportBoardJSON(board)` — triggers browser download of `.json` file
- `importBoardJSON(file)` — reads uploaded `.json` file, returns `BoardDefinition`

### 12.5 Board Creator UI
- `<BoardCreator>` — top-level editor component
- `<EditorBoard>` — renders the hex grid in edit mode; click adds/removes/selects fields
- `<ToolPanel>` — selects active tool (place, delete, assign property, remove property)
- `<PropertyPanel>` — when a hex is selected, shows its current properties and allows editing; inputs for `owner` (startingField) and `group` / `active` (focalPoint)
- `<MapManager>` — lists saved maps with load, delete, export buttons; import button for `.json` upload
- `<BoardNameInput>` — editable map name field

---

## Suggested Implementation Order

1. Phase 1 (hex utilities + board render) — visual foundation
2. Phase 2 (state model) — data foundation
3. Phase 8.1 (roll utilities) — needed by almost everything
4. Phase 3 (movement logic) — core gameplay
5. Phase 4 (combat) — core gameplay
6. Phase 5 (focal points) — scoring
7. Phase 6 (turn management) — game loop
8. Phase 9 (reducer + hook) — wire logic to React
9. Phase 7 (UI components) — playable UI
10. Phase 10 (interactivity polish) — UX
11. Phase 11 (tests) — confidence
12. Phase 12 (board creator) — map authoring tool

---

## Open Questions (from CLAUDE.md TODOs)

- **Off-map mixed tower scoring**: does only the attacker score, or both players per die?
- **Tower entry condition**: is the entry check on face value or attack strength? (Plan assumes face value.)
- **Initial die placement**: exact starting hex positions for 5 dice per player.
- **Starting die values**: fixed (e.g., all 3) or random rolls?

---

## Additional Resources

See https://www.redblobgames.com/grids/hexagons/.
