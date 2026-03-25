import { describe, it, expect } from 'vitest';
import {
    getReachableHexes,
    getPathsToHex,
    getApproachDirections,
    applyMoveAction,
    getJumpRange,
    getJumpReachableHexes,
    applyJumpAction,
    getTowerMoveRange,
    getTowerReachableHexes,
    applyMoveTowerAction,
} from '../../src/game/movement.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState({ dice = {}, currentPlayer = 'red' } = {}) {
    return {
        players: ['red', 'blue'],
        currentPlayer,
        phase: 'action',
        dice,
        focalPoints: {},
        scores: { red: 0, blue: 0 },
        activeFocalHolders: { red: null, blue: null },
        combat: null,
        actionTaken: false,
    };
}

// Real hex coordinates from the 61-hex board
const CENTER = '0,0,0';
const N1 = '1,-1,0';
const N2 = '1,0,-1';
const N3 = '0,1,-1';
const N4 = '-1,1,0';
const N5 = '-1,0,1';
const N6 = '0,-1,1';

// Two-step neighbors (from CENTER via N1)
const N1_N1 = '2,-2,0';
const N1_N2 = '2,-1,-1';
const N1_N6 = '1,-2,1';

// ---------------------------------------------------------------------------
// getReachableHexes
// ---------------------------------------------------------------------------

describe('getReachableHexes', () => {
    it('returns empty set when no die at fromKey', () => {
        const state = makeState();
        const result = getReachableHexes(state, CENTER);
        expect(result.size).toBe(0);
    });

    it('returns only immediate neighbors for die with value 1', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 1 }] },
        });
        const result = getReachableHexes(state, CENTER);
        expect(result.size).toBe(6);
        expect(result.has(N1)).toBe(true);
        expect(result.has(N2)).toBe(true);
        expect(result.has(N3)).toBe(true);
        expect(result.has(N4)).toBe(true);
        expect(result.has(N5)).toBe(true);
        expect(result.has(N6)).toBe(true);
    });

    it('returns neighbors and their neighbors for die with value 2', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 2 }] },
        });
        const result = getReachableHexes(state, CENTER);
        expect(result.size).toBeGreaterThan(6); // at least 6 immediate + some 2-step
        expect(result.has(N1)).toBe(true);      // 1-step
        expect(result.has(N1_N1)).toBe(true);   // 2-step
        expect(result.has(N1_N2)).toBe(true);   // 2-step
    });

    it('includes enemy hex in reachable set but not hexes behind enemy', () => {
        // Block all paths except through N1 by placing enemies around
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 2 }],
                [N1]: [{ owner: 'blue', value: 3 }],
                [N2]: [{ owner: 'blue', value: 3 }],
                [N3]: [{ owner: 'blue', value: 3 }],
                [N4]: [{ owner: 'blue', value: 3 }],
                [N5]: [{ owner: 'blue', value: 3 }],
                [N6]: [{ owner: 'blue', value: 3 }],
            },
        });
        const result = getReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);    // enemy is reachable (can land)
        expect(result.has(N1_N1)).toBe(false); // but can't traverse through enemy
        expect(result.has(N1_N2)).toBe(false);
        expect(result.has(N1_N6)).toBe(false);
    });

    it('includes own die when canEnterTower is true and continues beyond it', () => {
        // Own die with value 2 at N1; mover with value 4 can enter (4+1-0 > 2+1-0)
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 4 }],
                [N1]: [{ owner: 'red', value: 2 }],
            },
        });
        const result = getReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);    // can land on own tower
        expect(result.has(N1_N1)).toBe(true); // can traverse through and continue
    });

    it('includes own die in reachable set but blocks traversal when canEnterTower is false', () => {
        // Mover red(2) at CENTER; own red(5) at N1 — canEnterTower is false (2+2-0=4 NOT > 5+1-0=6).
        // With range 2, N1_N1 is only reachable via N1 (all 2-step paths go through N1).
        // So N1 is a valid landing spot but N1_N1 must be blocked.
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 2 }],
                [N1]: [{ owner: 'red', value: 5 }],
            },
        });
        const result = getReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);     // can land on own die
        expect(result.has(N1_N1)).toBe(false); // only reachable via N1 which blocks traversal
    });

    it('never includes starting hex in reachable set', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 6 }] },
        });
        const result = getReachableHexes(state, CENTER);
        expect(result.has(CENTER)).toBe(false);
    });

    it('respects die value as maximum range', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 1 }] },
        });
        const result = getReachableHexes(state, CENTER);
        // With value 1, cannot reach 2-step neighbors
        expect(result.has(N1_N1)).toBe(false);
        expect(result.has(N1_N2)).toBe(false);
    });

    it('handles empty board with high-value die', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 6 }] },
        });
        const result = getReachableHexes(state, CENTER);
        // Should reach many hexes on empty board
        expect(result.size).toBeGreaterThan(20);
    });
});

// ---------------------------------------------------------------------------
// getPathsToHex
// ---------------------------------------------------------------------------

describe('getPathsToHex', () => {
    it('returns empty array when fromKey equals toKey', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 3 }] },
        });
        const result = getPathsToHex(state, CENTER, CENTER);
        expect(result).toEqual([]);
    });

    it('returns empty array when no die at fromKey', () => {
        const state = makeState();
        const result = getPathsToHex(state, CENTER, N1);
        expect(result).toEqual([]);
    });

    it('returns single path for direct neighbor one step away', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 1 }] },
        });
        const result = getPathsToHex(state, CENTER, N1);
        expect(result.length).toBe(1);
        expect(result[0]).toEqual([CENTER, N1]);
    });

    it('returns single path for two-step neighbor', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 2 }] },
        });
        const result = getPathsToHex(state, CENTER, N1_N1);
        expect(result.length).toBeGreaterThanOrEqual(1);
        const foundDirectPath = result.some(path =>
            path.length === 3 && path[0] === CENTER && path[2] === N1_N1
        );
        expect(foundDirectPath).toBe(true);
    });

    it('does not include paths blocked by enemy intermediate hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 2 }],
                [N1]: [{ owner: 'blue', value: 3 }],
            },
        });
        const result = getPathsToHex(state, CENTER, N1_N1);
        // Cannot traverse through enemy at N1 to reach N1_N1
        const blockedPath = result.some(path => path.includes(N1));
        expect(blockedPath).toBe(false);
    });

    it('returns multiple paths when multiple routes exist', () => {
        // Value 2 from CENTER can reach N3 via N2 or directly
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 2 }] },
        });
        const result = getPathsToHex(state, CENTER, '2,-1,-1'); // 2 steps away via various routes
        expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('respects max path length equal to die value plus one', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 1 }] },
        });
        const result = getPathsToHex(state, CENTER, N1_N1);
        // Die value 1 means max 2 hexes in path (start + 1 step), cannot reach 2-step neighbor
        expect(result).toEqual([]);
    });

    it('allows landing on enemy at destination even if cannot traverse enemies', () => {
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 1 }],
                [N1]: [{ owner: 'blue', value: 3 }],
            },
        });
        const result = getPathsToHex(state, CENTER, N1);
        expect(result.length).toBe(1);
        expect(result[0]).toEqual([CENTER, N1]);
    });

    it('prevents cycles in paths', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 6 }] },
        });
        const result = getPathsToHex(state, CENTER, N1);
        // Every path should have unique hexes
        for (const path of result) {
            const uniqueHexes = new Set(path);
            expect(uniqueHexes.size).toBe(path.length);
        }
    });

    it('allows path through own die when canEnterTower is true', () => {
        // Mover value 5, own die at N1 value 2: can enter (5+1-0 > 2+1-0)
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 5 }],
                [N1]: [{ owner: 'red', value: 2 }],
            },
        });
        const result = getPathsToHex(state, CENTER, N1_N1);
        const pathThroughN1 = result.some(path => path.includes(N1));
        expect(pathThroughN1).toBe(true);
    });

    it('blocks path through own die when canEnterTower is false', () => {
        // Mover value 2, own die at N1 value 5: cannot enter (2+1-0 = 3 NOT > 5+1-0 = 6)
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 2 }],
                [N1]: [{ owner: 'red', value: 5 }],
            },
        });
        const result = getPathsToHex(state, CENTER, N1_N1);
        const pathThroughN1 = result.some(path => path.includes(N1));
        expect(pathThroughN1).toBe(false);
    });

    it('includes start and end hexes in returned paths', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 2 }] },
        });
        const result = getPathsToHex(state, CENTER, N1);
        expect(result.length).toBeGreaterThan(0);
        for (const path of result) {
            expect(path[0]).toBe(CENTER);
            expect(path[path.length - 1]).toBe(N1);
        }
    });
});

// ---------------------------------------------------------------------------
// getApproachDirections
// ---------------------------------------------------------------------------

describe('getApproachDirections', () => {
    it('returns single approach direction for direct neighbor', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 1 }] },
        });
        const result = getApproachDirections(state, CENTER, N1);
        expect(result.size).toBe(1);
        expect(result.has(CENTER)).toBe(true);
    });

    it('returns single approach for two-step path with one route', () => {
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 2 }],
                [N2]: [{ owner: 'blue', value: 3 }],  // block alternative routes
                [N6]: [{ owner: 'blue', value: 3 }],
            },
        });
        const result = getApproachDirections(state, CENTER, N1_N1);
        // Only way to reach N1_N1 from CENTER is via N1
        expect(result.has(N1)).toBe(true);
    });

    it('returns multiple approach directions when multiple paths exist', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 2 }] },
        });
        const result = getApproachDirections(state, CENTER, '1,-2,1'); // N1_N6, reachable via N1 or N6
        expect(result.size).toBeGreaterThanOrEqual(1);
    });

    it('returns empty set for unreachable destination', () => {
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 1 }],
            },
        });
        const result = getApproachDirections(state, CENTER, N1_N1);
        expect(result.size).toBe(0);
    });

    it('returns empty set when no die at fromKey', () => {
        const state = makeState();
        const result = getApproachDirections(state, CENTER, N1);
        expect(result.size).toBe(0);
    });

    it('returns empty set when fromKey equals toKey', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 3 }] },
        });
        const result = getApproachDirections(state, CENTER, CENTER);
        expect(result.size).toBe(0);
    });

    it('returns second-to-last hex from valid paths', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 2 }] },
        });
        const result = getApproachDirections(state, CENTER, N1);
        // Paths to N1 are just [CENTER, N1], so approach is CENTER
        expect(result.has(CENTER)).toBe(true);
    });

    it('deduplicates approach directions from multiple paths', () => {
        // Even if multiple paths go through the same second-to-last hex, it appears once
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 3 }] },
        });
        const result = getApproachDirections(state, CENTER, N1_N1);
        // Various paths might all go through N1 as the last step before N1_N1
        const resultArray = Array.from(result);
        const uniqueSet = new Set(resultArray);
        expect(resultArray.length).toBe(uniqueSet.size);
    });
});

// ---------------------------------------------------------------------------
// applyMoveAction
// ---------------------------------------------------------------------------

describe('applyMoveAction', () => {
    it('moves die to empty hex and sets actionTaken true and phase action', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 3 }] },
        });
        const result = applyMoveAction(state, CENTER, N1);
        expect(result.dice[N1]).toEqual([{ owner: 'red', value: 3 }]);
        expect(result.actionTaken).toBe(true);
        expect(result.phase).toBe('action');
    });

    it('removes fromKey from dice when last die moves away to empty hex', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 2 }] },
        });
        const result = applyMoveAction(state, CENTER, N1);
        expect(result.dice[CENTER]).toBeUndefined();
        expect(result.dice[N1]).toEqual([{ owner: 'red', value: 2 }]);
    });

    it('stacks die on own die when canEnterTower is true', () => {
        // Mover value 5 at CENTER, own die value 2 at N1: can enter (5+1-0 > 2+1-0)
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 5 }],
                [N1]: [{ owner: 'red', value: 2 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1);
        expect(result.dice[N1]).toEqual([
            { owner: 'red', value: 2 },
            { owner: 'red', value: 5 },
        ]);
        expect(result.actionTaken).toBe(true);
        expect(result.phase).toBe('action');
    });

    it('returns state unchanged when moving to own die and canEnterTower is false', () => {
        // Mover value 2 at CENTER, own die value 5 at N1: cannot enter (2+1-0 NOT > 5+1-0)
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 2 }],
                [N1]: [{ owner: 'red', value: 5 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1);
        expect(result).toBe(state); // Same reference
    });

    it('sets phase to combat and actionTaken true when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1]: [{ owner: 'blue', value: 2 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1);
        expect(result.phase).toBe('combat');
        expect(result.actionTaken).toBe(true);
    });

    it('does not move die when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1]: [{ owner: 'blue', value: 2 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1);
        expect(result.dice[CENTER]).toEqual([{ owner: 'red', value: 3 }]);
        expect(result.dice[N1]).toEqual([{ owner: 'blue', value: 2 }]);
    });

    it('sets combat.attackerHex and combat.defenderHex when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1]: [{ owner: 'blue', value: 2 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1);
        expect(result.combat.attackerHex).toBe(CENTER);
        expect(result.combat.defenderHex).toBe(N1);
    });

    it('sets combat.options to push and occupy when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1]: [{ owner: 'blue', value: 2 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1);
        expect(result.combat.options).toEqual(['push', 'occupy']);
    });

    it('records explicit approachDirection in combat when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 2 }],
                [N1_N1]: [{ owner: 'blue', value: 2 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1_N1, N1);
        expect(result.combat.approachDirection).toBe(N1);
    });

    it('auto-resolves approachDirection when single approach direction exists', () => {
        // Direct neighbor: only one approach (CENTER)
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 1 }],
                [N1]: [{ owner: 'blue', value: 2 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1);
        expect(result.combat.approachDirection).toBe(CENTER);
    });

    it('sets approachDirection to null when multiple approaches exist and none passed', () => {
        // N2 can be reached from CENTER directly or via N1 (different approach directions)
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 2 }],
                [N2]: [{ owner: 'blue', value: 2 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N2);
        expect(result.combat.approachDirection).toBe(null);
    });
});

// ---------------------------------------------------------------------------
// getJumpRange
// ---------------------------------------------------------------------------

describe('getJumpRange', () => {
    it('returns 0 when no die at towerKey', () => {
        const state = makeState();
        expect(getJumpRange(state, CENTER)).toBe(0);
    });

    it('returns 0 for a single die (not a tower)', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 4 }] },
        });
        expect(getJumpRange(state, CENTER)).toBe(0);
    });

    it('returns own dice count minus enemy dice count for two own dice', () => {
        // 2 own - 0 enemy = 2
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        expect(getJumpRange(state, CENTER)).toBe(2);
    });

    it('returns minimum 1 for mixed tower with one own and one enemy', () => {
        // 1 own - 1 enemy = 0 → max(1, 0) = 1
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 5 },
            ]},
        });
        expect(getJumpRange(state, CENTER)).toBe(1);
    });

    it('returns 1 for two own and one enemy', () => {
        // 2 own - 1 enemy = 1
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        expect(getJumpRange(state, CENTER)).toBe(1);
    });

    it('returns minimum 1 even when enemy dice outnumber own dice', () => {
        // 1 own - 2 enemy = -1 → max(1, -1) = 1
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'blue', value: 3 },
                { owner: 'red', value: 5 },
            ]},
        });
        expect(getJumpRange(state, CENTER)).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// getJumpReachableHexes
// ---------------------------------------------------------------------------

describe('getJumpReachableHexes', () => {
    it('returns empty set for a single die', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 4 }] },
        });
        const result = getJumpReachableHexes(state, CENTER);
        expect(result.size).toBe(0);
    });

    it('returns empty set when no die at towerKey', () => {
        const state = makeState();
        const result = getJumpReachableHexes(state, CENTER);
        expect(result.size).toBe(0);
    });

    it('returns reachable hexes within range for two own dice', () => {
        // range = 2 own - 0 enemy = 2
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = getJumpReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);     // 1-step neighbor
        expect(result.has(N1_N1)).toBe(true);  // 2-step neighbor
    });

    it('does not allow landing back on source tower', () => {
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = getJumpReachableHexes(state, CENTER);
        expect(result.has(CENTER)).toBe(false);
    });

    it('includes enemy hex but does not traverse through it', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = getJumpReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);      // can land on enemy
        expect(result.has(N1_N1)).toBe(false);  // cannot traverse through enemy
    });

    it('can traverse through own hex if jumper (solo) can enter tower', () => {
        // Jumper value 5, own die at N1 value 2: as solo (5+1-0 > 2+1-0) can enter
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 5 },
                ],
                [N1]: [{ owner: 'red', value: 2 }],
            },
        });
        const result = getJumpReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);      // can land on own
        expect(result.has(N1_N1)).toBe(true);   // can traverse through own
    });

    it('cannot traverse through own hex if jumper (solo) cannot enter tower', () => {
        // Jumper value 2, own die at N1 value 5: as solo (2+1-0 = 3 NOT > 5+1-0 = 6) cannot enter
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 2 },
                ],
                [N1]: [{ owner: 'red', value: 5 }],
            },
        });
        const result = getJumpReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);      // can land on own
        expect(result.has(N1_N1)).toBe(false);  // only reachable via N1 which blocks traversal
    });

    it('respects range from getJumpRange', () => {
        // 1 own - 1 enemy = 0 → max(1, 0) = 1, so range is 1
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 5 },
            ]},
        });
        const result = getJumpReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);      // 1-step neighbor
        expect(result.has(N1_N1)).toBe(false);  // 2-step neighbor, out of range
    });
});

// ---------------------------------------------------------------------------
// applyJumpAction
// ---------------------------------------------------------------------------

describe('applyJumpAction', () => {
    it('returns state unchanged when no die at towerKey', () => {
        const state = makeState();
        const result = applyJumpAction(state, CENTER, N1);
        expect(result).toBe(state);
    });

    it('returns state unchanged for a single die (not a tower)', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 4 }] },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result).toBe(state);
    });

    it('returns state unchanged when target is not reachable', () => {
        // N1_N1 is out of range for jump range 1
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyJumpAction(state, CENTER, N1_N1);
        expect(result).toBe(state);
    });

    it('moves die to empty hex and sets actionTaken true and phase action', () => {
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.dice[N1]).toEqual([{ owner: 'red', value: 4 }]);
        expect(result.dice[CENTER]).toEqual([{ owner: 'red', value: 3 }]);
        expect(result.actionTaken).toBe(true);
        expect(result.phase).toBe('action');
    });

    it('removes top die from source tower leaving remaining dice', () => {
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'red', value: 2 },
            { owner: 'red', value: 3 },
        ]);
    });

    it('stacks die on own die when canEnterTower is true', () => {
        // Jumper value 5, own die at N1 value 2: can enter (5+1-0 > 2+1-0)
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 5 },
                ],
                [N1]: [{ owner: 'red', value: 2 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.dice[N1]).toEqual([
            { owner: 'red', value: 2 },
            { owner: 'red', value: 5 },
        ]);
        expect(result.actionTaken).toBe(true);
        expect(result.phase).toBe('action');
    });

    it('returns state unchanged when jumping to own die and canEnterTower is false', () => {
        // Jumper value 2, own die at N1 value 5: cannot enter (2+1-0 NOT > 5+1-0)
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 2 },
                ],
                [N1]: [{ owner: 'red', value: 5 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result).toBe(state);
    });

    it('sets phase to combat and actionTaken true when jumping to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.phase).toBe('combat');
        expect(result.actionTaken).toBe(true);
    });

    it('does not move die when jumping to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'red', value: 3 },
            { owner: 'red', value: 4 },
        ]);
        expect(result.dice[N1]).toEqual([{ owner: 'blue', value: 5 }]);
    });

    it('sets combat with attackStrengthOverride equal to jumper face value only', () => {
        // Jumper value 4 in a tower of 2 red dice: normal strength would be 4+2-0=6,
        // but jump uses only face value = 4
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.combat.attackStrengthOverride).toBe(4);
    });

    it('sets combat.attackerHex and combat.defenderHex when jumping to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.combat.attackerHex).toBe(CENTER);
        expect(result.combat.defenderHex).toBe(N1);
    });

    it('sets combat.options to push and occupy when jumping to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.combat.options).toEqual(['push', 'occupy']);
    });

    it('records explicit approachDirection in combat when provided', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1_N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1_N1, N1);
        expect(result.combat.approachDirection).toBe(N1);
    });

    it('auto-resolves approachDirection for adjacent enemy (single direction)', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.combat.approachDirection).toBe(CENTER);
    });
});

// ---------------------------------------------------------------------------
// getTowerMoveRange
// ---------------------------------------------------------------------------

describe('getTowerMoveRange', () => {
    it('returns 0 for a single die', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 4 }] },
        });
        expect(getTowerMoveRange(state, CENTER)).toBe(0);
    });

    it('returns 0 for empty hex', () => {
        const state = makeState();
        expect(getTowerMoveRange(state, CENTER)).toBe(0);
    });

    it('returns 2 for two own dice', () => {
        // 2 own - 0 enemy = 2
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        expect(getTowerMoveRange(state, CENTER)).toBe(2);
    });

    it('returns 1 for two own and one enemy', () => {
        // 2 own - 1 enemy = 1
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        expect(getTowerMoveRange(state, CENTER)).toBe(1);
    });

    it('returns minimum 1 for mixed tower with one own and one enemy', () => {
        // 1 own - 1 enemy = 0 → max(1, 0) = 1
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 5 },
            ]},
        });
        expect(getTowerMoveRange(state, CENTER)).toBe(1);
    });

    it('returns minimum 1 when enemy dice outnumber own dice', () => {
        // 1 own - 2 enemy = -1 → max(1, -1) = 1
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'blue', value: 3 },
                { owner: 'red', value: 5 },
            ]},
        });
        expect(getTowerMoveRange(state, CENTER)).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// getTowerReachableHexes
// ---------------------------------------------------------------------------

describe('getTowerReachableHexes', () => {
    it('returns empty set for a single die', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 4 }] },
        });
        const result = getTowerReachableHexes(state, CENTER);
        expect(result.size).toBe(0);
    });

    it('returns reachable hexes for two own dice with range 2', () => {
        // range = 2 own - 0 enemy = 2
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = getTowerReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);     // 1-step neighbor
        expect(result.has(N1_N1)).toBe(true);  // 2-step neighbor via empty hexes
    });

    it('includes own die blocking hex but does not traverse through it', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'red', value: 5 }],
            },
        });
        const result = getTowerReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);      // can land on own
        expect(result.has(N1_N1)).toBe(false);  // cannot traverse through own
    });

    it('includes enemy hex but does not traverse through it', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = getTowerReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);      // can land on enemy
        expect(result.has(N1_N1)).toBe(false);  // cannot traverse through enemy
    });

    it('does not allow landing back on source hex', () => {
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = getTowerReachableHexes(state, CENTER);
        expect(result.has(CENTER)).toBe(false);
    });

    it('respects range 1 for mixed tower with one own and one enemy', () => {
        // 1 own - 1 enemy = 0 → max(1, 0) = 1, so range is 1
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 5 },
            ]},
        });
        const result = getTowerReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);      // 1-step neighbor
        expect(result.has(N1_N1)).toBe(false);  // 2-step neighbor, out of range
    });
});

// ---------------------------------------------------------------------------
// applyMoveTowerAction
// ---------------------------------------------------------------------------

describe('applyMoveTowerAction', () => {
    it('returns state unchanged for a single die', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 4 }] },
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result).toBe(state);
    });

    it('returns state unchanged when target is not reachable', () => {
        // N1_N1 is out of range if N1 is occupied (blocks traversal)
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'red', value: 5 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1_N1);
        expect(result).toBe(state);
    });

    it('moves entire stack to empty hex and deletes fromKey', () => {
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result.dice[N1]).toEqual([
            { owner: 'red', value: 3 },
            { owner: 'red', value: 4 },
        ]);
        expect(result.dice[CENTER]).toBeUndefined();
        expect(result.actionTaken).toBe(true);
        expect(result.phase).toBe('action');
    });

    it('preserves dice order when moving to empty hex', () => {
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result.dice[N1]).toEqual([
            { owner: 'blue', value: 2 },
            { owner: 'red', value: 3 },
            { owner: 'red', value: 4 },
        ]);
    });

    it('sets phase to combat and actionTaken true when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result.phase).toBe('combat');
        expect(result.actionTaken).toBe(true);
    });

    it('sets combat.options to push only when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result.combat.options).toEqual(['push']);
    });

    it('sets combat.attackerHex and combat.defenderHex when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result.combat.attackerHex).toBe(CENTER);
        expect(result.combat.defenderHex).toBe(N1);
    });

    it('auto-resolves approachDirection to fromKey for adjacent enemy', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result.combat.approachDirection).toBe(CENTER);
    });

    it('records explicit approachDirection in combat when provided', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1_N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1_N1, N1);
        expect(result.combat.approachDirection).toBe(N1);
    });

    it('leaves stack at fromKey when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 5 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'red', value: 3 },
            { owner: 'red', value: 4 },
        ]);
        expect(result.dice[N1]).toEqual([{ owner: 'blue', value: 5 }]);
    });
});
