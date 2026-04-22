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
    canCollapse,
    applyCollapseAction,
    applyRerollAction,
} from '../../src/game/movement.js';
import { getAvailableCombatOptions } from '../../src/game/combat.js';

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

    it('pass-through boost: die can traverse a second friendly that plain face value cannot enter', () => {
        // Mover red(3) at CENTER, friendly red(2) at N1 (strength 2), second friendly red(3) at N1_N1 (strength 3).
        // Plain face value 3: canEnterTower(N1_N1) = 3 > 3? No — cannot traverse N1_N1.
        // After passing through N1 (1 own die, 0 enemy): boostStr = 3+1-0 = 4, boostLeft = 2.
        // Boosted: canEnterTower(N1_N1) = 4 > 3? Yes — can traverse N1_N1.
        // Target '3,-3,0' is ONLY reachable in 3 steps via CENTER→N1→N1_N1 (no other 3-step path exists
        // on the board). With boost the mover traverses N1_N1 and lands there.
        const N1_N1_DEEP = '3,-3,0';
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1]: [{ owner: 'red', value: 2 }],
                [N1_N1]: [{ owner: 'red', value: 3 }],
            },
        });
        const result = getReachableHexes(state, CENTER);
        expect(result.has(N1_N1)).toBe(true);    // N1_N1 is a valid landing spot
        expect(result.has(N1_N1_DEEP)).toBe(true); // reachable only via boosted traversal of N1_N1
    });

    it('pass-through boost does not enable traversal through a formation stronger than the boost', () => {
        // Mover red(3) at CENTER, friendly red(2) at N1 (strength 2, traversable):
        //   boostStr = 3+1-0 = 4, boostLeft = 2.
        // N1_N1 has red(4) (strength 4). Boost power 4 not > 4 — cannot traverse N1_N1.
        // '3,-3,0' is ONLY reachable via CENTER→N1→N1_N1→'3,-3,0'; since N1_N1 blocks traversal,
        // the deep hex is NOT reachable.
        const N1_N1_DEEP = '3,-3,0';
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1]: [{ owner: 'red', value: 2 }],
                [N1_N1]: [{ owner: 'red', value: 4 }],
            },
        });
        const result = getReachableHexes(state, CENTER);
        expect(result.has(N1_N1)).toBe(true);       // N1_N1 is a valid landing spot
        expect(result.has(N1_N1_DEEP)).toBe(false); // blocked: boost=4 not > strength=4
    });

    it('pass-through boost from larger friendly tower provides greater boost and enables traversal of stronger formation', () => {
        // Mover red(4) at CENTER. N1 has tower [red(1), red(2)] (top=red(2), strength=3).
        //   Entry check: mover value 4 > strength 3 ✓.
        //   Boost: boostStr = 4+2-0 = 6, boostLeft = max(1, 3-0) = 3.
        // N1_N1 has red(5) (strength 5). Single-die boost (5) not > 5. Tower boost (6) > 5 ✓.
        // '3,-3,0' (only reachable via N1→N1_N1) is reachable with the larger tower boost.
        const N1_N1_DEEP = '3,-3,0';
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 4 }],
                [N1]: [{ owner: 'red', value: 1 }, { owner: 'red', value: 2 }],
                [N1_N1]: [{ owner: 'red', value: 5 }],
            },
        });
        const result = getReachableHexes(state, CENTER);
        // With boost 6 the mover CAN traverse N1_N1 (6 > 5) and reach the deep hex.
        expect(result.has(N1_N1_DEEP)).toBe(true);
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

    it('pass-through boost: includes path through second friendly that plain face value cannot traverse', () => {
        // Mover red(3) at CENTER, friendly red(2) at N1 (strength 2), second friendly red(3) at N1_N1 (strength 3).
        // Without boost: cannot traverse N1_N1 (3 not > 3).
        // With boost from N1 (boostStr=4): 4 > 3 ✓ — can traverse N1_N1.
        // '3,-3,0' is only reachable in 3 steps via CENTER→N1→N1_N1, so a path through both
        // N1 and N1_N1 to that target must exist when boost is active.
        const N1_N1_DEEP = '3,-3,0';
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1]: [{ owner: 'red', value: 2 }],
                [N1_N1]: [{ owner: 'red', value: 3 }],
            },
        });
        const result = getPathsToHex(state, CENTER, N1_N1_DEEP);
        expect(result.length).toBeGreaterThan(0);
        const pathThroughBothFriendlies = result.some(p => p.includes(N1) && p.includes(N1_N1));
        expect(pathThroughBothFriendlies).toBe(true);
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

    describe('move-tower', () => {
        it('returns tower origin as approach direction when enemy is adjacent (range 1)', () => {
            // Mixed tower: 2 red + 1 blue → own=2, enemy=1 → range = 2 - 1 = 1
            // Only path to adjacent N1 is [CENTER, N1] → approach = CENTER
            const state = makeState({
                dice: {
                    [CENTER]: [{ owner: 'blue', value: 1 }, { owner: 'red', value: 3 }, { owner: 'red', value: 4 }],
                    [N1]: [{ owner: 'blue', value: 1 }],
                },
            });
            const result = getApproachDirections(state, CENTER, N1, 'move-tower');
            expect(result.size).toBe(1);
            expect(result.has(CENTER)).toBe(true);
        });

        it('returns empty set when enemy is out of tower move range', () => {
            // Tower with 1 own die − 1 enemy die → range = 1; enemy target is 2 steps away
            const state = makeState({
                dice: {
                    [CENTER]: [{ owner: 'blue', value: 2 }, { owner: 'red', value: 3 }],
                    [N1_N1]: [{ owner: 'blue', value: 1 }],
                },
            });
            const result = getApproachDirections(state, CENTER, N1_N1, 'move-tower');
            expect(result.size).toBe(0);
        });

        it('returns empty set when all paths to enemy are blocked by occupied intermediates', () => {
            // Enemy is 2 steps away but N1 (the only intermediate on the direct path) is occupied
            const state = makeState({
                dice: {
                    [CENTER]: [{ owner: 'red', value: 3 }, { owner: 'red', value: 2 }],
                    [N1]: [{ owner: 'red', value: 1 }],   // own die blocks traversal
                    [N1_N1]: [{ owner: 'blue', value: 1 }],
                },
            });
            // All 6 neighbours of CENTER are occupied or off-board except the ones that
            // lead back through N1; we block enough to leave no empty intermediate path.
            // Add friendly blockers on the other two neighbours that could reach N1_N1 in 2 steps
            const state2 = {
                ...state,
                dice: {
                    ...state.dice,
                    [N2]: [{ owner: 'red', value: 1 }],
                    [N6]: [{ owner: 'red', value: 1 }],
                },
            };
            const result = getApproachDirections(state2, CENTER, N1_N1, 'move-tower');
            expect(result.size).toBe(0);
        });
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
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1_N1]: [{ owner: 'blue', value: 2 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1_N1, N1);
        expect(result.combat.approachDirection).toBe(N1);
    });

    it('auto-resolves approachDirection when single approach direction exists', () => {
        // Top die value 1 → range 1, so only direct 1-step approach (CENTER).
        // Tower gives attack strength 1+1-0=2 > defender 1, so canAttack passes.
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 2 }, { owner: 'red', value: 1 }],
                [N1]: [{ owner: 'blue', value: 1 }],
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
                [N2]: [{ owner: 'blue', value: 1 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N2);
        expect(result.combat.approachDirection).toBe(null);
    });

    it('pass-through boost: sets attackStrengthOverride to boosted value when path traverses a friendly', () => {
        // Mover red(3) at CENTER, friendly red(2) at N1 (intermediate), enemy blue(1) at N1_N1.
        // baseStr = getAttackStrength(CENTER) = 3 (standalone).
        // Path CENTER→N1→N1_N1: after N1 (own, 1 own die, 0 enemy), boostStr = 3+1-0 = 4, boostLeft = 2.
        // At N1_N1 (destination, last step): effectivePower = boostStr = 4.
        // So attackStrengthOverride = max(baseStr=3, boosted=4) = 4.
        const state = makeState({
            dice: {
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1]: [{ owner: 'red', value: 2 }],
                [N1_N1]: [{ owner: 'blue', value: 1 }],
            },
        });
        const result = applyMoveAction(state, CENTER, N1_N1, N1);
        expect(result.phase).toBe('combat');
        expect(result.combat.attackStrengthOverride).toBe(4);
        // Confirm it is strictly greater than the base (non-boosted) attack strength of 3
        expect(result.combat.attackStrengthOverride).toBeGreaterThan(3);
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

    it('includes enemy hex and can reach beyond it via other paths', () => {
        // Range = jumper face value = 4; enemy at N1 blocks traversal through N1,
        // but N1_N1 is reachable via other paths (range allows it)
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
        expect(result.has(N1)).toBe(true);     // can land on enemy
        expect(result.has(N1_N1)).toBe(true);  // reachable via paths not through N1
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

    it('respects range equal to jumper face value', () => {
        // Jumper face value 1 → range is 1; only direct neighbors reachable
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 1 },
            ]},
        });
        const result = getJumpReachableHexes(state, CENTER);
        expect(result.has(N1)).toBe(true);      // 1-step neighbor, within range
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
        // Jumper face value 1 → range is 1; N1_N1 is 2 steps away, out of range
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 1 },
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
                [N1]: [{ owner: 'blue', value: 3 }],
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
                [N1]: [{ owner: 'blue', value: 3 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'red', value: 3 },
            { owner: 'red', value: 4 },
        ]);
        expect(result.dice[N1]).toEqual([{ owner: 'blue', value: 3 }]);
    });

    it('sets combat with attackStrengthOverride equal to tower strength when within boosted range', () => {
        // Jumper value 4 in a tower of 2 red dice: tower strength = 4+1-0 = 5.
        // boostedRange = getJumpRange = max(1, 2-0) = 2; N1 is 1 step away (within range).
        // So attackStrengthOverride = tower strength = 5.
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 3 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1);
        expect(result.combat.attackStrengthOverride).toBe(5);
    });

    it('sets combat with attackStrengthOverride equal to face value beyond boosted range', () => {
        // Jumper value 4 in a tower of 2 red dice: tower strength = 5, boostedRange = 2.
        // N1_N1 is 2 steps away from CENTER — exactly at the edge of boostedRange (<=2 qualifies),
        // so use tower strength = 5. For a target 3+ steps away, use face value = 4.
        // Use a blue+red tower: boostedRange = max(1,1-1)=1; N1_N1 at distance 2 > 1 → face value.
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'blue', value: 2 },
                    { owner: 'red', value: 4 },
                ],
                [N1_N1]: [{ owner: 'blue', value: 2 }],
            },
        });
        const result = applyJumpAction(state, CENTER, N1_N1);
        expect(result.combat.attackStrengthOverride).toBe(4); // face value, beyond boostedRange
    });

    it('sets combat.attackerHex and combat.defenderHex when jumping to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 3 }],
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
                [N1]: [{ owner: 'blue', value: 3 }],
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
                [N1_N1]: [{ owner: 'blue', value: 3 }],
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
                [N1]: [{ owner: 'blue', value: 3 }],
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

    it('excludes own hex where tower cannot enter and does not traverse through it', () => {
        // Tower top value 4; N1 has red(5) with strength 5 > 4 — tower cannot enter N1.
        // N1 is excluded from reachable hexes (BUG-014 fix) and cannot be traversed.
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
        expect(result.has(N1)).toBe(false);     // cannot enter: top value 4 ≤ N1 strength 5
        expect(result.has(N1_N1)).toBe(false);  // cannot traverse through N1
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
                [N1]: [{ owner: 'blue', value: 4 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result.phase).toBe('combat');
        expect(result.actionTaken).toBe(true);
    });

    it('sets combat.options to push and occupy when moving tower to single enemy die', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 4 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(getAvailableCombatOptions(result)).toEqual(['push', 'occupy']);
    });

    it('sets combat.attackerHex and combat.defenderHex when moving to enemy hex', () => {
        const state = makeState({
            dice: {
                [CENTER]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
                [N1]: [{ owner: 'blue', value: 4 }],
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
                [N1]: [{ owner: 'blue', value: 4 }],
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
                [N1_N1]: [{ owner: 'blue', value: 4 }],
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
                [N1]: [{ owner: 'blue', value: 4 }],
            },
        });
        const result = applyMoveTowerAction(state, CENTER, N1);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'red', value: 3 },
            { owner: 'red', value: 4 },
        ]);
        expect(result.dice[N1]).toEqual([{ owner: 'blue', value: 4 }]);
    });
});

// ---------------------------------------------------------------------------
// canCollapse
// ---------------------------------------------------------------------------

describe('canCollapse', () => {
    it('returns false for empty hex', () => {
        const state = makeState();
        expect(canCollapse(state, CENTER)).toBe(false);
    });

    it('returns false for single die', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 4 }] },
        });
        expect(canCollapse(state, CENTER)).toBe(false);
    });

    it('returns false for two dice', () => {
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        expect(canCollapse(state, CENTER)).toBe(false);
    });

    it('returns false for three dice when current player is NOT on top', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'red', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'blue', value: 4 },
            ]},
        });
        expect(canCollapse(state, CENTER)).toBe(false);
    });

    it('returns true for three dice with current player on top', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'red', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        expect(canCollapse(state, CENTER)).toBe(true);
    });

    it('returns true for mixed tower with 3+ dice and current player on top', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        expect(canCollapse(state, CENTER)).toBe(true);
    });

    it('returns true for four dice with current player on top', () => {
        const state = makeState({
            currentPlayer: 'blue',
            dice: { [CENTER]: [
                { owner: 'red', value: 1 },
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'blue', value: 5 },
            ]},
        });
        expect(canCollapse(state, CENTER)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// applyCollapseAction
// ---------------------------------------------------------------------------

describe('applyCollapseAction', () => {
    it('returns state unchanged when hex is empty', () => {
        const state = makeState();
        const result = applyCollapseAction(state, CENTER);
        expect(result).toBe(state);
    });

    it('returns state unchanged when tower has only one die', () => {
        const state = makeState({
            dice: { [CENTER]: [{ owner: 'red', value: 4 }] },
        });
        const result = applyCollapseAction(state, CENTER);
        expect(result).toBe(state);
    });

    it('returns state unchanged when tower has only two dice', () => {
        const state = makeState({
            dice: { [CENTER]: [
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyCollapseAction(state, CENTER);
        expect(result).toBe(state);
    });

    it('returns state unchanged when current player is not on top', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'red', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'blue', value: 4 },
            ]},
        });
        const result = applyCollapseAction(state, CENTER);
        expect(result).toBe(state);
    });

    it('removes bottom die when it belongs to current player (no score change)', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'red', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyCollapseAction(state, CENTER);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'red', value: 3 },
            { owner: 'red', value: 4 },
        ]);
        expect(result.scores).toEqual({ red: 0, blue: 0 });
    });

    it('removes enemy bottom die and increments score', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyCollapseAction(state, CENTER);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'red', value: 3 },
            { owner: 'red', value: 4 },
        ]);
        expect(result.scores).toEqual({ red: 1, blue: 0 });
    });

    it('sets actionTaken to true', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'red', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyCollapseAction(state, CENTER);
        expect(result.actionTaken).toBe(true);
    });

    it('does not modify other state properties', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'red', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        const result = applyCollapseAction(state, CENTER);
        expect(result.phase).toBe('action');
        expect(result.currentPlayer).toBe('red');
        expect(result.focalPoints).toEqual({});
        expect(result.combat).toBeNull();
    });

    it('works correctly for four-dice tower removing enemy bottom die', () => {
        const state = makeState({
            currentPlayer: 'blue',
            dice: { [CENTER]: [
                { owner: 'red', value: 1 },
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'blue', value: 5 },
            ]},
        });
        const result = applyCollapseAction(state, CENTER);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'blue', value: 2 },
            { owner: 'red', value: 3 },
            { owner: 'blue', value: 5 },
        ]);
        expect(result.scores).toEqual({ red: 0, blue: 1 });
    });

    it('increments existing score correctly', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 3 },
                { owner: 'red', value: 4 },
            ]},
        });
        state.scores = { red: 3, blue: 2 };
        const result = applyCollapseAction(state, CENTER);
        expect(result.scores).toEqual({ red: 4, blue: 2 });
    });
});

// ---------------------------------------------------------------------------
// applyRerollAction
// ---------------------------------------------------------------------------

describe('applyRerollAction', () => {
    it('returns state unchanged when hex is empty', () => {
        const state = makeState();
        const result = applyRerollAction(state, CENTER, 4);
        expect(result).toBe(state);
    });

    it('returns state unchanged when top die belongs to opponent', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [{ owner: 'blue', value: 3 }] },
        });
        const result = applyRerollAction(state, CENTER, 5);
        expect(result).toBe(state);
    });

    it('updates die value when newValue is greater than original', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [{ owner: 'red', value: 2 }] },
        });
        const result = applyRerollAction(state, CENTER, 5);
        expect(result.dice[CENTER]).toEqual([{ owner: 'red', value: 5 }]);
    });

    it('keeps original value when newValue is less than original', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [{ owner: 'red', value: 5 }] },
        });
        const result = applyRerollAction(state, CENTER, 2);
        expect(result.dice[CENTER]).toEqual([{ owner: 'red', value: 5 }]);
    });

    it('keeps original value when newValue equals original', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [{ owner: 'red', value: 4 }] },
        });
        const result = applyRerollAction(state, CENTER, 4);
        expect(result.dice[CENTER]).toEqual([{ owner: 'red', value: 4 }]);
    });

    it('sets actionTaken to true', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [{ owner: 'red', value: 3 }] },
        });
        const result = applyRerollAction(state, CENTER, 5);
        expect(result.actionTaken).toBe(true);
    });

    it('works on tower top (not bottom die)', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'red', value: 2 },
                { owner: 'red', value: 3 },
            ]},
        });
        const result = applyRerollAction(state, CENTER, 5);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'red', value: 2 },
            { owner: 'red', value: 5 },
        ]);
    });

    it('does not modify other dice', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: {
                [CENTER]: [{ owner: 'red', value: 3 }],
                [N1]: [{ owner: 'red', value: 4 }],
            },
        });
        const result = applyRerollAction(state, CENTER, 6);
        expect(result.dice[CENTER]).toEqual([{ owner: 'red', value: 6 }]);
        expect(result.dice[N1]).toEqual([{ owner: 'red', value: 4 }]);
    });

    it('does not modify other state properties', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [{ owner: 'red', value: 3 }] },
        });
        const result = applyRerollAction(state, CENTER, 5);
        expect(result.currentPlayer).toBe('red');
        expect(result.phase).toBe('action');
        expect(result.scores).toEqual({ red: 0, blue: 0 });
        expect(result.combat).toBeNull();
    });

    it('works on mixed tower top when current player owns top die', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'blue', value: 2 },
                { owner: 'red', value: 3 },
            ]},
        });
        const result = applyRerollAction(state, CENTER, 5);
        expect(result.dice[CENTER]).toEqual([
            { owner: 'blue', value: 2 },
            { owner: 'red', value: 5 },
        ]);
    });

    it('returns state unchanged for mixed tower when opponent owns top die', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [
                { owner: 'red', value: 2 },
                { owner: 'blue', value: 3 },
            ]},
        });
        const result = applyRerollAction(state, CENTER, 5);
        expect(result).toBe(state);
    });

    it('handles value 1 rerolled to value 6', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [{ owner: 'red', value: 1 }] },
        });
        const result = applyRerollAction(state, CENTER, 6);
        expect(result.dice[CENTER]).toEqual([{ owner: 'red', value: 6 }]);
    });

    it('handles value 6 rerolled to value 1 (keeps 6)', () => {
        const state = makeState({
            currentPlayer: 'red',
            dice: { [CENTER]: [{ owner: 'red', value: 6 }] },
        });
        const result = applyRerollAction(state, CENTER, 1);
        expect(result.dice[CENTER]).toEqual([{ owner: 'red', value: 6 }]);
    });
});

