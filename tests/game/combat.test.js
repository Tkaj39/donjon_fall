import { describe, it, expect } from 'vitest';
import {
    canAttack,
    getAvailableCombatOptions,
    getPushDirection,
    getPushChain,
    canPush,
    applyPush,
    applyOccupy,
} from '../../src/game/combat.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal GameState for testing combat functions.
 *
 * @param {Object} options
 * @param {Object} [options.dice={}] - dice placements keyed by hexKey
 * @param {Object|null} [options.combat=null] - combat state object
 * @returns {import('../../src/game/gameState.js').GameState}
 */
function makeState({ dice = {}, combat = null } = {}) {
    return {
        players: ['red', 'blue'],
        currentPlayer: 'red',
        phase: 'combat',
        dice,
        focalPoints: {},
        scores: { red: 0, blue: 0 },
        activeFocalHolders: { red: null, blue: null },
        combat,
        actionTaken: true,
    };
}

const HEX_A = '0,0,0';
const HEX_B = '1,-1,0';

// ---------------------------------------------------------------------------
// canAttack
// ---------------------------------------------------------------------------

describe('canAttack', () => {
    it('returns false when both hexes are empty', () => {
        const state = makeState();
        expect(canAttack(state, HEX_A, HEX_B)).toBe(false);
    });

    it('returns false when attacker equals defender in strength', () => {
        // Both solo dice with value 3 → strength 3 vs 3
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 3 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
        });
        expect(canAttack(state, HEX_A, HEX_B)).toBe(false);
    });

    it('returns false when attacker is weaker than defender', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 2 }],
                [HEX_B]: [{ owner: 'blue', value: 5 }],
            },
        });
        expect(canAttack(state, HEX_A, HEX_B)).toBe(false);
    });

    it('returns true when attacker has higher face value', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
        });
        expect(canAttack(state, HEX_A, HEX_B)).toBe(true);
    });

    it('returns true when attacker tower bonus tips the balance', () => {
        // red tower: value 3 + 2 own − 0 enemy = 5
        // blue solo: value 3 + 1 own − 0 enemy = 3 → strength 3
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 3 }, { owner: 'red', value: 3 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
        });
        expect(canAttack(state, HEX_A, HEX_B)).toBe(true);
    });

    it('returns false when mixed tower makes attacker net weaker', () => {
        // red has 1 die in tower, blue has 2 → net strength for red: value 3 + 1 − 2 = 2
        // blue top: value 3 + 2 − 1 = 4
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'blue', value: 3 }, { owner: 'red', value: 3 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
        });
        // Red controls HEX_A (top die), but is weaker (2 vs 3)
        expect(canAttack(state, HEX_A, HEX_B)).toBe(false);
    });

    it('returns true when defender hex is empty (strength 0)', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 1 }],
            },
        });
        // attacker strength = 1, defender strength = 0 → 1 > 0
        expect(canAttack(state, HEX_A, HEX_B)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// getAvailableCombatOptions
// ---------------------------------------------------------------------------

describe('getAvailableCombatOptions', () => {
    it('returns empty array when there is no combat pending', () => {
        const state = makeState({ combat: null });
        expect(getAvailableCombatOptions(state)).toEqual([]);
    });

    it('returns [push] only when combat is flagged as towerMove', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 4 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, towerMove: true, options: [] },
        });
        expect(getAvailableCombatOptions(state)).toEqual(['push']);
    });

    it('returns [push] for tower vs tower combat', () => {
        // Both formations have 2+ dice
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 3 }, { owner: 'red', value: 3 }],
                [HEX_B]: [{ owner: 'blue', value: 2 }, { owner: 'blue', value: 2 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: [] },
        });
        expect(getAvailableCombatOptions(state)).toEqual(['push']);
    });

    it('returns [push, occupy] for solo die vs solo die', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: [] },
        });
        expect(getAvailableCombatOptions(state)).toEqual(['push', 'occupy']);
    });

    it('returns [push, occupy] for solo attacker vs enemy tower', () => {
        // Single red die attacking a blue-only tower
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 6 }],
                [HEX_B]: [{ owner: 'blue', value: 1 }, { owner: 'blue', value: 1 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: [] },
        });
        expect(getAvailableCombatOptions(state)).toEqual(['push', 'occupy']);
    });

    it('returns [push, occupy] for attacker tower (solo) vs solo die', () => {
        // Attacker has exactly 1 die, defender has 1 die
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 2 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: [] },
        });
        expect(getAvailableCombatOptions(state)).toEqual(['push', 'occupy']);
    });
});

// ---------------------------------------------------------------------------
// getPushDirection
// ---------------------------------------------------------------------------

// Hex layout used in push tests (pointy-top cube coords):
//   HEX_A  = '0,0,0'   — attacker
//   HEX_B  = '1,-1,0'  — defender (east of A)
//   HEX_C  = '2,-2,0'  — one step further east (push land zone for B)
//   HEX_D  = '3,-3,0'  — two steps further east
const HEX_C = '2,-2,0';
const HEX_D = '3,-3,0';

describe('getPushDirection', () => {
    it('returns the delta vector from approach hex to defender hex', () => {
        // Attacker at A approaches B from A → direction is q+1,r-1,s=0
        expect(getPushDirection(HEX_A, HEX_B)).toEqual({ q: 1, r: -1, s: 0 });
    });

    it('works for the opposite direction', () => {
        expect(getPushDirection(HEX_B, HEX_A)).toEqual({ q: -1, r: 1, s: 0 });
    });
});

// ---------------------------------------------------------------------------
// getPushChain
// ---------------------------------------------------------------------------

describe('getPushChain', () => {
    it('returns single-element chain when only defender is present', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A },
        });
        const dir = getPushDirection(HEX_A, HEX_B);
        expect(getPushChain(state, HEX_B, dir)).toEqual([HEX_B]);
    });

    it('returns multi-element chain when multiple enemy formations are lined up', () => {
        // A (red) → B (blue) → C (blue): pushing B also pushes C
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
                [HEX_C]: [{ owner: 'blue', value: 2 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A },
        });
        const dir = getPushDirection(HEX_A, HEX_B);
        expect(getPushChain(state, HEX_B, dir)).toEqual([HEX_B, HEX_C]);
    });

    it('stops chain at own unit (encirclement boundary)', () => {
        // A (red) → B (blue) → C (red): chain stops before own unit at C
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
                [HEX_C]: [{ owner: 'red', value: 2 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A },
        });
        const dir = getPushDirection(HEX_A, HEX_B);
        // Chain only contains B; C (own) terminates it
        expect(getPushChain(state, HEX_B, dir)).toEqual([HEX_B]);
    });

    it('stops chain at empty hex', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
                // HEX_C is empty
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A },
        });
        const dir = getPushDirection(HEX_A, HEX_B);
        expect(getPushChain(state, HEX_B, dir)).toEqual([HEX_B]);
    });
});

// ---------------------------------------------------------------------------
// canPush
// ---------------------------------------------------------------------------

describe('canPush', () => {
    it('returns true when defender hex is occupied', () => {
        const state = makeState({
            dice: { [HEX_B]: [{ owner: 'blue', value: 3 }] },
        });
        expect(canPush(state, HEX_B, {})).toBe(true);
    });

    it('returns false when defender hex is empty', () => {
        expect(canPush(makeState(), HEX_B, {})).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// applyPush
// ---------------------------------------------------------------------------

describe('applyPush', () => {
    it('moves defender one step in push direction (empty landing zone)', () => {
        // A (red, 5) attacks B (blue, 3); land zone C is empty → B moves to C
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A, options: ['push', 'occupy'] },
        });
        const next = applyPush(state, 4); // rerollValue 4 ≤ original 3 → capped at 3
        expect(next.dice[HEX_A]).toBeUndefined(); // attacker left
        expect(next.dice[HEX_B][0].owner).toBe('red'); // attacker moved here
        expect(next.dice[HEX_C]).toBeDefined();
        expect(next.dice[HEX_C][0].owner).toBe('blue');
    });

    it('rerolls defender (capped to original)', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A, options: ['push'] },
        });
        const next = applyPush(state, 6); // reroll 6 capped to original 3
        expect(next.dice[HEX_C][0].value).toBe(3);
    });

    it('rerolls defender to lower value when roll < original', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A, options: ['push'] },
        });
        const next = applyPush(state, 1); // reroll 1 < original 3 → value becomes 1
        expect(next.dice[HEX_C][0].value).toBe(1);
    });

    it('decreases attacker top die by 1 (min 1) and moves attacker to defenderHex', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A, options: ['push'] },
        });
        const next = applyPush(state, 3);
        expect(next.dice[HEX_A]).toBeUndefined();
        expect(next.dice[HEX_B][0].value).toBe(4);
        expect(next.dice[HEX_B][0].owner).toBe('red');
    });

    it('does not decrease attacker below value 1', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 1 }],
                [HEX_B]: [{ owner: 'blue', value: 0 }], // contrived
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A, options: ['push'] },
        });
        const next = applyPush(state, 1);
        expect(next.dice[HEX_B][0].value).toBe(1);
    });

    it('destroys last formation pushed off the map and scores points', () => {
        // HEX_EDGE = '4,0,-4' is on the board; pushing in direction q+1,r+0,s-1 sends it to '5,0,-5' (off-board)
        // HEX_PRE_EDGE = '3,0,-3' is the approach hex (one step before the edge)
        const HEX_EDGE = '4,0,-4';
        const HEX_PRE_EDGE = '3,0,-3';
        const state = makeState({
            dice: {
                [HEX_PRE_EDGE]: [{ owner: 'red', value: 5 }],
                [HEX_EDGE]: [{ owner: 'blue', value: 2 }],
            },
            combat: { attackerHex: HEX_PRE_EDGE, defenderHex: HEX_EDGE, approachDirection: HEX_PRE_EDGE, options: ['push'] },
        });
        const next = applyPush(state, 3);
        expect(next.dice[HEX_PRE_EDGE]).toBeUndefined(); // attacker left
        expect(next.dice[HEX_EDGE][0].owner).toBe('red'); // attacker moved here
        expect(next.scores.red).toBe(1);  // scored 1 for the destroyed enemy die
    });

    it('destroys last formation when encircled by own unit', () => {
        // A(red)→B(blue)  C(red) is already there — encirclement
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
                [HEX_C]: [{ owner: 'red', value: 2 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A, options: ['push'] },
        });
        const next = applyPush(state, 3);
        expect(next.dice[HEX_A]).toBeUndefined(); // attacker left
        expect(next.dice[HEX_B][0].owner).toBe('red'); // attacker moved here, defender destroyed
        expect(next.scores.red).toBe(1);
    });

    it('clears combat state and returns to action phase', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A, options: ['push'] },
        });
        const next = applyPush(state, 3);
        expect(next.combat).toBeNull();
        expect(next.phase).toBe('action');
    });

    it('pushes chain of two defenders, both survive into free space', () => {
        // A(red)→B(blue)→C(blue), D is empty → B→C, C→D
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
                [HEX_C]: [{ owner: 'blue', value: 2 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, approachDirection: HEX_A, options: ['push'] },
        });
        const next = applyPush(state, 2);
        expect(next.dice[HEX_A]).toBeUndefined(); // attacker left
        expect(next.dice[HEX_B][0].owner).toBe('red'); // attacker moved here
        expect(next.dice[HEX_C]).toBeDefined(); // B moved here
        expect(next.dice[HEX_D]).toBeDefined(); // C moved here
        expect(next.scores.red).toBe(0); // no destruction
    });
});

// ---------------------------------------------------------------------------
// applyOccupy
// ---------------------------------------------------------------------------

describe('applyOccupy', () => {
    it('places attacker die on top of defender stack', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: ['push', 'occupy'] },
        });
        const next = applyOccupy(state);
        // Attacker hex should be empty (die moved)
        expect(next.dice[HEX_A]).toBeUndefined();
        // Defender hex should have 2 dice: blue on bottom, red on top
        expect(next.dice[HEX_B]).toHaveLength(2);
        expect(next.dice[HEX_B][0].owner).toBe('blue');
        expect(next.dice[HEX_B][1].owner).toBe('red');
    });

    it('decreases attacker die value by 1', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: ['push', 'occupy'] },
        });
        const next = applyOccupy(state);
        expect(next.dice[HEX_B][1].value).toBe(4); // 5 - 1
    });

    it('does not decrease attacker below value 1', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 1 }],
                [HEX_B]: [{ owner: 'blue', value: 0 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: ['push', 'occupy'] },
        });
        const next = applyOccupy(state);
        expect(next.dice[HEX_B][1].value).toBe(1);
    });

    it('does not reroll defender die', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: ['push', 'occupy'] },
        });
        const next = applyOccupy(state);
        expect(next.dice[HEX_B][0].value).toBe(3); // blue die unchanged
    });

    it('clears combat state and returns to action phase', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: ['push', 'occupy'] },
        });
        const next = applyOccupy(state);
        expect(next.combat).toBeNull();
        expect(next.phase).toBe('action');
    });

    it('does not modify scores', () => {
        const state = makeState({
            dice: {
                [HEX_A]: [{ owner: 'red', value: 5 }],
                [HEX_B]: [{ owner: 'blue', value: 3 }],
            },
            combat: { attackerHex: HEX_A, defenderHex: HEX_B, options: ['push', 'occupy'] },
        });
        const next = applyOccupy(state);
        expect(next.scores.red).toBe(0);
        expect(next.scores.blue).toBe(0);
    });
});
