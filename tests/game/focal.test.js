import { describe, it, expect } from 'vitest';
import { applyFocalPhase, updateFocalHolders } from '../../src/game/focal.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEFT_KEY   = '-2,0,2';
const CENTER_KEY = '0,0,0';
const RIGHT_KEY  = '2,0,-2';

/**
 * Creates a minimal GameState for testing focal point functions.
 *
 * Default board: center is active, left & right are passive, all in group 'main'.
 */
function makeState({
    dice = {},
    focalPoints = null,
    scores = { red: 0, blue: 0 },
    activeFocalHolders = { red: null, blue: null },
    currentPlayer = 'red',
    phase = 'focal',
} = {}) {
    return {
        players: ['red', 'blue'],
        currentPlayer,
        phase,
        dice,
        focalPoints: focalPoints ?? {
            [LEFT_KEY]:   { isActive: false, group: 'main' },
            [CENTER_KEY]: { isActive: true,  group: 'main' },
            [RIGHT_KEY]:  { isActive: false, group: 'main' },
        },
        scores,
        activeFocalHolders,
        combat: null,
        actionTaken: false,
    };
}

// ---------------------------------------------------------------------------
// applyFocalPhase — no held focal point
// ---------------------------------------------------------------------------

describe('applyFocalPhase — no held focal point', () => {
    it('returns state unchanged when player held no focal point', () => {
        const state = makeState({ activeFocalHolders: { red: null, blue: null } });
        const next = applyFocalPhase(state, 3, 2);
        expect(next.scores.red).toBe(0);
        expect(next.focalPoints).toEqual(state.focalPoints);
        expect(next.dice).toEqual(state.dice);
    });
});

// ---------------------------------------------------------------------------
// applyFocalPhase — scoring
// ---------------------------------------------------------------------------

describe('applyFocalPhase — scoring', () => {
    it('awards 1 VP to the current player', () => {
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: CENTER_KEY, blue: null },
        });
        const next = applyFocalPhase(state, 3, 2);
        expect(next.scores.red).toBe(1);
        expect(next.scores.blue).toBe(0);
    });

    it('accumulates VP on top of existing score', () => {
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 4 }] },
            scores: { red: 3, blue: 1 },
            activeFocalHolders: { red: CENTER_KEY, blue: null },
        });
        const next = applyFocalPhase(state, 2, 2);
        expect(next.scores.red).toBe(4);
    });
});

// ---------------------------------------------------------------------------
// applyFocalPhase — die reroll
// ---------------------------------------------------------------------------

describe('applyFocalPhase — die reroll', () => {
    it('decreases die by min(dieNewValue, original − 1)', () => {
        // original = 4, dieNewValue = 2 → min(2, 3) = 2
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: CENTER_KEY, blue: null },
        });
        const next = applyFocalPhase(state, 2, 2);
        expect(next.dice[CENTER_KEY][0].value).toBe(2);
    });

    it('uses original − 1 when dieNewValue would be higher', () => {
        // original = 4, dieNewValue = 5 → min(5, 3) = 3
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: CENTER_KEY, blue: null },
        });
        const next = applyFocalPhase(state, 5, 2);
        expect(next.dice[CENTER_KEY][0].value).toBe(3);
    });

    it('clamps die to minimum 1 even if original is 1', () => {
        // original = 1, dieNewValue = 1 → max(1, min(1, 0)) = max(1, 0) = 1
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 1 }] },
            activeFocalHolders: { red: CENTER_KEY, blue: null },
        });
        const next = applyFocalPhase(state, 1, 2);
        expect(next.dice[CENTER_KEY][0].value).toBe(1);
    });

    it('only rerolls the top die in a tower', () => {
        // Tower: bottom red 3, top red 4 — only top die changes
        const state = makeState({
            dice: {
                [CENTER_KEY]: [
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 4 },
                ],
            },
            activeFocalHolders: { red: CENTER_KEY, blue: null },
        });
        const next = applyFocalPhase(state, 2, 2);
        expect(next.dice[CENTER_KEY][0].value).toBe(3); // bottom unchanged
        expect(next.dice[CENTER_KEY][1].value).toBe(2); // top decreased
    });
});

// ---------------------------------------------------------------------------
// applyFocalPhase — focal point activation (even = left, odd = right)
// ---------------------------------------------------------------------------

describe('applyFocalPhase — focal point activation', () => {
    function stateWithRedOnCenter() {
        return makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: CENTER_KEY, blue: null },
        });
    }

    it('deactivates the scored focal point', () => {
        const next = applyFocalPhase(stateWithRedOnCenter(), 3, 2);
        expect(next.focalPoints[CENTER_KEY].isActive).toBe(false);
    });

    it('activates left focal point on even extraDieRoll', () => {
        // passive sorted: [LEFT_KEY, RIGHT_KEY]; even roll (2) → 2 % 2 = 0 → LEFT_KEY
        const next = applyFocalPhase(stateWithRedOnCenter(), 3, 2);
        expect(next.focalPoints[LEFT_KEY].isActive).toBe(true);
        expect(next.focalPoints[RIGHT_KEY].isActive).toBe(false);
    });

    it('activates right focal point on odd extraDieRoll', () => {
        // passive sorted: [LEFT_KEY, RIGHT_KEY]; odd roll (1) → 1 % 2 = 1 → RIGHT_KEY
        const next = applyFocalPhase(stateWithRedOnCenter(), 3, 1);
        expect(next.focalPoints[RIGHT_KEY].isActive).toBe(true);
        expect(next.focalPoints[LEFT_KEY].isActive).toBe(false);
    });

    it('activates left for all even rolls (2, 4, 6)', () => {
        for (const roll of [2, 4, 6]) {
            const next = applyFocalPhase(stateWithRedOnCenter(), 3, roll);
            expect(next.focalPoints[LEFT_KEY].isActive).toBe(true);
        }
    });

    it('activates right for all odd rolls (1, 3, 5)', () => {
        for (const roll of [1, 3, 5]) {
            const next = applyFocalPhase(stateWithRedOnCenter(), 3, roll);
            expect(next.focalPoints[RIGHT_KEY].isActive).toBe(true);
        }
    });

    it('does not activate anything when no passive hexes remain in the group', () => {
        // Custom state: only one focal point — no passive siblings
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 4 }] },
            focalPoints: {
                [CENTER_KEY]: { isActive: true, group: 'solo' },
            },
            activeFocalHolders: { red: CENTER_KEY, blue: null },
        });
        const next = applyFocalPhase(state, 3, 2);
        expect(next.focalPoints[CENTER_KEY].isActive).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// applyFocalPhase — immutability
// ---------------------------------------------------------------------------

describe('applyFocalPhase — immutability', () => {
    it('does not mutate the input state', () => {
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: CENTER_KEY, blue: null },
        });
        const scoresBefore = { ...state.scores };
        applyFocalPhase(state, 3, 2);
        expect(state.scores).toEqual(scoresBefore);
        expect(state.focalPoints[CENTER_KEY].isActive).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// updateFocalHolders
// ---------------------------------------------------------------------------

describe('updateFocalHolders', () => {
    it('sets null for all players when board is empty', () => {
        const state = makeState();
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders).toEqual({ red: null, blue: null });
    });

    it('records hex when player controls an active focal point', () => {
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 3 }] },
        });
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders.red).toBe(CENTER_KEY);
        expect(next.activeFocalHolders.blue).toBe(null);
    });

    it('does not record a passive focal point', () => {
        const state = makeState({
            dice: { [LEFT_KEY]: [{ owner: 'red', value: 3 }] },
        });
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders.red).toBe(null);
    });

    it('records correct player when blue controls the active focal point', () => {
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'blue', value: 5 }] },
        });
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders.blue).toBe(CENTER_KEY);
        expect(next.activeFocalHolders.red).toBe(null);
    });

    it('records the tower controller (top die) for an active focal point', () => {
        // Mixed tower: red at bottom, blue on top — blue controls
        const state = makeState({
            dice: {
                [CENTER_KEY]: [
                    { owner: 'red', value: 2 },
                    { owner: 'blue', value: 4 },
                ],
            },
        });
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders.blue).toBe(CENTER_KEY);
        expect(next.activeFocalHolders.red).toBe(null);
    });

    it('does not mutate the input state', () => {
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 3 }] },
        });
        updateFocalHolders(state);
        expect(state.activeFocalHolders.red).toBe(null);
    });
});
