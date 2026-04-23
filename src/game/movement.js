/**
 * Phase 3.1 — Path validation for Move Die
 * Phase 3.2 — Move Die action
 * Phase 3.3 — Tower jump
 * Phase 3.4 — Move Whole Tower action
 *
 * All functions are pure — they read GameState but never mutate it.
 * hexKey format: "q,r,s" (produced by hexUtils.hexKey)
 */

import { hexKey, hexFromKey, getNeighbors, hexesDistance } from "../hex/hexUtils.js";
import { isOnBoard } from "../hex/boardUtils.js";
import { getDiceAt, getTopDie, getController, canEnterTower, getAttackStrength } from "./gameState.js";
import { canAttack } from "./combat.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the mover can TRAVERSE (pass through) an intermediate hex.
 * - Empty hex: always yes.
 * - Own hex: only if mover"s attack strength (as if placed there) exceeds the
 *   current top die"s attack strength (canEnterTower).
 * - Enemy hex: never (blocks the path).
 *
 * @param {import("./gameState.js").GameState} state
 * @param {import("./gameState.js").Die} moverDie
 * @param {string} neighborKey
 * @returns {boolean}
 */
function canTraverseThrough(state, moverDie, neighborKey) {
    const controller = getController(state, neighborKey);
    if (controller === null) return true;
    if (controller === moverDie.owner) return canEnterTower(state, moverDie, neighborKey);
    return false; // enemy hex — cannot pass through
}

/**
 * Returns all valid tower-movement paths from `fromKey` to `toKey`.
 *
 * Tower traversal rules (mirrors getTowerReachableHexes):
 * - Range = getTowerMoveRange (own − enemy dice count in tower).
 * - Intermediate hexes must be empty; occupied hexes (own or enemy) are
 *   valid destinations only, not traversable.
 *
 * Returns an empty array if `toKey` is unreachable by the tower.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @returns {string[][]}
 */
function getTowerPathsToHex(state, fromKey, toKey) {
    const maxSteps = getTowerMoveRange(state, fromKey);
    if (maxSteps === 0) return [];

    const paths = [];

    /**
     * Depth-first search that builds all valid tower paths from `currentKey` to `toKey`.
     * `visited` prevents cycles within the current path.
     *
     * @param {string}      currentKey  - Hex key of the current position.
     * @param {number}      stepsLeft   - Remaining movement steps.
     * @param {string[]}    currentPath - Ordered hex keys visited so far (start-inclusive).
     * @param {Set<string>} visited     - Set of hex keys already in the current path.
     * @returns {void}
     */
    function dfs(currentKey, stepsLeft, currentPath, visited) {
        if (currentKey === toKey) {
            paths.push([...currentPath]);
            return;
        }
        if (stepsLeft === 0) return;

        for (const neighbor of getNeighbors(hexFromKey(currentKey))) {
            if (!isOnBoard(neighbor)) continue;
            const neighborKey = hexKey(neighbor);
            if (visited.has(neighborKey)) continue;

            const isDestination = neighborKey === toKey;
            // Intermediates must be empty; destinations may be occupied
            if (!isDestination && getController(state, neighborKey) !== null) continue;

            currentPath.push(neighborKey);
            visited.add(neighborKey);
            dfs(neighborKey, stepsLeft - 1, currentPath, visited);
            currentPath.pop();
            visited.delete(neighborKey);
        }
    }

    const visited = new Set([fromKey]);
    dfs(fromKey, maxSteps, [fromKey], visited);
    return paths;
}

// ---------------------------------------------------------------------------
// 3.1a — getReachableHexes
// ---------------------------------------------------------------------------

/**
 * Returns the set of hexKeys reachable by the top die at `fromKey`.
 *
 * Movement rules applied:
 * - Range = die face value (number of steps).
 * - Cannot pass through enemy dice (but can land on them).
 * - Can pass through own dice only if mover"s attack strength exceeds the top
 *   die"s attack strength at that intermediate hex.
 * - Cannot return to the starting hex.
 *
 * Uses BFS tracking the minimum steps needed to reach each hex. A hex already
 * reached with fewer or equal steps is not re-queued, so the search terminates.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} fromKey  - hexKey of the die to move
 * @returns {Set<string>}   - set of reachable destination hexKeys
 */
export function getReachableHexes(state, fromKey) {
    const moverDie = getTopDie(state, fromKey);
    if (!moverDie) return new Set();

    const maxSteps = moverDie.value;
    const reachable = new Set();

    // minSteps keyed by "hexKey:boostLeft:boostStr" — boost state affects traversal
    const minSteps = new Map([[`${fromKey}:0:0`, 0]]);
    const queue = [[fromKey, 0, 0, 0]]; // [hexKey, stepsUsed, boostLeft, boostStr]

    while (queue.length > 0) {
        const [currentKey, steps, boostLeft, boostStr] = queue.shift();
        if (steps >= maxSteps) continue;

        const effectivePower = boostLeft > 0 ? boostStr : moverDie.value;
        const effectiveDie = { ...moverDie, value: effectivePower };

        for (const neighbor of getNeighbors(hexFromKey(currentKey))) {
            if (!isOnBoard(neighbor)) continue;

            const neighborKey = hexKey(neighbor);
            if (neighborKey === fromKey) continue; // cannot return to start

            const newSteps = steps + 1;
            const ctrl = getController(state, neighborKey);
            const isEnemy = ctrl !== null && ctrl !== moverDie.owner;

            // Enemies and empty/own hexes are all valid landing spots
            reachable.add(neighborKey);

            // Only continue traversal through non-enemy hexes
            if (!isEnemy && canTraverseThrough(state, effectiveDie, neighborKey)) {
                let newBoostLeft, newBoostStr;
                if (ctrl === moverDie.owner) {
                    // Passing through a friendly formation: compute virtual tower boost.
                    // The mover forms a temporary tower here and jumps off — combat power
                    // is boosted to the virtual tower's value for the next N hexes.
                    const stack = getDiceAt(state, neighborKey);
                    const existingOwn = stack.filter(d => d.owner === moverDie.owner).length;
                    const existingEnemy = stack.length - existingOwn;
                    newBoostStr = moverDie.value + existingOwn - existingEnemy;
                    newBoostLeft = Math.max(1, existingOwn + 1 - existingEnemy);
                } else {
                    newBoostLeft = Math.max(0, boostLeft - 1);
                    newBoostStr = newBoostLeft > 0 ? boostStr : 0;
                }

                const stateKey = `${neighborKey}:${newBoostLeft}:${newBoostStr}`;
                const prevBest = minSteps.get(stateKey);
                if (prevBest !== undefined && prevBest <= newSteps) continue;
                minSteps.set(stateKey, newSteps);
                queue.push([neighborKey, newSteps, newBoostLeft, newBoostStr]);
            }
        }
    }

    return reachable;
}

// ---------------------------------------------------------------------------
// 3.1b — getPathsToHex
// ---------------------------------------------------------------------------

/**
 * Returns all valid movement paths from `fromKey` to `toKey` for the top die
 * at `fromKey`, as arrays of hexKeys (start-inclusive, end-inclusive).
 *
 * A valid path:
 * - Has length ≤ die face value + 1 (start + N steps).
 * - Does not revisit any hex (no cycles).
 * - Every intermediate hex (neither start nor end) satisfies canTraverseThrough.
 * - The destination hex itself has no traversal restriction — it is always
 *   accepted as the final step.
 *
 * Returns an empty array if `toKey` is unreachable or the origin has no die.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @returns {string[][]}  - each element is an ordered array of hexKeys
 */
export function getPathsToHex(state, fromKey, toKey) {
    const moverDie = getTopDie(state, fromKey);
    if (!moverDie) return [];
    if (fromKey === toKey) return [];

    const maxSteps = moverDie.value;
    const paths = [];

    function dfs(currentKey, stepsLeft, currentPath, visited, boostLeft, boostStr) {
        if (currentKey === toKey) {
            paths.push([...currentPath]);
            return;
        }
        if (stepsLeft === 0) return;

        const effectivePower = boostLeft > 0 ? boostStr : moverDie.value;
        const effectiveDie = { ...moverDie, value: effectivePower };

        for (const neighbor of getNeighbors(hexFromKey(currentKey))) {
            if (!isOnBoard(neighbor)) continue;

            const neighborKey = hexKey(neighbor);
            if (visited.has(neighborKey)) continue;

            const isDestination = neighborKey === toKey;

            // Intermediate hexes must satisfy traversal rules with effective power
            if (!isDestination && !canTraverseThrough(state, effectiveDie, neighborKey)) continue;

            // Compute boost state for the next step
            let newBoostLeft = Math.max(0, boostLeft - 1);
            let newBoostStr = newBoostLeft > 0 ? boostStr : 0;
            if (!isDestination) {
                const ctrl = getController(state, neighborKey);
                if (ctrl === moverDie.owner) {
                    const stack = getDiceAt(state, neighborKey);
                    const existingOwn = stack.filter(d => d.owner === moverDie.owner).length;
                    const existingEnemy = stack.length - existingOwn;
                    newBoostStr = moverDie.value + existingOwn - existingEnemy;
                    newBoostLeft = Math.max(1, existingOwn + 1 - existingEnemy);
                }
            }

            currentPath.push(neighborKey);
            visited.add(neighborKey);
            dfs(neighborKey, stepsLeft - 1, currentPath, visited, newBoostLeft, newBoostStr);
            currentPath.pop();
            visited.delete(neighborKey);
        }
    }

    const visited = new Set([fromKey]);
    dfs(fromKey, maxSteps, [fromKey], visited, 0, 0);
    return paths;
}

// ---------------------------------------------------------------------------
// 3.1b-2 — getShortestPathToHex
// ---------------------------------------------------------------------------

/**
 * Returns the shortest valid movement path from `fromKey` to `toKey`.
 *
 * Uses BFS with a parent-pointer map so only one pass is needed.
 * Traversal rules depend on `actionType`:
 *   - `"move-die"`  : same rules as getReachableHexes — own/empty traversable if
 *                     canTraverseThrough; enemies are valid destinations only.
 *   - `"move-tower"`: whole tower moves — only empty hexes are traversable; enemy
 *                     hexes are valid destinations only.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @param {"move-die"|"move-tower"} [actionType="move-die"]
 * @returns {string[]}  Ordered array [fromKey, …, toKey], or [] if unreachable.
 */
export function getShortestPathToHex(state, fromKey, toKey, actionType = "move-die") {
    if (fromKey === toKey) return [];

    const isTower = actionType === "move-tower";
    let moverDie = null;
    let moverOwner = null;
    let maxSteps = 0;

    if (isTower) {
        const stack = getDiceAt(state, fromKey);
        if (stack.length < 2) return [];
        maxSteps = getTowerMoveRange(state, fromKey);
        if (maxSteps === 0) return [];
        moverOwner = stack[stack.length - 1].owner;
    } else {
        moverDie = getTopDie(state, fromKey);
        if (!moverDie) return [];
        maxSteps = moverDie.value;
        moverOwner = moverDie.owner;
    }

    // BFS — parent[key] = predecessor key (null for fromKey)
    const parent = new Map([[fromKey, null]]);
    const stepsMap = new Map([[fromKey, 0]]);
    const queue = [fromKey];

    while (queue.length > 0) {
        const currentKey = queue.shift();
        const currentSteps = stepsMap.get(currentKey);
        if (currentSteps >= maxSteps) continue;

        for (const neighbor of getNeighbors(hexFromKey(currentKey))) {
            if (!isOnBoard(neighbor)) continue;
            const neighborKey = hexKey(neighbor);
            if (neighborKey === fromKey) continue;
            if (parent.has(neighborKey)) continue; // already reached via shorter/equal path

            const ctrl = getController(state, neighborKey);
            const isEnemy = ctrl !== null && ctrl !== moverOwner;

            parent.set(neighborKey, currentKey);
            stepsMap.set(neighborKey, currentSteps + 1);

            if (neighborKey === toKey) {
                // Reconstruct path from parent map
                const path = [];
                let cur = toKey;
                while (cur !== null) {
                    path.unshift(cur);
                    cur = parent.get(cur);
                }
                return path;
            }

            // Continue traversal only through traversable (non-blocking) hexes
            if (isTower) {
                if (ctrl === null) queue.push(neighborKey);
            } else {
                if (!isEnemy && canTraverseThrough(state, moverDie, neighborKey)) {
                    queue.push(neighborKey);
                }
            }
        }
    }

    return []; // toKey not reachable
}

// ---------------------------------------------------------------------------
// 3.1c — getApproachDirections
// ---------------------------------------------------------------------------

/**
 * Returns the set of hexKeys that serve as the last intermediate hex before
 * `toKey` across all valid paths from `fromKey` to `toKey`.
 *
 * Each returned hexKey is a neighbor of `toKey` from which the mover could
 * arrive. The UI uses this to determine the available push directions when
 * more than one approach exists.
 *
 * Pass `actionType = "move-tower"` to use tower movement rules (range =
 * getTowerMoveRange, only empty intermediates); defaults to single-die rules.
 *
 * Returns an empty set if `toKey` is unreachable.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @param {"move-die"|"move-tower"} [actionType="move-die"]
 * @returns {Set<string>}  - set of hexKeys (last-step neighbors of toKey)
 */
export function getApproachDirections(state, fromKey, toKey, actionType = "move-die") {
    const paths = actionType === "move-tower"
        ? getTowerPathsToHex(state, fromKey, toKey)
        : getPathsToHex(state, fromKey, toKey);
    const directions = new Set();
    for (const path of paths) {
        if (path.length >= 2) {
            directions.add(path[path.length - 2]);
        }
    }
    return directions;
}

// ---------------------------------------------------------------------------
// Internal helper — effective attack strength along a path (pass-through boost)
// ---------------------------------------------------------------------------

/**
 * Returns the effective attack strength of `moverDie` when arriving at the last
 * hex of `path`, accounting for pass-through boosts from any friendly formations
 * traversed along the way.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {import("./gameState.js").Die} moverDie
 * @param {string[]} path  - ordered hex array [fromKey, ..., destKey]
 * @returns {number}
 */
function computePathAttackStrength(state, moverDie, path, baseStrength) {
    let boostLeft = 0, boostStr = 0;
    for (let i = 1; i < path.length; i++) {
        const effectivePower = boostLeft > 0 ? boostStr : baseStrength;
        if (i === path.length - 1) return effectivePower;
        const ctrl = getController(state, path[i]);
        if (ctrl === moverDie.owner) {
            const stack = getDiceAt(state, path[i]);
            const existingOwn = stack.filter(d => d.owner === moverDie.owner).length;
            const existingEnemy = stack.length - existingOwn;
            boostStr = moverDie.value + existingOwn - existingEnemy;
            boostLeft = Math.max(1, existingOwn + 1 - existingEnemy);
        } else {
            boostLeft = Math.max(0, boostLeft - 1);
            boostStr = boostLeft > 0 ? boostStr : 0;
        }
    }
    return baseStrength;
}

// ---------------------------------------------------------------------------
// 3.1d — getMoveAttackStrength
// ---------------------------------------------------------------------------

/**
 * Returns the best effective attack strength achievable when moving the die at
 * `fromKey` to attack `toKey`, considering pass-through boosts along all valid paths.
 *
 * NOTE: intentionally not used for enemy-hex highlight validation yet. Highlighting
 * currently uses the die's base attack strength only (getAttackStrength), so a boost
 * from passing through a friendly die is NOT shown until the player explicitly routes
 * through it. When we want path-aware highlighting (show all hexes reachable via any
 * route, including boosted ones), replace the getAttackStrength call in Game.jsx
 * reachableKeys → move-die branch with getMoveAttackStrength(state, selectedHex, key).
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @returns {number}
 */
export function getMoveAttackStrength(state, fromKey, toKey) {
    const moverDie = getTopDie(state, fromKey);
    if (!moverDie) return 0;
    const baseStr = getAttackStrength(state, fromKey);
    const paths = getPathsToHex(state, fromKey, toKey);
    if (paths.length === 0) return baseStr;
    return Math.max(...paths.map(p => computePathAttackStrength(state, moverDie, p, baseStr)));
}

// ---------------------------------------------------------------------------
// Internal helper — move a single die from one hex to another (pure)
// ---------------------------------------------------------------------------

/**
 * Returns a new state with the top die at `fromKey` moved onto `toKey`.
 * Does NOT validate legality — callers must check before invoking.
 * Sets `actionTaken: true`.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @returns {import("./gameState.js").GameState}
 */
function moveTopDie(state, fromKey, toKey) {
    const fromStack = getDiceAt(state, fromKey);
    const die = fromStack[fromStack.length - 1];
    const newFromStack = fromStack.slice(0, -1);
    const newToStack = [...getDiceAt(state, toKey), die];

    const newDice = { ...state.dice };
    if (newFromStack.length === 0) {
        delete newDice[fromKey];
    } else {
        newDice[fromKey] = newFromStack;
    }
    newDice[toKey] = newToStack;

    return { ...state, dice: newDice, actionTaken: true };
}

// ---------------------------------------------------------------------------
// 3.2 — applyMoveAction
// ---------------------------------------------------------------------------

/**
 * Applies the Move Die action: moves the top die at `fromKey` to `toKey`.
 *
 * Outcomes:
 * - **Empty destination** — die is placed there; action phase ends.
 * - **Own die at destination** — die is stacked if `canEnterTower`; illegal otherwise (returns state unchanged).
 * - **Enemy at destination** — the attacker"s die stays at `fromKey` and combat is
 *   set up via `CombatState`. The die only physically moves when combat is resolved
 *   (`applyPush` / `applyOccupy`).
 *   - If exactly one approach direction exists it is recorded automatically.
 *   - If multiple directions exist and none is passed, `approachDirection` is `null`
 *     (UI must confirm before resolving combat — see section 11.4).
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @param {string|null} [approachDirection]  - hexKey of the last-step neighbor used
 *                                             to arrive at `toKey` (needed for push direction).
 *                                             Pass `null` to auto-resolve when unambiguous.
 * @returns {import("./gameState.js").GameState}
 */
export function applyMoveAction(state, fromKey, toKey, approachDirection = null) {
    const moverDie = getTopDie(state, fromKey);
    if (!moverDie) return state;

    const controller = getController(state, toKey);

    // --- Empty destination ---
    if (controller === null) {
        return { ...moveTopDie(state, fromKey, toKey), phase: "action" };
    }

    // --- Own die: form a tower (if legal) ---
    if (controller === moverDie.owner) {
        if (!canEnterTower(state, moverDie, toKey)) return state;
        return { ...moveTopDie(state, fromKey, toKey), phase: "action" };
    }

    // --- Enemy die: set up combat (die does NOT move yet) ---
    // Base strength (preserves tower-move-die behavior); pass-through boost can only increase it.
    const baseStr = getAttackStrength(state, fromKey);
    const paths = getPathsToHex(state, fromKey, toKey);
    const attackStr = paths.length > 0
        ? Math.max(...paths.map(p => computePathAttackStrength(state, moverDie, p, baseStr)))
        : baseStr;
    if (!canAttack(state, fromKey, toKey, attackStr)) return state;

    let resolvedDirection = approachDirection;
    if (!resolvedDirection) {
        const dirs = getApproachDirections(state, fromKey, toKey);
        if (dirs.size === 1) resolvedDirection = [...dirs][0];
    }

    return {
        ...state,
        phase: "combat",
        actionTaken: true,
        combat: {
            attackerHex: fromKey,
            defenderHex: toKey,
            approachDirection: resolvedDirection,
            attackStrengthOverride: attackStr,
            options: ["push", "occupy"],
        },
    };
}

// ---------------------------------------------------------------------------
// 3.3 — Tower jump
// ---------------------------------------------------------------------------

/**
 * Returns the jump range for the top die at `towerKey`.
 * Formula: own dice − enemy dice in the tower, minimum 1.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} towerKey
 * @returns {number}
 */
export function getJumpRange(state, towerKey) {
    const stack = getDiceAt(state, towerKey);
    if (stack.length < 2) return 0; // need at least 2 dice to jump
    const jumper = stack[stack.length - 1];
    const ownCount = stack.filter(d => d.owner === jumper.owner).length;
    const enemyCount = stack.length - ownCount;
    return Math.max(1, ownCount - enemyCount);
}

/**
 * Returns the set of hexKeys reachable by the top die jumping out of `towerKey`.
 *
 * Movement range = die's face value (same as a standalone die).
 * Combat power is boosted to the former tower's combat value for the first
 * `getJumpRange` (own − enemy, min 1) hexes, then reverts to the die's plain face value.
 * This boosted combat power is used when checking traversal through friendly formations.
 *
 * Traversal rules:
 * - Cannot pass through enemy dice.
 * - Can pass through own dice only if the jumper's effective combat power at that
 *   step exceeds the top die's combat power there.
 * - Cannot land back on the source tower.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} towerKey
 * @returns {Set<string>}
 */
export function getJumpReachableHexes(state, towerKey) {
    const stack = getDiceAt(state, towerKey);
    if (stack.length < 2) return new Set(); // need at least 2 dice to jump
    const jumper = stack[stack.length - 1];
    const maxSteps = jumper.value; // jump range = die's own face value
    const boostedRange = getJumpRange(state, towerKey); // steps where tower combat power applies
    const towerStrength = getAttackStrength(state, towerKey); // former tower's combat power
    const reachable = new Set();
    const minSteps = new Map([[towerKey, 0]]);
    const queue = [[towerKey, 0]];

    while (queue.length > 0) {
        const [currentKey, steps] = queue.shift();
        if (steps >= maxSteps) continue;

        for (const neighbor of getNeighbors(hexFromKey(currentKey))) {
            if (!isOnBoard(neighbor)) continue;
            const neighborKey = hexKey(neighbor);
            if (neighborKey === towerKey) continue;

            const newSteps = steps + 1;
            const prevBest = minSteps.get(neighborKey);
            if (prevBest !== undefined && prevBest <= newSteps) continue;

            const ctrl = getController(state, neighborKey);
            const isEnemy = ctrl !== null && ctrl !== jumper.owner;

            reachable.add(neighborKey);
            minSteps.set(neighborKey, newSteps);

            // Traversal: enemy blocks further movement; own only if jumper's effective
            // combat power (boosted within boostedRange, face value beyond) allows entry.
            if (!isEnemy) {
                const effectiveValue = newSteps <= boostedRange ? towerStrength : jumper.value;
                const effectiveDie = { ...jumper, value: effectiveValue };
                const canTraverse = ctrl === null || canEnterTower(state, effectiveDie, neighborKey);
                if (canTraverse) queue.push([neighborKey, newSteps]);
            }
        }
    }

    return reachable;
}

/**
 * Applies the Jump action: detaches the top die from `towerKey` and moves it to `targetKey`.
 *
 * Outcomes:
 * - **Empty / own destination** — die is placed there (stacked if own and canEnterTower).
 * - **Enemy destination** — combat is set up; die stays at towerKey until resolved.
 *   Attack strength recorded in combat is the **jump** variant (face value only).
 *
 * Returns state unchanged if the move is illegal (no die, only 1 die in tower,
 * target not reachable, or own target where canEnterTower is false).
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} towerKey
 * @param {string} targetKey
 * @param {string|null} [approachDirection]
 * @returns {import("./gameState.js").GameState}
 */
export function applyJumpAction(state, towerKey, targetKey, approachDirection = null) {
    const stack = getDiceAt(state, towerKey);
    if (stack.length < 2) return state;
    const jumper = stack[stack.length - 1];

    const reachable = getJumpReachableHexes(state, towerKey);
    if (!reachable.has(targetKey)) return state;

    const ctrl = getController(state, targetKey);

    // Empty or own — physically move the die
    if (ctrl === null || ctrl === jumper.owner) {
        if (ctrl === jumper.owner && !canEnterTower(state, jumper, targetKey)) return state;
        return { ...moveTopDie(state, towerKey, targetKey), phase: "action" };
    }

    // Enemy — set up combat.
    // Combat power is boosted to the former tower's value for the first boostedRange hexes;
    // beyond that it reverts to the jumper's plain face value.
    const jumpBoostedRange = getJumpRange(state, towerKey);
    const distToTarget = hexesDistance(hexFromKey(towerKey), hexFromKey(targetKey));
    const jumperStrength = distToTarget <= jumpBoostedRange
        ? getAttackStrength(state, towerKey)
        : jumper.value;
    if (!canAttack(state, towerKey, targetKey, jumperStrength)) return state;

    let resolvedDirection = approachDirection;
    if (!resolvedDirection) {
        // If target is adjacent (1 step), there is exactly one approach direction: the source.
        if (hexesDistance(hexFromKey(towerKey), hexFromKey(targetKey)) === 1) {
            resolvedDirection = towerKey;
        } else {
            const paths = getPathsToHex(state, towerKey, targetKey);
            const dirs = new Set(paths.filter(p => p.length >= 2).map(p => p[p.length - 2]));
            if (dirs.size === 1) resolvedDirection = [...dirs][0];
        }
    }

    return {
        ...state,
        phase: "combat",
        actionTaken: true,
        combat: {
            attackerHex: towerKey,
            defenderHex: targetKey,
            approachDirection: resolvedDirection,
            attackStrengthOverride: jumperStrength, // face value only
            options: ["push", "occupy"],
        },
    };
}

// ---------------------------------------------------------------------------
// 3.4 — Move Whole Tower action
// ---------------------------------------------------------------------------

/**
 * Returns the move range for moving the whole tower at `towerKey`.
 * Formula: own dice − enemy dice, minimum 1.
 * Returns 0 if the hex is empty or has only one die (no tower to move).
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} towerKey
 * @returns {number}
 */
export function getTowerMoveRange(state, towerKey) {
    const stack = getDiceAt(state, towerKey);
    if (stack.length < 2) return 0;
    const top = stack[stack.length - 1];
    const ownCount = stack.filter(d => d.owner === top.owner).length;
    const enemyCount = stack.length - ownCount;
    return Math.max(1, ownCount - enemyCount);
}

/**
 * Returns the set of hexKeys reachable by moving the whole tower at `towerKey`.
 *
 * Movement rules:
 * - Range = getTowerMoveRange.
 * - The entire tower moves as one unit — can only traverse empty hexes.
 * - Can land on enemy hex (triggers combat — push only).
 * - Can land on friendly hex (forms a tower if top die's combat power exceeds destination's).
 * - Cannot return to the source hex.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} towerKey
 * @returns {Set<string>}
 */
export function getTowerReachableHexes(state, towerKey) {
    const stack = getDiceAt(state, towerKey);
    if (stack.length < 2) return new Set();

    const maxSteps = getTowerMoveRange(state, towerKey);
    if (maxSteps === 0) return new Set();

    const topDie = getTopDie(state, towerKey);
    const reachable = new Set();
    const minSteps = new Map([[towerKey, 0]]);
    const queue = [[towerKey, 0]];

    while (queue.length > 0) {
        const [currentKey, steps] = queue.shift();
        if (steps >= maxSteps) continue;

        for (const neighbor of getNeighbors(hexFromKey(currentKey))) {
            if (!isOnBoard(neighbor)) continue;
            const neighborKey = hexKey(neighbor);
            if (neighborKey === towerKey) continue;

            const newSteps = steps + 1;
            const prevBest = minSteps.get(neighborKey);
            if (prevBest !== undefined && prevBest <= newSteps) continue;

            const ctrl = getController(state, neighborKey);
            const isOccupied = ctrl !== null;

            // Friendly destination is only reachable if the tower can legally stack there
            if (ctrl === state.currentPlayer && !canEnterTower(state, topDie, neighborKey)) continue;

            reachable.add(neighborKey);
            minSteps.set(neighborKey, newSteps);

            // Only continue traversal through empty hexes
            if (!isOccupied) {
                queue.push([neighborKey, newSteps]);
            }
        }
    }

    return reachable;
}

/**
 * Applies the Move Whole Tower action: moves all dice from `fromKey` to `toKey`.
 *
 * Outcomes:
 * - **Empty destination** — entire stack is moved; actionTaken true, phase "action".
 * - **Enemy at destination** — combat is set up with push only (occupy not available).
 *   Stack stays at fromKey until combat resolves.
 *
 * Returns state unchanged if:
 * - The hex has fewer than 2 dice.
 * - `toKey` is not in getTowerReachableHexes.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @param {string|null} [approachDirection]
 * @returns {import("./gameState.js").GameState}
 */
export function applyMoveTowerAction(state, fromKey, toKey, approachDirection = null) {
    const stack = getDiceAt(state, fromKey);
    if (stack.length < 2) return state;

    const reachable = getTowerReachableHexes(state, fromKey);
    if (!reachable.has(toKey)) return state;

    const ctrl = getController(state, toKey);

    // Empty destination — move the whole stack
    if (ctrl === null) {
        const newDice = { ...state.dice };
        delete newDice[fromKey];
        newDice[toKey] = [...stack];
        return { ...state, dice: newDice, actionTaken: true, phase: "action" };
    }

    // Friendly destination — stack on top if the moving tower's top die can enter
    if (ctrl === state.currentPlayer) {
        const topDie = getTopDie(state, fromKey);
        if (!canEnterTower(state, topDie, toKey)) return state;
        const newDice = { ...state.dice };
        delete newDice[fromKey];
        newDice[toKey] = [...getDiceAt(state, toKey), ...stack];
        return { ...state, dice: newDice, actionTaken: true, phase: "action" };
    }

    // Enemy destination — combat, push only
    if (!canAttack(state, fromKey, toKey)) return state;

    let resolvedDirection = approachDirection;
    if (!resolvedDirection) {
        if (hexesDistance(hexFromKey(fromKey), hexFromKey(toKey)) === 1) {
            resolvedDirection = fromKey;
        }
        // Multi-step: direction stays null — UI must confirm.
    }

    return {
        ...state,
        phase: "combat",
        actionTaken: true,
        combat: {
            attackerHex: fromKey,
            defenderHex: toKey,
            approachDirection: resolvedDirection,
            towerMove: true,
        },
    };
}

// ---------------------------------------------------------------------------
// 3.5 — Tower Collapse action
// ---------------------------------------------------------------------------

/**
 * Returns true if the current player can trigger a tower collapse at `hex`.
 *
 * Conditions:
 * - Tower has 3 or more dice.
 * - The current player"s die is on top.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} hex
 * @returns {boolean}
 */
export function canCollapse(state, hex) {
    const stack = getDiceAt(state, hex);
    if (stack.length < 3) return false;
    return getController(state, hex) === state.currentPlayer;
}

/**
 * Applies the Tower Collapse action: removes the bottom die from the tower at `hex`.
 *
 * - If the bottom die belongs to the opponent, `state.scores` for the current player
 *   is incremented by 1.
 * - Sets `actionTaken: true`.
 * - Returns state unchanged if `canCollapse` is false.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} hex
 * @returns {import("./gameState.js").GameState}
 */
export function applyCollapseAction(state, hex) {
    if (!canCollapse(state, hex)) return state;

    const stack = getDiceAt(state, hex);
    const bottomDie = stack[0];
    const newStack = stack.slice(1);

    const newDice = { ...state.dice, [hex]: newStack };

    const isEnemy = bottomDie.owner !== state.currentPlayer;
    const newScores = isEnemy
        ? { ...state.scores, [state.currentPlayer]: (state.scores[state.currentPlayer] ?? 0) + 1 }
        : state.scores;

    return { ...state, dice: newDice, scores: newScores, actionTaken: true };
}

// ---------------------------------------------------------------------------
// 3.6 — Reroll action
// ---------------------------------------------------------------------------

/**
 * Applies the Reroll action on the top die at `hex`.
 *
 * Rules:
 * - The die"s new value = max(newValue, originalValue) — value can only stay or increase.
 * - Die must belong to the current player (standalone or tower top).
 * - Sets `actionTaken: true`.
 * - Returns state unchanged if there is no die at `hex` or the top die does not
 *   belong to the current player.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} hex
 * @param {number} newValue  - the raw roll result (1–6); caller is responsible for randomness
 * @returns {import("./gameState.js").GameState}
 */
export function applyRerollAction(state, hex, newValue) {
    const stack = getDiceAt(state, hex);
    if (stack.length === 0) return state;

    const topDie = stack[stack.length - 1];
    if (topDie.owner !== state.currentPlayer) return state;

    const finalValue = Math.max(newValue, topDie.value);
    const updatedDie = { ...topDie, value: finalValue };
    const newStack = [...stack.slice(0, -1), updatedDie];

    return { ...state, dice: { ...state.dice, [hex]: newStack }, actionTaken: true };
}
