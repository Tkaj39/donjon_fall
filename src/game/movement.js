/**
 * Phase 3.1 — Path validation for Move Die
 * Phase 3.2 — Move Die action
 * Phase 3.3 — Tower jump
 *
 * All functions are pure — they read GameState but never mutate it.
 * hexKey format: "q,r,s" (produced by hexUtils.hexKey)
 */

import { hexKey, hexFromKey, getNeighbors, hexesDistance } from '../hex/hexUtils.js';
import { isOnBoard } from '../hex/boardUtils.js';
import { getDiceAt, getTopDie, getController, canEnterTower, getAttackStrength } from './gameState.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the mover can TRAVERSE (pass through) an intermediate hex.
 * - Empty hex: always yes.
 * - Own hex: only if mover's attack strength (as if placed there) exceeds the
 *   current top die's attack strength (canEnterTower).
 * - Enemy hex: never (blocks the path).
 *
 * @param {import('./gameState.js').GameState} state
 * @param {import('./gameState.js').Die} moverDie
 * @param {string} neighborKey
 * @returns {boolean}
 */
function canTraverseThrough(state, moverDie, neighborKey) {
    const controller = getController(state, neighborKey);
    if (controller === null) return true;
    if (controller === moverDie.owner) return canEnterTower(state, moverDie, neighborKey);
    return false; // enemy hex — cannot pass through
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
 * - Can pass through own dice only if mover's attack strength exceeds the top
 *   die's attack strength at that intermediate hex.
 * - Cannot return to the starting hex.
 *
 * Uses BFS tracking the minimum steps needed to reach each hex. A hex already
 * reached with fewer or equal steps is not re-queued, so the search terminates.
 *
 * @param {import('./gameState.js').GameState} state
 * @param {string} fromKey  - hexKey of the die to move
 * @returns {Set<string>}   - set of reachable destination hexKeys
 */
export function getReachableHexes(state, fromKey) {
    const moverDie = getTopDie(state, fromKey);
    if (!moverDie) return new Set();

    const maxSteps = moverDie.value;
    const reachable = new Set();

    // minSteps[key] = fewest steps used to first reach that hex
    const minSteps = new Map([[fromKey, 0]]);
    const queue = [[fromKey, 0]]; // [hexKey, stepsUsed]

    while (queue.length > 0) {
        const [currentKey, steps] = queue.shift();
        if (steps >= maxSteps) continue;

        for (const neighbor of getNeighbors(hexFromKey(currentKey))) {
            if (!isOnBoard(neighbor)) continue;

            const neighborKey = hexKey(neighbor);
            if (neighborKey === fromKey) continue; // cannot return to start

            const newSteps = steps + 1;
            const prevBest = minSteps.get(neighborKey);
            if (prevBest !== undefined && prevBest <= newSteps) continue;

            const isEnemy = getController(state, neighborKey) !== null &&
                            getController(state, neighborKey) !== moverDie.owner;

            // Enemies and empty/own hexes are all valid landing spots
            reachable.add(neighborKey);
            minSteps.set(neighborKey, newSteps);

            // Only continue traversal through non-enemy hexes
            if (!isEnemy && canTraverseThrough(state, moverDie, neighborKey)) {
                queue.push([neighborKey, newSteps]);
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
 * @param {import('./gameState.js').GameState} state
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

    // DFS — `visited` prevents cycles within the current path
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

            // Intermediate hexes must satisfy traversal rules
            if (!isDestination && !canTraverseThrough(state, moverDie, neighborKey)) continue;

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
 * Returns an empty set if `toKey` is unreachable.
 *
 * @param {import('./gameState.js').GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @returns {Set<string>}  - set of hexKeys (last-step neighbors of toKey)
 */
export function getApproachDirections(state, fromKey, toKey) {
    const paths = getPathsToHex(state, fromKey, toKey);
    const directions = new Set();
    for (const path of paths) {
        if (path.length >= 2) {
            directions.add(path[path.length - 2]);
        }
    }
    return directions;
}

// ---------------------------------------------------------------------------
// Internal helper — move a single die from one hex to another (pure)
// ---------------------------------------------------------------------------

/**
 * Returns a new state with the top die at `fromKey` moved onto `toKey`.
 * Does NOT validate legality — callers must check before invoking.
 * Sets `actionTaken: true`.
 *
 * @param {import('./gameState.js').GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @returns {import('./gameState.js').GameState}
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
 * - **Enemy at destination** — the attacker's die stays at `fromKey` and combat is
 *   set up via `CombatState`. The die only physically moves when combat is resolved
 *   (`applyPush` / `applyOccupy`).
 *   - If exactly one approach direction exists it is recorded automatically.
 *   - If multiple directions exist and none is passed, `approachDirection` is `null`
 *     (UI must confirm before resolving combat — see section 11.4).
 *
 * @param {import('./gameState.js').GameState} state
 * @param {string} fromKey
 * @param {string} toKey
 * @param {string|null} [approachDirection]  - hexKey of the last-step neighbor used
 *                                             to arrive at `toKey` (needed for push direction).
 *                                             Pass `null` to auto-resolve when unambiguous.
 * @returns {import('./gameState.js').GameState}
 */
export function applyMoveAction(state, fromKey, toKey, approachDirection = null) {
    const moverDie = getTopDie(state, fromKey);
    if (!moverDie) return state;

    const controller = getController(state, toKey);

    // --- Empty destination ---
    if (controller === null) {
        return { ...moveTopDie(state, fromKey, toKey), phase: 'action' };
    }

    // --- Own die: form a tower (if legal) ---
    if (controller === moverDie.owner) {
        if (!canEnterTower(state, moverDie, toKey)) return state;
        return { ...moveTopDie(state, fromKey, toKey), phase: 'action' };
    }

    // --- Enemy die: set up combat (die does NOT move yet) ---
    let resolvedDirection = approachDirection;
    if (!resolvedDirection) {
        const dirs = getApproachDirections(state, fromKey, toKey);
        if (dirs.size === 1) resolvedDirection = [...dirs][0];
    }

    return {
        ...state,
        phase: 'combat',
        actionTaken: true,
        combat: {
            attackerHex: fromKey,
            defenderHex: toKey,
            approachDirection: resolvedDirection,
            options: ['push', 'occupy'],
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
 * @param {import('./gameState.js').GameState} state
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
 * The jumping die uses only its face value for attack-strength purposes (no tower bonus),
 * but the *range* is determined by getJumpRange (own − enemy, min 1).
 *
 * Traversal rules:
 * - Cannot pass through enemy dice.
 * - Can pass through own dice only if, as a solo die, it could enter that tower
 *   (i.e. its face value + 1 own − 0 enemy > top die strength there).
 * - Cannot land back on the source tower.
 *
 * @param {import('./gameState.js').GameState} state
 * @param {string} towerKey
 * @returns {Set<string>}
 */
export function getJumpReachableHexes(state, towerKey) {
    const stack = getDiceAt(state, towerKey);
    if (stack.length < 2) return new Set(); // need at least 2 dice to jump
    const jumper = stack[stack.length - 1];
    const maxSteps = getJumpRange(state, towerKey);
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

            // Traversal: enemy blocks further movement; own only if jumper (solo) can enter
            if (!isEnemy) {
                const soloCanTraverse = ctrl === null || canEnterTower(state, jumper, neighborKey);
                if (soloCanTraverse) queue.push([neighborKey, newSteps]);
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
 * @param {import('./gameState.js').GameState} state
 * @param {string} towerKey
 * @param {string} targetKey
 * @param {string|null} [approachDirection]
 * @returns {import('./gameState.js').GameState}
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
        return { ...moveTopDie(state, towerKey, targetKey), phase: 'action' };
    }

    // Enemy — set up combat (jump variant: face value only)
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

    const jumperStrength = getAttackStrength(state, towerKey, { jumped: true });

    return {
        ...state,
        phase: 'combat',
        actionTaken: true,
        combat: {
            attackerHex: towerKey,
            defenderHex: targetKey,
            approachDirection: resolvedDirection,
            attackStrengthOverride: jumperStrength, // face value only
            options: ['push', 'occupy'],
        },
    };
}
