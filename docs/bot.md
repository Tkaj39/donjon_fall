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
| Die count lead (own − opponent) | ×0.3 | Losing a die is permanent and reduces mobility and combat power for the rest of the game |
| Collapsible tower controlled by own player (3+ dice, own die on top) | +1.5 each | Can be collapsed next turn for an immediate scoring opportunity |
| Collapsible tower controlled by opponent (3+ dice, enemy die on top) | −1.5 each | Opponent can collapse it next turn; stacks with the buried-die penalty above |
| Mobility lead — sum of own top-die face values minus opponent's | ×0.1 | Higher face value = more reachable hexes per turn |
| Proximity to nearest uncontrolled active focal point (own top dice) | +1 ÷ distance | Approximate (cube-coordinate distance, not path distance); rewards advancing toward scoring opportunities |
| Proximity to nearest uncontrolled active focal point (enemy top dice) | −1 ÷ distance | Penalises opponent threatening an uncontrolled focal point |
| Edge/hole proximity — average valid-neighbor count lead | ×0.2 | Fewer valid board neighbours = closer to an edge or hole = more vulnerable to being pushed off; map-shape agnostic |
| Win (5+ VP) | +1000 | Terminal |
| Loss | −1000 | Terminal |

> **TODO**: The passive focal point weight assumes a uniform draw among passive focal points in the same group. When future maps introduce focal point groups of different sizes or non-uniform activation rules, this formula may need revisiting.
>
> **TODO**: Watch for inter-component dependencies that could cause unintended score amplification. Although all components currently combine additively (so evaluation order does not matter), some components respond to the same underlying game state and can reinforce each other — for example, die count feeds both the mobility component and the combat power component, so a single die gain shifts the score in multiple places at once. Known linear dependencies are acceptable, but adding new components should always be checked against existing ones: if a new component correlates strongly with an existing one, the combined weight may be disproportionately large and distort bot behaviour. The sensitivity analysis (see TODO above) is the practical tool for detecting this — a component that appears to have outsized influence may in fact be amplified by a correlated component rather than being intrinsically strong.
>
> **TODO**: Run a component sensitivity analysis to better calibrate the weights. The idea: compare evaluation scores between pairs of positions that differ in exactly one property (e.g. one die value changed by 1) and measure how much each component shifts the total score. Components with disproportionately large or small influence are candidates for reweighting or removal. This can also reveal game balance issues — if one component consistently dominates, it may indicate that the corresponding action or mechanic is too strong relative to others. Note that sensitivity analysis refines the existing heuristic; it cannot by itself converge to true game value (that would require self-play with outcome-based learning).
>
> **TODO**: Long-term — replace the handcrafted evaluation function with a neural network trained via AlphaZero-style self-play. Overview of the approach:
>
> - Replace `evaluateState` with a neural network (input = game state tensor, output = position score). MCTS stays intact but calls the network instead of the heuristic.
> - The bot plays against itself repeatedly. Each game's outcome (win/loss) is back-propagated to train the network. No handcrafted heuristic is needed as a starting point — training begins from random weights.
> - The process is iterative: a stronger bot generates higher-quality training data, which produces an even stronger bot.
>
> **Technology stack**: PyTorch or TensorFlow for the network. The game logic would need to be available in Python — either rewritten or called via JSON state export (slower). Recommended: rewrite the core game logic in Python for training, keeping the JS version for the UI.
>
> **Input encoding**: the hexagonal grid needs to be encoded as a tensor. Options: (a) axial coordinates mapped to a 2D array with padding for missing cells; (b) specialised hex convolutions. AlphaZero uses convolutional layers on a square grid — hex grids require adaptation.
>
> **Reward sparsity**: win/loss signal only arrives at the end of the game, which makes learning slow. The existing heuristic can be used as reward shaping (an auxiliary signal during the game) to accelerate convergence — paradoxically making the handcrafted heuristic useful even in the deep learning pipeline.
>
> **Hardware**: training requires hundreds of thousands of self-play games with MCTS, which takes days on a standard machine. Access to stronger hardware (GPU cluster) would reduce this significantly. This is a long-term research direction, not a near-term task.
>
> **TODO**: Improve weight calibration and branch efficiency using transposition tables and pattern-based evaluation.
>
> **Transposition tables**: Different sequences of moves can lead to the same game state (a transposition). Without a transposition table, MCTS evaluates the same position multiple times via different branches — wasted computation. A transposition table is a hash map keyed by a hash of the game state (e.g. Zobrist hashing — each (hex, die owner, die value) combination is assigned a random bitstring; XORing them together gives a fast, collision-resistant state hash). When MCTS reaches a position already in the table, it reuses the stored `visits` and `totalScore` instead of re-evaluating. This effectively merges branches that converge to the same state, reducing the search tree size and making the time budget go further.
>
> **Pattern-based evaluation**: Rather than calibrating component weights abstractly, define a library of concrete game situations — for example: "own die surrounded by three enemy dice", "two enemy dice on the same focal point", "own tower of 3 with enemy die on top". Each pattern is assigned a weight derived from sensitivity analysis or self-play data. During evaluation, the current position is matched against the pattern library and matching patterns contribute their weights to the score. This grounds the evaluation in real recurring tactical situations rather than generic heuristics, and makes it easier to reason about and extend.
>
> **Combining both**: A practical pipeline would be — (1) collect a database of key positions from self-play or expert games; (2) run sensitivity analysis on those positions to measure the actual influence of each component; (3) extract recurring patterns and assign weights; (4) add a transposition table to MCTS so positions identified in the database are reused rather than re-searched. The result is a more accurate evaluation function calibrated on real game situations and a more efficient search that avoids redundant computation.
>
> **TODO**: Long-term — accelerate the MCTS hot path by compiling performance-critical code to **WebAssembly (WASM)**. Overview:
>
> **Why**: JavaScript is the bottleneck for compute-intensive loops. The MCTS rollout (`simulate`) and move generation (`getReachableHexes`, `gameReducer`, `getAttackStrength`) are called thousands of times per second inside the search loop. Rewriting these in a compiled language and running them as WASM typically yields **3–10× throughput improvement** over pure JS, meaning more MCTS iterations fit within the same time budget and the bot plays stronger moves.
>
> **C vs Rust**: Both compile to WASM. **Rust** is the recommended choice today — `wasm-pack` provides excellent tooling for building and binding Rust → WASM modules for use in JS/browser environments, the memory model is safe by default (no undefined behaviour, no manual memory management), and performance is on par with C. C/C++ is viable via Emscripten but requires more manual effort and carries higher risk of memory bugs.
>
> **What to compile**: Only the bot's inner loop needs to move to WASM — the UI, React components, and game state display can stay in JS entirely. The boundary would be: JS calls a single `getBotMove(stateJson)` WASM function, which runs the full MCTS in native speed and returns the chosen action as JSON. Everything else remains unchanged.
>
> **Practical obstacle**: The game logic (`gameReducer`, move validators, combat resolution) is currently shared between the UI and the bot, all written in JS. Moving the bot's hot path to WASM means either (a) duplicating the game logic in Rust/C and maintaining two implementations in sync, or (b) refactoring so the WASM module owns the authoritative game logic and the JS UI calls into it. Option (b) is architecturally cleaner but is a significant rewrite. This should only be pursued once the game rules and logic are fully stable.

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