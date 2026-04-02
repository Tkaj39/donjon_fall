# Donjon Fall — Code Style

Applies to all files under `src/`. Update this document when new patterns are introduced.

---

## Language & Modules

- **Vanilla JavaScript** (ES Modules, `.js` extension). No TypeScript.
- Types are documented via JSDoc `@typedef` (defined in `src/game/gameState.js`).
- Every file ends with a newline.

---

## File Extension in Imports

Always include the `.js` extension in import paths:

```js
// ✅ correct
import { hexKey } from "../hex/hexUtils.js";
import { getDiceAt } from "./gameState.js";

// ❌ wrong — missing .js
import { hexKey } from "../hex/hexUtils";
```

> **Note:** Some older files under `src/hex/` still omit the extension — fix them when touched.

---

## Import Order

1. External packages (none yet).
2. Internal imports — deeper paths first (`../hex/…`), then same-directory (`./…`), alphabetical within each group.

```js
import { hexKey, hexFromKey, getNeighbors, hexesDistance } from "../hex/hexUtils.js";
import { isOnBoard } from "../hex/boardUtils.js";
import { getDiceAt, getTopDie, getController } from "./gameState.js";
```

---

## Exports

- **Named exports only** — `export function`, `export const`. No default exports.
- Internal helpers are **not** exported.

```js
// ✅ public API
export function getReachableHexes(state, fromKey) { … }

// internal helper — no export keyword
function canTraverseThrough(state, moverDie, neighborKey) { … }
```

---

## Naming Conventions

| Category | Convention | Examples |
|---|---|---|
| Functions | `camelCase`, verb-first | `getDiceAt`, `applyMoveAction`, `createInitialState` |
| Constants | `UPPER_SNAKE_CASE` | `BOARD_RADIUS`, `FOCAL_POINT_KEYS` |
| Parameters / variables | `camelCase` | `fromKey`, `towerKey`, `moverDie`, `newValue` |
| Hex key parameters | `…Key` or `…Hex` suffix | `fromKey`, `toKey`, `attackerHex`, `defenderHex` |
| Boolean predicates | `can…` / `is…` / `has…` | `canCollapse`, `isOnBoard`, `hasProperty` |
| Factory functions | `create…` | `createInitialState` |
| Selector functions | `get…` | `getDiceAt`, `getTopDie`, `getController` |
| Action appliers | `apply…Action` | `applyMoveAction`, `applyCollapseAction`, `applyRerollAction` |

---

## Function Style

- Prefer **`function` declarations** for exported functions.
- Use **arrow functions** only for inline callbacks and small helpers inside a function body.
- **Guard clauses** for invalid input at the top; return early rather than deep-nesting.

```js
export function applyCollapseAction(state, hex) {
    if (!canCollapse(state, hex)) return state;  // guard clause
    // … rest of logic
}
```

---

## JSDoc

Every function (exported and internal) and typedef gets a JSDoc block:

```js
/**
 * One-line summary sentence.
 *
 * Optional longer description when the behaviour is non-obvious.
 *
 * @param {GameState} state
 * @param {string} hex  - hexKey of the target field
 * @returns {boolean}
 */
export function canCollapse(state, hex) { … }
```

- Use `{GameState}`, `{Die}`, `{string}`, `{number}`, `{boolean}`, `{Set<string>}`, `{string[][]}`, etc.
- In files that don't import the typedef directly, cross-reference with `{import("./gameState.js").GameState}`.

---

## File Structure

Each `.js` file follows this layout:

1. **File-level comment** — one-line or short block describing the file's purpose and phase.
2. **Imports.**
3. **Private constants** (if any).
4. **Internal helpers** (unexported).
5. **Exported functions/constants**, grouped by phase or topic with 75-dash section separators.

Section separator format:

```js
// ---------------------------------------------------------------------------
// 3.2 — applyMoveAction
// ---------------------------------------------------------------------------
```

---

## State Immutability

All game logic functions are **pure** — they return a new state object; they never mutate the input.

```js
// ✅ correct — spread to create new objects
const newDice = { ...state.dice, [hex]: newStack };
return { ...state, dice: newDice, actionTaken: true };

// ❌ wrong — mutates input
state.dice[hex] = newStack;
return state;
```

For dice stacks: use `slice()` and spread to create new arrays. Never `push` / `pop` in-place.

---

## Data Conventions

- **hexKey format**: `"q,r,s"` string produced by `hexKey({q, r, s})` from `hexUtils.js`.
- Dice stacks are arrays ordered **bottom → top** (`stack[stack.length - 1]` is the top die).
- All game state is **plain JS objects** — no classes.
- `state.scores` default for a player is `0`; always read with `state.scores[playerId] ?? 0`.

---

## Quotes

Use **double quotes** for strings. Use single quotes only when the string itself contains a double quote.

```js
// ✅ correct
import { hexKey } from "../hex/hexUtils.js";
const label = "Game Over";
const msg = 'He said "hello"';

// ❌ wrong
const label = 'Game Over';
```

---

## No Magic Numbers

Extract repeated geometry constants into `boardConstants.js`. Give numeric thresholds a named `const`.

---

## Styling (React Components)

- **Prefer Tailwind utility classes** over inline `style` props for all static values.
- Use `style` props only for **dynamic values** that Tailwind cannot express (e.g. computed pixel positions, SVG transform values, interpolated colors).

```jsx
// ✅ correct — static appearance via Tailwind
<div className="bg-red-500 rounded-full w-6 h-6" />

// ✅ correct — dynamic value that Tailwind cannot do
<div style={{ transform: `translate(${x}px, ${y}px)` }} />

// ❌ wrong — static value as inline style
<div style={{ backgroundColor: "red", borderRadius: "9999px" }} />
```
