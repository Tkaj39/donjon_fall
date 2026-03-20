# Donjon Fall — Implementation Plan
<!-- TODO: Make focal points more general. Define passive focal points array, active focal points array and make sure that focal points can be grouped together. -->
<!-- TODO: Make number of players general. In the future, more players than two should be able to play a game. This makes bases general as well - one base per player. -->

## Overview

Build a two-player hex-grid board game as a React web app. All game logic runs client-side; no backend needed for now. Players share one screen (hot-seat).

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
  | { type: 'startingField', owner: 'red' | 'blue' }
  | { type: 'focalPoint', active: boolean, group: string }
```

- **`startingField`** — marks a field as belonging to a player's base; `owner` identifies which player.
- **`focalPoint`** — marks a field as a focal point; `active` is its current state; `group` is a string identifier (e.g. `'left'`, `'center'`, `'right'`) that links a set of focal point fields — when a focal point activates, it may only move to fields sharing the same `group`.

Helpers:
- `getProperty(field, type)` — returns the property object or null
- `hasProperty(field, type)` — boolean

### 1.3 Board shape definition
- Define the 61-field large hexagon as a set of valid cube coordinates
- Map center at (0,0,0); radius 4 (standard hex grid: 1+6+12+18+24 = 61 fields)
- Assign `startingField` property to red base (top row) and blue base (bottom row)
- Assign `focalPoint` property to the 3 middle-row fields (groups: `'left'`, `'center'`, `'right'`); center starts `active: true`
- Export constants: `BOARD_HEXES`, `RED_BASE_HEXES`, `BLUE_BASE_HEXES`, `FOCAL_POINT_HEXES`

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
  currentPlayer: 'red' | 'blue'
  phase: 'focal' | 'action' | 'combat' | 'victory'
  dice: {
    [hexKey]: Die[]          // hexKey = "q,r,s"
  }
  focalPoints: {
    [hexKey]: FocalPointState  // { isActive, victoryPointsStored }
  }
  scores: { red: number, blue: number }
  activeFocalHolders: { red: hexKey|null, blue: hexKey|null }
    // tracks which hex each player's die held a focal point on at end of previous turn
  combat: CombatState | null
  selectedHex: hexKey | null
  highlightedHexes: hexKey[]
  actionTaken: boolean
}

Die {
  owner: 'red' | 'blue'
  value: 1..6
}

FocalPointState {
  isActive: boolean
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
- `getController(state, hex)` — 'red' | 'blue' | null (player whose die is on top)
- `getTowerSize(state, hex)` — number of dice
- `getAttackStrength(state, attackerHex)` — top die value + own count − enemy count
- `canEnterTower(state, moverDie, targetHex)` — checks if mover's value > current top die value
- `isFocalPointActive(state, hex)` — boolean
- `getActiveFocalPoints(state)` — list of active focal point hexes

### 2.3 Initial state factory
- `createInitialState()` — places 5 dice per player on their base rows (exact starting positions TBD), sets center focal point active, all scores 0

---

## Phase 3: Movement Logic

### 3.1 Path validation for Move Die
- `getReachableHexes(state, fromHex)` — BFS/DFS up to die's face value steps
  - Cannot pass through enemy dice
  - Can pass through own dice only if mover has higher value than top die at that step
  - Returns set of reachable destination hexes (not intermediate paths)
- `getPathsToHex(state, fromHex, toHex)` — returns valid paths (needed for push direction)

### 3.2 Move Die action
- `applyMoveAction(state, fromHex, toHex)` — returns new state
  - Moves die from source to destination
  - If destination occupied by own die: stack (if canEnterTower)
  - If destination occupied by enemy: set phase to 'combat', record CombatState

### 3.3 Tower jump
- `getJumpRange(state, towerHex)` — own dice − enemy dice (min 1)
- `getJumpReachableHexes(state, towerHex)` — hexes reachable by jumping die
- `applyJumpAction(state, towerHex, targetHex)` — returns new state (detach top die, move it)

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
  - For each focal point held by current player at end of previous turn:
    - Award 1 point
    - Reroll that die: min(roll, original − 1)
  - Roll extra D6 to activate second focal point (even = left, odd = right)
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
- `endTurn(state)` — switches `currentPlayer`, resets per-turn flags, updates focal holders

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
- `<ScoreBoard red, blue>` — shows current VP totals for both players

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
- `useGameState()` hook — wraps `useReducer(gameReducer, createInitialState())`
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

### 10.3 Animations (optional, later)
- Die movement transition
- Combat flash
- Score increment animation

### 10.4 Responsive layout
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
