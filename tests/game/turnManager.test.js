import { describe, it, expect } from 'vitest';
import { advancePhase, endTurn, hasLegalMoves, VICTORY_POINTS } from '../../src/game/turnManager.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CENTER_KEY = '0,0,0';
const LEFT_KEY   = '-2,0,2';

function makeState(overrides = {}) {
    return {
        players: ['red', 'blue'],
        currentPlayer: 'red',
        phase: 'focal',
        dice: {},
        focalPoints: {
            [LEFT_KEY]:   { isActive: false, group: 'main' },
            [CENTER_KEY]: { isActive: true,  group: 'main' },
        },
        scores: { red: 0, blue: 0 },
        activeFocalHolders: { red: null, blue: null },
        combat: null,
        selectedHex: null,
        highlightedHexes: [],
        actionTaken: false,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// advancePhase — focal → action
// ---------------------------------------------------------------------------

describe('advancePhase — focal → action', () => {
    it('changes phase from focal to action', () => {
        const state = makeState({ phase: 'focal' });
        expect(advancePhase(state).phase).toBe('action');
    });

    it('preserves currentPlayer', () => {
        const state = makeState({ phase: 'focal' });
        expect(advancePhase(state).currentPlayer).toBe('red');
    });
});

// ---------------------------------------------------------------------------
// advancePhase — action → combat
// ---------------------------------------------------------------------------

describe('advancePhase — action → combat', () => {
    it('transitions to combat when state.combat is set', () => {
        const state = makeState({
            phase: 'action',
            combat: { attackerHex: CENTER_KEY, defenderHex: LEFT_KEY, options: ['push', 'occupy'] },
        });
        expect(advancePhase(state).phase).toBe('combat');
    });

    it('keeps the combat state object intact', () => {
        const combat = { attackerHex: CENTER_KEY, defenderHex: LEFT_KEY, options: ['push'] };
        const state = makeState({ phase: 'action', combat });
        expect(advancePhase(state).combat).toEqual(combat);
    });
});

// ---------------------------------------------------------------------------
// advancePhase — action → victory
// ---------------------------------------------------------------------------

describe('advancePhase — action → victory', () => {
    it('transitions to victory when current player has enough points and no combat', () => {
        const state = makeState({
            phase: 'action',
            scores: { red: VICTORY_POINTS, blue: 0 },
        });
        expect(advancePhase(state).phase).toBe('victory');
    });

    it('does not transition to victory with fewer than VICTORY_POINTS', () => {
        const state = makeState({
            phase: 'action',
            scores: { red: VICTORY_POINTS - 1, blue: 0 },
        });
        expect(advancePhase(state).phase).not.toBe('victory');
    });

    it('combat takes priority over victory check', () => {
        const state = makeState({
            phase: 'action',
            scores: { red: VICTORY_POINTS, blue: 0 },
            combat: { attackerHex: CENTER_KEY, defenderHex: LEFT_KEY, options: ['push'] },
        });
        expect(advancePhase(state).phase).toBe('combat');
    });
});

// ---------------------------------------------------------------------------
// advancePhase — action → endTurn (normal)
// ---------------------------------------------------------------------------

describe('advancePhase — action → end of turn', () => {
    it('advances to the next player when no combat and no victory', () => {
        const state = makeState({ phase: 'action', scores: { red: 0, blue: 0 } });
        const next = advancePhase(state);
        expect(next.currentPlayer).toBe('blue');
        expect(next.phase).toBe('focal');
    });

    it('resets actionTaken', () => {
        const state = makeState({ phase: 'action', actionTaken: true });
        expect(advancePhase(state).actionTaken).toBe(false);
    });

    it('clears selectedHex and highlightedHexes', () => {
        const state = makeState({
            phase: 'action',
            selectedHex: CENTER_KEY,
            highlightedHexes: [LEFT_KEY],
        });
        const next = advancePhase(state);
        expect(next.selectedHex).toBeNull();
        expect(next.highlightedHexes).toEqual([]);
    });

    it('wraps player order back to the first player', () => {
        const state = makeState({ phase: 'action', currentPlayer: 'blue' });
        expect(advancePhase(state).currentPlayer).toBe('red');
    });
});

// ---------------------------------------------------------------------------
// advancePhase — combat → victory
// ---------------------------------------------------------------------------

describe('advancePhase — combat → victory', () => {
    it('transitions to victory when current player reached VICTORY_POINTS', () => {
        const state = makeState({
            phase: 'combat',
            scores: { red: VICTORY_POINTS, blue: 0 },
        });
        expect(advancePhase(state).phase).toBe('victory');
    });

    it('transitions to next turn when score is below threshold', () => {
        const state = makeState({
            phase: 'combat',
            scores: { red: VICTORY_POINTS - 1, blue: 0 },
        });
        const next = advancePhase(state);
        expect(next.currentPlayer).toBe('blue');
        expect(next.phase).toBe('focal');
    });
});

// ---------------------------------------------------------------------------
// advancePhase — victory (no-op)
// ---------------------------------------------------------------------------

describe('advancePhase — victory no-op', () => {
    it('returns state unchanged when already in victory phase', () => {
        const state = makeState({ phase: 'victory', scores: { red: VICTORY_POINTS, blue: 0 } });
        expect(advancePhase(state)).toBe(state);
    });
});

// ---------------------------------------------------------------------------
// endTurn
// ---------------------------------------------------------------------------

describe('endTurn', () => {
    it('advances to the next player', () => {
        const state = makeState();
        expect(endTurn(state).currentPlayer).toBe('blue');
    });

    it('wraps player order', () => {
        const state = makeState({ currentPlayer: 'blue' });
        expect(endTurn(state).currentPlayer).toBe('red');
    });

    it('sets phase to focal', () => {
        const state = makeState({ phase: 'action' });
        expect(endTurn(state).phase).toBe('focal');
    });

    it('resets actionTaken to false', () => {
        const state = makeState({ actionTaken: true });
        expect(endTurn(state).actionTaken).toBe(false);
    });

    it('clears combat', () => {
        const state = makeState({
            combat: { attackerHex: CENTER_KEY, defenderHex: LEFT_KEY, options: ['push'] },
        });
        expect(endTurn(state).combat).toBeNull();
    });

    it('clears selectedHex and highlightedHexes', () => {
        const state = makeState({ selectedHex: CENTER_KEY, highlightedHexes: [LEFT_KEY] });
        const next = endTurn(state);
        expect(next.selectedHex).toBeNull();
        expect(next.highlightedHexes).toEqual([]);
    });

    it('snapshots focal holders — records player on active focal point', () => {
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 3 }] },
        });
        const next = endTurn(state);
        expect(next.activeFocalHolders.red).toBe(CENTER_KEY);
    });

    it('snapshots focal holders — clears holder when die is not on active focal point', () => {
        const state = makeState({
            dice: { [LEFT_KEY]: [{ owner: 'red', value: 3 }] },
        });
        const next = endTurn(state);
        expect(next.activeFocalHolders.red).toBeNull();
    });

    it('does not mutate the input state', () => {
        const state = makeState({ actionTaken: true });
        endTurn(state);
        expect(state.actionTaken).toBe(true);
        expect(state.currentPlayer).toBe('red');
    });
});

// ---------------------------------------------------------------------------
// hasLegalMoves
// ---------------------------------------------------------------------------

describe('hasLegalMoves', () => {
    it('returns false when current player has no dice on board', () => {
        const state = makeState({ dice: {} });
        expect(hasLegalMoves(state)).toBe(false);
    });

    it('returns true when current player has a standalone die', () => {
        const state = makeState({
            dice: { [CENTER_KEY]: [{ owner: 'red', value: 3 }] },
        });
        expect(hasLegalMoves(state)).toBe(true);
    });

    it('returns true when current player controls the top of a tower', () => {
        const state = makeState({
            dice: {
                [CENTER_KEY]: [
                    { owner: 'blue', value: 2 },
                    { owner: 'red', value: 4 },
                ],
            },
        });
        expect(hasLegalMoves(state)).toBe(true);
    });

    it('returns false when current player is only at the bottom of mixed towers', () => {
        // red is buried under blue — red controls nothing
        const state = makeState({
            dice: {
                [CENTER_KEY]: [
                    { owner: 'red', value: 2 },
                    { owner: 'blue', value: 4 },
                ],
            },
        });
        expect(hasLegalMoves(state)).toBe(false);
    });

    it('returns true for the second player when they have a die', () => {
        const state = makeState({
            currentPlayer: 'blue',
            dice: { [LEFT_KEY]: [{ owner: 'blue', value: 3 }] },
        });
        expect(hasLegalMoves(state)).toBe(true);
    });

    it('ignores empty stacks', () => {
        const state = makeState({ dice: { [CENTER_KEY]: [] } });
        expect(hasLegalMoves(state)).toBe(false);
    });
});
