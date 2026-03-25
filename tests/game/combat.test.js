import { describe, it, expect } from 'vitest';
import { canAttack, getAvailableCombatOptions } from '../../src/game/combat.js';

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
