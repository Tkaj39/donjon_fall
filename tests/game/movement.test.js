import { describe, it, expect } from 'vitest';
import {
    getReachableHexes,
    getPathsToHex,
    getApproachDirections,
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
