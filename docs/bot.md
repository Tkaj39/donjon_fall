# Bot Player

The bot is implemented in `src/game/bot.js` and uses **Monte Carlo Tree Search (MCTS)** to choose moves. It integrates with the same game reducer and move-validation functions the UI uses, so it can only ever produce legal moves.

## Entry Point

```js
getBotMoveAsync(state, botPlayer, { onMove, timeoutMs })
```

Call this when it is the bot's turn. It runs MCTS in the background and calls `onMove(action)` after `timeoutMs` milliseconds (default 10 s). Returns a cancel function.

- **Focal phase** — resolved immediately with sampled random rolls (die reroll + extra-die focal-point draw); no tree search needed.
- **Victory phase** — calls `onMove(null)` immediately; the game is already decided.
- **Action / combat phases** — runs full MCTS.

## MCTS Overview

Standard four-phase loop, run in async batches of up to 80 iterations every 50 ms so the browser tab stays responsive.

### 1. Selection

Starting from the root, repeatedly pick the child with the highest **UCB1** score until a position with untried moves or a finished game is reached.

```
UCB1 = (totalScore / visits) + √2 · √(ln(parentVisits) / visits)
```

The `√2` exploration constant (`Math.SQRT2`) balances exploiting known good moves vs exploring new ones.

### 2. Expansion

One untried action (move die, jump, collapse, reroll, combat option…) is taken from the position, applied to the game state, and a new child node is created for the resulting position.

### 3. Simulation (Rollout)

A shallow random playout runs for up to **6 turns** (`ROLLOUT_DEPTH`). Each step:

1. Auto-advance any focal phase: score VP, reroll the focal die, draw the extra-die focal-point.
2. In combat, pick a random legal option (push or occupy).
3. In the action phase, try up to 3 randomly chosen own dice; for each, pick a random reachable hex via BFS and move the die there. Skip to the next die if the move is rejected (e.g. the destination has equal or higher enemy combat power).

Keeping the rollout shallow (depth 6) is intentional: long random games mask the tactical differences between positions.

### 4. Backpropagation

The evaluation score from the rollout propagates up through all ancestor positions, updating `visits` and `totalScore` at each level.

## Move Generation (`generateLegalMoves`)

Enumerates every legal action for the current position by delegating to the game's own functions:

| Action | Source |
|---|---|
| `MOVE_DIE` — move a standalone die or a die off a tower | `getReachableHexes` + BFS path for approach direction |
| `JUMP` — top die detaches from a tower and jumps | `getJumpReachableHexes` + BFS path |
| `MOVE_TOWER` — whole tower moves as a unit | `getTowerReachableHexes` + BFS path |
| `COLLAPSE` — remove bottom die from a 3+ tower | `canCollapse` |
| `REROLL` — reroll one of your dice (value can only stay or increase) | always generated for each own die; new value sampled at generation time |
| Combat (push / occupy) | `getAvailableCombatOptions` |

**BFS approach direction**: `getShortestPathToHex` finds one valid path to the destination; the penultimate hex in that path is passed as `approachDirection`. This replaces an earlier all-paths DFS — the reducer only needs one valid approach direction to resolve combat facing, so enumerating every path was wasteful.

## Evaluation Function (`evaluateState`)

Scores a position from the bot's perspective. A finished game (5 VP reached) returns a large value that dominates all heuristic scores.

| Component | Weight | Reasoning |
|---|---|---|
| VP lead (own − opponent) | ×10 | Victory points are the win condition |
| Formation combat power lead | ×0.5 | Per rules: `top die value + own supporting count − enemy count`; buried dice contribute ±1 regardless of face value |
| Friendly die buried in enemy-controlled tower | −1 each | At risk of tower collapse (enemy scores 1 VP) |
| Own die on an active focal point | +3 each | Focal points score VP at the start of next turn |
| Enemy die on an active focal point | −3 each | Opponent will score unless displaced |
| Own die on a passive focal point | +3 ÷ passive count in group | Uniform probability it becomes the next active focal point |
| Enemy die on a passive focal point | −3 ÷ passive count in group | Same reasoning, from opponent's side |
| Win (5+ VP) | +1000 | Terminal |
| Loss | −1000 | Terminal |

> **TODO**: The passive focal point weight assumes a uniform draw among passive focal points in the same group. When future maps introduce focal point groups of different sizes or non-uniform activation rules, this formula may need revisiting.

## Best Move Selection

After the time budget expires, the bot picks the **most-visited** child of the root (not the one with the highest average score). Visit count is a more reliable signal when the tree is only partially explored — a high-average but rarely visited branch may just be an optimistic outlier.

## Async Execution Model

```
setTimeout(tick, 100)   ← 100 ms delay so React paints the thinking indicator first
  └─ runs up to BATCH_SIZE (80) iterations, capped at 50 ms of wall time per batch
  └─ if deadline not reached: setTimeout(tick, 0)
  └─ if deadline reached: onMove(bestMoveSoFar)
```

The cancel function sets a `cancelled` flag and clears the pending timer, stopping all further iterations cleanly.