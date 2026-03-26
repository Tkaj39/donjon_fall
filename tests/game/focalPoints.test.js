/**
 * Tests for focal point logic — Phase 6.1 (applyFocalPhase) and
 * Phase 6.2 (updateFocalHolders).
 */

import { applyFocalPhase, updateFocalHolders } from '../../src/game/focalPoints.js';

// ---------------------------------------------------------------------------
// Hex key constants
// ---------------------------------------------------------------------------

/** Left focal point hex. */
const FOCAL_LEFT   = '-2,0,2';

/** Center focal point hex (active at game start). */
const FOCAL_CENTER = '0,0,0';

/** Right focal point hex. */
const FOCAL_RIGHT  = '2,0,-2';

/** A non-focal hex used for regular die placement. */
const OTHER_HEX    = '1,-1,0';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal GameState for testing focal point logic.
 *
 * @param {Object} overrides
 * @param {Object.<string,Array>}  [overrides.dice]               - dice map
 * @param {Object.<string,Object>} [overrides.focalPoints]        - focalPoints map
 * @param {Object.<string,number>} [overrides.scores]             - scores map
 * @param {Object.<string,string|null>} [overrides.activeFocalHolders] - focal holders map
 * @param {string}                 [overrides.currentPlayer]      - active player ID
 * @param {string}                 [overrides.phase]              - current phase
 * @returns {import('../../src/game/gameState.js').GameState}
 */
function makeState({
    dice = {},
    focalPoints = {
        [FOCAL_LEFT]:   { isActive: false, group: 'main' },
        [FOCAL_CENTER]: { isActive: true,  group: 'main' },
        [FOCAL_RIGHT]:  { isActive: false, group: 'main' },
    },
    scores = { red: 0, blue: 0 },
    activeFocalHolders = { red: null, blue: null },
    currentPlayer = 'red',
    phase = 'focal',
} = {}) {
    return {
        players:            ['red', 'blue'],
        currentPlayer,
        phase,
        dice,
        focalPoints,
        scores,
        activeFocalHolders,
        combat:             null,
        selectedHex:        null,
        highlightedHexes:   [],
        actionTaken:        false,
    };
}

// ---------------------------------------------------------------------------
// applyFocalPhase — Phase 6.1
// ---------------------------------------------------------------------------

describe('applyFocalPhase', () => {
    test('transitions phase to action when no focal point was held', () => {
        const state = makeState();
        const next = applyFocalPhase(state, 3, 2);
        expect(next.phase).toBe('action');
    });

    test('does not award points when no focal point was held', () => {
        const state = makeState();
        const next = applyFocalPhase(state, 3, 2);
        expect(next.scores.red).toBe(0);
    });

    test('transitions phase to action when held hex is no longer active', () => {
        const state = makeState({
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
            focalPoints: {
                [FOCAL_LEFT]:   { isActive: false, group: 'main' },
                [FOCAL_CENTER]: { isActive: false, group: 'main' }, // deactivated
                [FOCAL_RIGHT]:  { isActive: false, group: 'main' },
            },
        });
        const next = applyFocalPhase(state, 3, 2);
        expect(next.phase).toBe('action');
        expect(next.scores.red).toBe(0);
    });

    test('awards 1 point when an active focal point was held', () => {
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const next = applyFocalPhase(state, 3, 2);
        expect(next.scores.red).toBe(1);
    });

    test('does not alter opponent score', () => {
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const next = applyFocalPhase(state, 3, 2);
        expect(next.scores.blue).toBe(0);
    });

    test('rerolls top die using min(dieRoll, original - 1)', () => {
        // original = 5, dieRoll = 3 → new value = min(3, 4) = 3
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 5 }] },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const next = applyFocalPhase(state, 3, 2);
        expect(next.dice[FOCAL_CENTER][0].value).toBe(3);
    });

    test('caps reroll at original - 1 when dieRoll is high', () => {
        // original = 4, dieRoll = 6 → capped at 3
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const next = applyFocalPhase(state, 6, 2);
        expect(next.dice[FOCAL_CENTER][0].value).toBe(3);
    });

    test('floors die value at 1 when original is already 1', () => {
        // original = 1, dieRoll = anything → max(1, min(dieRoll, 0)) = 1
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 1 }] },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const next = applyFocalPhase(state, 5, 2);
        expect(next.dice[FOCAL_CENTER][0].value).toBe(1);
    });

    test('deactivates the scored focal point', () => {
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const next = applyFocalPhase(state, 3, 2);
        expect(next.focalPoints[FOCAL_CENTER].isActive).toBe(false);
    });

    test('activates left focal when extraDieRoll is even (index 0 of sorted passives)', () => {
        // passives sorted: FOCAL_LEFT ('-2,0,2') < FOCAL_RIGHT ('2,0,-2')
        // even roll (e.g. 2) → index 0 → FOCAL_LEFT
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const next = applyFocalPhase(state, 3, 2); // extraDieRoll = 2 (even) → index 0
        expect(next.focalPoints[FOCAL_LEFT].isActive).toBe(true);
        expect(next.focalPoints[FOCAL_RIGHT].isActive).toBe(false);
    });

    test('activates right focal when extraDieRoll is odd (index 1 of sorted passives)', () => {
        // odd roll (e.g. 1) → index 1 → FOCAL_RIGHT
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const next = applyFocalPhase(state, 3, 1); // extraDieRoll = 1 (odd) → index 1
        expect(next.focalPoints[FOCAL_RIGHT].isActive).toBe(true);
        expect(next.focalPoints[FOCAL_LEFT].isActive).toBe(false);
    });

    test('only rerolls the top die, not dice below in a tower', () => {
        // Tower at center: bottom die (blue) + top die (red, value 5)
        const state = makeState({
            dice: {
                [FOCAL_CENTER]: [
                    { owner: 'blue', value: 3 },
                    { owner: 'red',  value: 5 },
                ],
            },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const next = applyFocalPhase(state, 2, 2);
        expect(next.dice[FOCAL_CENTER][0]).toEqual({ owner: 'blue', value: 3 }); // unchanged
        expect(next.dice[FOCAL_CENTER][1].value).toBe(2); // min(2, 4) = 2
    });

    test('does not mutate the original state', () => {
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 4 }] },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
        });
        const before = JSON.stringify(state);
        applyFocalPhase(state, 3, 2);
        expect(JSON.stringify(state)).toBe(before);
    });
});

// ---------------------------------------------------------------------------
// updateFocalHolders — Phase 6.2
// ---------------------------------------------------------------------------

describe('updateFocalHolders', () => {
    test('records null for all players when no player holds a focal point', () => {
        const state = makeState({
            dice: { [OTHER_HEX]: [{ owner: 'red', value: 3 }] },
        });
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders.red).toBeNull();
        expect(next.activeFocalHolders.blue).toBeNull();
    });

    test('records the active focal hex for the player whose die is there', () => {
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 3 }] },
        });
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders.red).toBe(FOCAL_CENTER);
    });

    test('records null for the player who does not hold any active focal point', () => {
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 3 }] },
        });
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders.blue).toBeNull();
    });

    test('records null when player die is on a passive focal point hex', () => {
        const state = makeState({
            dice: { [FOCAL_LEFT]: [{ owner: 'red', value: 3 }] },
            // FOCAL_LEFT is passive (isActive: false)
        });
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders.red).toBeNull();
    });

    test('records the active focal hex for opponent holding it', () => {
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'blue', value: 3 }] },
        });
        const next = updateFocalHolders(state);
        expect(next.activeFocalHolders.blue).toBe(FOCAL_CENTER);
        expect(next.activeFocalHolders.red).toBeNull();
    });

    test('does not mutate the original state', () => {
        const state = makeState({
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 3 }] },
        });
        const before = JSON.stringify(state);
        updateFocalHolders(state);
        expect(JSON.stringify(state)).toBe(before);
    });
});
