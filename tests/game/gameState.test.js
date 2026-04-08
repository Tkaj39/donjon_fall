import { describe, it, expect } from 'vitest';
import {
    getDiceAt,
    getTopDie,
    getController,
    getTowerSize,
    getAttackStrength,
    canEnterTower,
    isFocalPointActive,
    getActiveFocalPoints,
    createInitialState,
} from '../../src/game/gameState';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState({ dice = {}, focalPoints = {} } = {}) {
    return {
        players: ['red', 'blue'],
        currentPlayer: 'red',
        phase: 'action',
        dice,
        focalPoints,
        scores: { red: 0, blue: 0 },
        activeFocalHolders: { red: null, blue: null },
        combat: null,
        actionTaken: false,
    };
}

const A = '0,0,0';   // centre hex used as a generic position
const B = '1,-1,0';  // adjacent hex

// ---------------------------------------------------------------------------
// getDiceAt
// ---------------------------------------------------------------------------

describe('getDiceAt', () => {
    it('returns empty array for an empty hex', () => {
        const state = makeState();
        expect(getDiceAt(state, A)).toEqual([]);
    });

    it('returns the dice stack for an occupied hex', () => {
        const stack = [{ owner: 'red', value: 3 }];
        const state = makeState({ dice: { [A]: stack } });
        expect(getDiceAt(state, A)).toBe(stack);
    });
});

// ---------------------------------------------------------------------------
// getTopDie
// ---------------------------------------------------------------------------

describe('getTopDie', () => {
    it('returns null for an empty hex', () => {
        expect(getTopDie(makeState(), A)).toBeNull();
    });

    it('returns the single die on a solo hex', () => {
        const die = { owner: 'red', value: 4 };
        const state = makeState({ dice: { [A]: [die] } });
        expect(getTopDie(state, A)).toBe(die);
    });

    it('returns the last die in the stack (top)', () => {
        const bottom = { owner: 'red', value: 2 };
        const top    = { owner: 'blue', value: 5 };
        const state  = makeState({ dice: { [A]: [bottom, top] } });
        expect(getTopDie(state, A)).toBe(top);
    });
});

// ---------------------------------------------------------------------------
// getController
// ---------------------------------------------------------------------------

describe('getController', () => {
    it('returns null for an empty hex', () => {
        expect(getController(makeState(), A)).toBeNull();
    });

    it('returns the owner of the top die', () => {
        const state = makeState({ dice: { [A]: [
            { owner: 'red', value: 2 },
            { owner: 'blue', value: 5 },
        ]}});
        expect(getController(state, A)).toBe('blue');
    });
});

// ---------------------------------------------------------------------------
// getTowerSize
// ---------------------------------------------------------------------------

describe('getTowerSize', () => {
    it('returns 0 for an empty hex', () => {
        expect(getTowerSize(makeState(), A)).toBe(0);
    });

    it('returns 1 for a lone die', () => {
        const state = makeState({ dice: { [A]: [{ owner: 'red', value: 3 }] } });
        expect(getTowerSize(state, A)).toBe(1);
    });

    it('returns the full stack size', () => {
        const state = makeState({ dice: { [A]: [
            { owner: 'red',  value: 2 },
            { owner: 'blue', value: 4 },
            { owner: 'red',  value: 6 },
        ]}});
        expect(getTowerSize(state, A)).toBe(3);
    });
});

// ---------------------------------------------------------------------------
// getAttackStrength
// ---------------------------------------------------------------------------

describe('getAttackStrength', () => {
    it('returns 0 for an empty hex', () => {
        expect(getAttackStrength(makeState(), A)).toBe(0);
    });

    it('lone die: strength equals its value (1 own, 0 enemy)', () => {
        const state = makeState({ dice: { [A]: [{ owner: 'red', value: 4 }] } });
        // 4 + 1 - 0 = 5
        expect(getAttackStrength(state, A)).toBe(5);
    });

    it('friendly tower: adds own dice bonus', () => {
        // red has 2 dice on top → 3 + 2 - 0 = 5
        const state = makeState({ dice: { [A]: [
            { owner: 'red', value: 2 },
            { owner: 'red', value: 3 },
        ]}});
        expect(getAttackStrength(state, A)).toBe(5);
    });

    it('mixed tower: subtracts enemy dice', () => {
        // top is red(5), stack: [blue(2), red(5)]  → 5 + 1 - 1 = 5
        const state = makeState({ dice: { [A]: [
            { owner: 'blue', value: 2 },
            { owner: 'red',  value: 5 },
        ]}});
        expect(getAttackStrength(state, A)).toBe(5);
    });

    it('mixed tower with more enemies: can produce a lower value', () => {
        // top is red(4), stack: [blue(3), blue(2), red(4)] → 4 + 1 - 2 = 3
        const state = makeState({ dice: { [A]: [
            { owner: 'blue', value: 3 },
            { owner: 'blue', value: 2 },
            { owner: 'red',  value: 4 },
        ]}});
        expect(getAttackStrength(state, A)).toBe(3);
    });

    it('with jumped option: solo die returns only its face value', () => {
        const state = makeState({ dice: { [A]: [{ owner: 'red', value: 4 }] } });
        // Without jumped: 4 + 1 - 0 = 5, with jumped: just 4
        expect(getAttackStrength(state, A, { jumped: true })).toBe(4);
    });

    it('with jumped option: mixed tower returns only top die face value, ignoring tower bonus', () => {
        // top is red(5), stack: [blue(2), red(3), red(5)]
        // Without jumped: 5 + 2 - 1 = 6, with jumped: just 5
        const state = makeState({ dice: { [A]: [
            { owner: 'blue', value: 2 },
            { owner: 'red',  value: 3 },
            { owner: 'red',  value: 5 },
        ]}});
        expect(getAttackStrength(state, A, { jumped: true })).toBe(5);
    });
});

// ---------------------------------------------------------------------------
// canEnterTower
// ---------------------------------------------------------------------------

describe('canEnterTower', () => {
    it('always returns true for an empty target hex', () => {
        const mover = { owner: 'red', value: 1 };
        expect(canEnterTower(makeState(), mover, A)).toBe(true);
    });

    it('friendly tower: mover can enter if its strength exceeds the top die strength', () => {
        // target has red(3) alone → strength 3+1-0=4
        // mover red(5): after joining → 5 + 2 - 0 = 7 > 4 ✓
        const state = makeState({ dice: { [A]: [{ owner: 'red', value: 3 }] } });
        expect(canEnterTower(state, { owner: 'red', value: 5 }, A)).toBe(true);
    });

    it('friendly tower: mover cannot enter if its strength does not exceed the top die strength', () => {
        // target has red(5) alone → strength 5+1-0=6
        // mover red(2): after joining → 2 + 2 - 0 = 4  not > 6 ✗
        const state = makeState({ dice: { [A]: [{ owner: 'red', value: 5 }] } });
        expect(canEnterTower(state, { owner: 'red', value: 2 }, A)).toBe(false);
    });

    it('equal-value own dice cannot stack (bug-fix: equal value must be blocked)', () => {
        // target has red(3) alone → topStrength = 3+1-0 = 4
        // mover red(3): solo strength = 3+1 = 4  →  4 > 4 ✗  (not strictly greater)
        const state = makeState({ dice: { [A]: [{ owner: 'red', value: 3 }] } });
        expect(canEnterTower(state, { owner: 'red', value: 3 }, A)).toBe(false);
    });

    it('higher-value own die can stack onto lower-value own die', () => {
        // target has red(3) alone → topStrength = 3+1-0 = 4
        // mover red(4): solo strength = 4+1 = 5  →  5 > 4 ✓
        const state = makeState({ dice: { [A]: [{ owner: 'red', value: 3 }] } });
        expect(canEnterTower(state, { owner: 'red', value: 4 }, A)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// isFocalPointActive
// ---------------------------------------------------------------------------

describe('isFocalPointActive', () => {
    it('returns false for a hex that is not a focal point', () => {
        expect(isFocalPointActive(makeState(), A)).toBe(false);
    });

    it('returns true for an active focal point', () => {
        const state = makeState({ focalPoints: { [A]: { isActive: true, group: 'center' } } });
        expect(isFocalPointActive(state, A)).toBe(true);
    });

    it('returns false for a passive focal point', () => {
        const state = makeState({ focalPoints: { [A]: { isActive: false, group: 'left' } } });
        expect(isFocalPointActive(state, A)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// getActiveFocalPoints
// ---------------------------------------------------------------------------

describe('getActiveFocalPoints', () => {
    it('returns empty array when there are no focal points', () => {
        expect(getActiveFocalPoints(makeState())).toEqual([]);
    });

    it('returns only the active focal point keys', () => {
        const state = makeState({ focalPoints: {
            [A]: { isActive: true,  group: 'center' },
            [B]: { isActive: false, group: 'left'   },
        }});
        expect(getActiveFocalPoints(state)).toEqual([A]);
    });

    it('returns all keys when every focal point is active', () => {
        const state = makeState({ focalPoints: {
            [A]: { isActive: true, group: 'center' },
            [B]: { isActive: true, group: 'left'   },
        }});
        expect(getActiveFocalPoints(state).sort()).toEqual([A, B].sort());
    });
});

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

describe('createInitialState', () => {
    it('returns a copy of the players array, not the same reference', () => {
        const players = ['red', 'blue'];
        const state = createInitialState(players, []);
        expect(state.players).toEqual(players);
        expect(state.players).not.toBe(players);
    });

    it('sets currentPlayer to the first player in the list', () => {
        const state = createInitialState(['red', 'blue'], []);
        expect(state.currentPlayer).toBe('red');
    });

    it('sets phase to focal', () => {
        const state = createInitialState(['red', 'blue'], []);
        expect(state.phase).toBe('focal');
    });

    it('sets actionTaken to false', () => {
        const state = createInitialState(['red', 'blue'], []);
        expect(state.actionTaken).toBe(false);
    });

    it('sets combat to null', () => {
        const state = createInitialState(['red', 'blue'], []);
        expect(state.combat).toBeNull();
    });

    it('places one die per startingField hex with the correct owner and value 3', () => {
        const boardFields = [
            { coords: { q: 0, r: 0, s: 0 }, properties: [{ type: 'startingField', owner: 'red' }] },
            { coords: { q: 1, r: -1, s: 0 }, properties: [{ type: 'startingField', owner: 'blue' }] },
            { coords: { q: 2, r: -2, s: 0 }, properties: [] }, // no starting field
        ];
        const state = createInitialState(['red', 'blue'], boardFields);
        
        expect(state.dice['0,0,0']).toEqual([{ owner: 'red', value: 6 }]);
        expect(state.dice['1,-1,0']).toEqual([{ owner: 'blue', value: 6 }]);
        expect(state.dice['2,-2,0']).toBeUndefined();
    });

    it('ignores startingField hexes whose owner is not in the players list', () => {
        const boardFields = [
            { coords: { q: 0, r: 0, s: 0 }, properties: [{ type: 'startingField', owner: 'red' }] },
            { coords: { q: 1, r: -1, s: 0 }, properties: [{ type: 'startingField', owner: 'green' }] },
        ];
        const state = createInitialState(['red', 'blue'], boardFields);
        
        expect(state.dice['0,0,0']).toEqual([{ owner: 'red', value: 6 }]);
        expect(state.dice['1,-1,0']).toBeUndefined();
    });

    it('builds focalPoints map correctly with active and passive focal points', () => {
        const boardFields = [
            { coords: { q: 0, r: 0, s: 0 }, properties: [{ type: 'focalPoint', active: true, group: 'center' }] },
            { coords: { q: 1, r: -1, s: 0 }, properties: [{ type: 'focalPoint', active: false, group: 'left' }] },
        ];
        const state = createInitialState(['red', 'blue'], boardFields);
        
        expect(state.focalPoints['0,0,0']).toEqual({ isActive: true, group: 'center' });
        expect(state.focalPoints['1,-1,0']).toEqual({ isActive: false, group: 'left' });
    });

    it('initialises all player scores to 0', () => {
        const state = createInitialState(['red', 'blue'], []);
        expect(state.scores).toEqual({ red: 0, blue: 0 });
    });

    it('initialises all activeFocalHolders to null', () => {
        const state = createInitialState(['red', 'blue'], []);
        expect(state.activeFocalHolders).toEqual({ red: null, blue: null });
    });

    it('produces an empty dice object when no startingField hexes are present', () => {
        const boardFields = [
            { coords: { q: 0, r: 0, s: 0 }, properties: [] },
        ];
        const state = createInitialState(['red', 'blue'], boardFields);
        expect(state.dice).toEqual({});
    });

    it('produces an empty focalPoints object when no focalPoint hexes are present', () => {
        const boardFields = [
            { coords: { q: 0, r: 0, s: 0 }, properties: [{ type: 'startingField', owner: 'red' }] },
        ];
        const state = createInitialState(['red', 'blue'], boardFields);
        expect(state.focalPoints).toEqual({});
    });
});
