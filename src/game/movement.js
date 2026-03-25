/**
 * Phase 3.1 — Path validation for Move Die
 *
 * All functions are pure — they read GameState but never mutate it.
 * hexKey format: "q,r,s" (produced by hexUtils.hexKey)
 */

import { hexKey, hexFromKey, getNeighbors } from '../hex/hexUtils.js';
import { isOnBoard } from '../hex/boardUtils.js';
import { getTopDie, getController, canEnterTower } from './gameState.js';

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
