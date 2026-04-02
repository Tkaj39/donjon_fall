# Donjon Fall — Implementation Plan

## Overview

Build a multi-player hex-grid board game as a React web app. The default configuration is two players, but all game logic is designed for N players (N ≥ 2). Phases 1–16 run entirely client-side (hot-seat local play). Phase 17 introduces a backend for online multiplayer over the internet.

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
  - If more than one approach direction is available, wait for player to confirm direction before committing (see section 12.4); `CombatState` includes `approachDirection`

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

## Phase 4: UI Foundation (Phases 1–3)

Presentation-layer React components tied to the game logic implemented in Phases 1–3. All components are stateless (or wrap minimal local state) and derive their display entirely from `GameState` and board data props.

### 4.1 Board rendering
- `<HexTile coords, diceStack, fieldProperties, highlight, isSelected, onClick>` — renders one hex field
  - Background style reflects field type (`focalPoint` active/inactive, `startingField`)
  - `highlight` prop: `null | 'reachable' | 'selected' | 'trajectory' | 'enemy-reachable'`
  - Renders `<Die>` components for each die in the stack (with tower offset)
  - Forwards click to parent via `onClick(hexKey)`
- `<Board state, selectedHex, highlightedHexes, onHexClick>` — renders all 61 `<HexTile>` components
  - Positions hexes using `hexToPixel` for SVG/CSS absolute positioning
  - Derives per-hex highlight from `highlightedHexes` map before passing to `<HexTile>`
  - SVG or CSS-grid based layout; no third-party hex library

### 4.2 Die rendering
- `<Die value, owner, isTop>` — renders a single die face (pip count or numeral)
  - Color and border derived from `owner` player ID
  - `isTop` controls full vs. dimmed appearance in a tower stack
  - Tower stack: multiple `<Die>` elements rendered with a small vertical offset per layer

### 4.3 Focal point marker
- `<FocalPointMarker isActive>` — rendered inside `<HexTile>` for focal point hexes
  - Distinct visual when active (e.g. glowing outline or icon); muted indicator when passive

### 4.4 Movement highlight overlay
- Visual states for highlighted hexes: **reachable** (pale glow), **selected** (bright outline), **trajectory** (path trace), **enemy-reachable** (warning color)
- Derived from `getReachableHexes` / `getJumpReachableHexes` / `getTowerReachableHexes` output (Phase 3)

---

## Phase 5: Combat Logic

### 5.1 Combat eligibility
- `canAttack(state, attackerHex, defenderHex)` — attacker strength > defender strength
- `getAvailableCombatOptions(state)` — ['push', 'occupy'] or just ['push'] for tower-vs-tower move

### 5.2 Push resolution
- `getPushDirection(attackerHex, defenderHex)` — cube direction vector
- `getPushChain(state, defenderHex, direction)` — ordered list of formations to push
- `canPush(state, defenderHex, direction)` — checks free field exists at end of chain
- `applyPush(state)` — returns new state
  - Moves each formation 1 hex in push direction
  - Detects encirclement (own unit blocks retreat) → destroy, score
  - Detects off-map → destroy, score
  - Rerolls one defeated enemy die (min(roll, original))
  - Attacker die decreases by 1 (min 1)

### 5.3 Occupy resolution
- `applyOccupy(state)` — returns new state
  - Places attacker die on top of defender formation
  - Attacker die decreases by 1 (min 1)
  - No defender reroll

### 5.4 Combat overlay
- `<CombatOverlay options, onChoose>` — appears when combat is triggered
- Shows attacker/defender strength, available options (push / occupy)

---

## Phase 6: Focal Point Logic

### 6.1 Focal point scoring phase
- `applyFocalPhase(state, extraDieRoll)` — processes focal points at turn start
  - For each active focal point held by current player at end of previous turn:
    - Award 1 point
    - Reroll that die: min(roll, original − 1)
  - For each scored active focal point: roll extra D6 to select which other passive hex **within the same group** becomes the next active focal point; the mapping of roll values to passive hexes is determined by the number of passive hexes in that group (e.g. with 2 passive hexes: even = first, odd = second)
  - Accept roll values as parameters for purity

### 6.2 Focal point detection (end of action phase)
- `updateFocalHolders(state)` — after action, record which focal points each player's die currently holds

---

## Phase 7: Turn & Phase Management

### 7.1 Phase transitions
- `advancePhase(state, ...rollResults)` — handles transitions:
  - `focal → action`
  - `action → combat` (if combat triggered) or `action → victory` check → `focal` (next turn)
  - `combat → victory` check → `focal` (next turn)
  - `victory → (game over)`
- `endTurn(state)` — advances `currentPlayer` to the next player in `state.players` (wraps around), resets per-turn flags, updates focal holders

### 7.2 Legal move detection
- `hasLegalMoves(state)` — returns false if no action is available (sudden death loss)
- Check: any die can move, any collapse available, any reroll available

### 7.3 Score display
- `<ScoreBoard players, scores>` — shows current VP totals for all players; `players` is the ordered list of player IDs

### 7.4 Phase indicator
- `<PhaseIndicator phase, currentPlayer>` — shows whose turn and current phase

---

## Phase 8: UI Components

### 8.1 Action panel
- `<ActionPanel currentPlayer, availableActions, activeAction, onActionSelect>` — shown at the bottom of the screen after the player selects a piece
- Actions are listed in this fixed order: **Move tower** (hidden if selected piece is not a tower), **Move die**, **Reroll**
- The first applicable action in that order is pre-selected automatically when a piece is selected
- Switching the active action updates the highlighted reachable hexes on the board immediately
- Disabled state when action already taken or action not legal

### 8.2 Victory screen
- `<VictoryScreen winner>` — shown when a player reaches 5 VP or opponent has no moves

### 8.3 Rules viewer
- `<RulesViewer onClose>` — modal or full-screen overlay displaying the game rules
- Accessible from the main menu (section 9.3) and from within an active game (e.g. a **?** button in the game UI)
- Content mirrors the rules defined in CLAUDE.md; structured into collapsible sections (Board & Components, Win Condition, Turn Structure, Actions, Combat, Towers)
- Opening the rules viewer during a game does not pause or affect the game state

---

## Phase 9: Game Setup & Navigation

### 9.1 App screen flow
The app has the following screens in order:

```
Splash screen → Main menu → Map selection → Player setup → Game loading screen → Game
```

Navigation is handled via React Router or a simple top-level screen state machine.

### 9.2 Splash screen
- Shown briefly on app start while assets load
- Displays game logo / title

### 9.3 Main menu
- **Play** button → navigates to Map selection
- **Rules** button → opens the rules viewer (see section 8.3)
- (Further menu options TBD, e.g. credits)

### 9.4 Map selection
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

### 9.5 Player setup
- One player slot per base defined in the selected map
- Each player enters a name and chooses a **coat of arms** (heraldic emblem) from a preset selection
- **Color is not chosen** — it is assigned automatically based on the player's base position in the map (e.g. top base = red, bottom base = blue); the coat of arms is overlaid on that color in the UI
- Confirm → Game loading screen

### 9.6 Game loading screen
- Brief screen shown while `createInitialState` runs and assets for the game screen are prepared
- Shows player names, their colors and coats of arms as a summary before the game begins

---

## Phase 10: Dice Rolling

### 10.1 Random utilities
- `rollD6()` — returns 1–6
- `rollFocalDie()` — returns 1–6 (used to determine which focal point activates)

### 10.2 Initial die placement
- Decide starting positions and values for 5 dice per player (within their base rows)
- Starting values: all dice start at value 3 (or roll randomly — TBD)

---

## Phase 11: Game Orchestration

### 11.1 Game reducer
- `gameReducer(state, action)` — central reducer handling all game actions:
  - `MOVE_DIE`, `MOVE_TOWER`, `JUMP`, `COLLAPSE`, `REROLL`
  - `CHOOSE_COMBAT_OPTION` (push / occupy)
  - `ADVANCE_FOCAL_PHASE`
  - `CONFIRM_ACTION`, `END_TURN`

### 11.2 React state integration
- `useGameState(players, boardFields)` hook — wraps `useReducer(gameReducer, createInitialState(players, boardFields))`
- Exposes: `state`, `dispatch`, and convenience selectors

### 11.3 Top-level game component
- `<Game>` — orchestrates board, UI panels, modals
- Manages selection state (selected hex → highlighted hexes)
- Handles click flow: select unit → select destination → confirm

---

## Phase 12: Interactivity & Polish

### 12.1 Hex selection & highlighting
- Click own piece → select it; action panel appears at the bottom with the first applicable action pre-selected; reachable hexes are highlighted
- Switching action in the panel re-computes and re-highlights reachable hexes
- Deselect on second click on the same piece or Escape

### 12.2 Trajectory planning (Move die / Move tower)
Movement goes through a two-step flow — planning and confirmation:

**Step 1 — Plan trajectory.** Two equivalent input methods:
- **Manual path**: click hexes one by one along the desired route from the selected piece; each click extends the trajectory by one step (highlighted as a path on the board)
- **Auto path**: click directly on any reachable destination hex; the shortest valid path is computed automatically and shown as the planned trajectory

Both methods produce the same result: a highlighted trajectory from the selected piece to a destination hex. The move is **not yet committed** at this point.

**Step 2 — Commit.** Once a trajectory is planned, two options appear:
- **Click the destination hex** (end of trajectory) — commits the move as a plain move; turn moves to the next phase
- **Click an enemy piece** that is reachable from the destination (i.e. adjacent to it and within attack range) — commits the move and immediately triggers combat; the trajectory approach direction determines the push direction (see section 12.3)

Enemy pieces that are reachable from the current trajectory endpoint are highlighted distinctly while a trajectory is planned, signalling that they can be targeted to end the turn.

Pressing Escape or clicking the selected piece cancels the planned trajectory and returns to step 1.

### 12.3 Action disambiguation (non-movement)
- When multiple actions apply to the same hex (e.g. reroll vs. collapse), show a small popup to choose

### 12.4 Approach direction picker
When a player hovers over an enemy-occupied reachable hex and more than one approach direction is available, the hex is visually divided into up to 6 directional segments (like a pie chart). Each segment corresponds to one valid approach direction. The highlighted segment indicates the selected direction — hovering near a segment selects it. Confirming (click) locks in that direction and triggers combat with `approachDirection` set accordingly. If only one approach direction is available, the picker is skipped and the attack proceeds directly.

### 12.6 Animations (optional, later)
- Die movement transition
- Combat flash
- Score increment animation

### 12.7 Responsive layout
- Board scales to viewport
- UI panels reflow for narrow screens

---

## Phase 13: Testing

### 13.1 Unit tests for game logic
- Test all pure logic functions (movement, combat, focal points, scoring)
- Install Vitest + React Testing Library

### 13.2 Integration tests
- Full turn sequences
- Edge cases: die value 1 attacking, tower collapse scoring, chain push encirclement, off-map scoring

---

## Phase 14: UI Tuning & Debugging

### 14.1 Debug overlay
- Toggleable debug mode (keyboard shortcut, e.g. `Ctrl+D`) that overlays game state information on the board:
  - Hex coordinates on each field
  - Attack strength values for each occupied field
  - Focal point group labels and active/passive state
  - Current player, phase, and action taken flag

### 14.2 State inspector
- Read-only panel (collapsible) showing the full serialised `GameState` as formatted JSON
- Useful for diagnosing unexpected game behaviour during development

### 14.3 Action replay
- Ability to record a sequence of game actions and replay them step by step
- Useful for reproducing bugs and verifying rule correctness

### 14.4 Visual tuning
- Fine-tune hex size, spacing, colors, and typography across different screen sizes
- Adjust focal point markers, tower stack visuals, and trajectory highlighting
- Verify color contrast and readability for all player colors

### 14.5 Performance profiling
- Identify and fix rendering bottlenecks (e.g. unnecessary re-renders of all 61 HexTile components)
- Measure minimax bot response time at each difficulty level; adjust depth limits if needed
