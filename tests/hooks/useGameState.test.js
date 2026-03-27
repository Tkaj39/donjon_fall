import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../../src/hooks/useGameState.js';
import { BOARD_FIELDS } from '../../src/hex/boardConstants.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PLAYERS = ['red', 'blue'];

/** Render the hook once and return its result. */
function setup() {
    return renderHook(() => useGameState(PLAYERS, BOARD_FIELDS));
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

describe('useGameState — initialisation', () => {
    it('returns state with the given players', () => {
        const { result } = setup();
        expect(result.current.state.players).toEqual(PLAYERS);
    });

    it('starts on focal phase', () => {
        const { result } = setup();
        // createInitialState starts at 'focal' phase (first turn)
        expect(result.current.state.phase).toBe('focal');
    });

    it('initial scores are 0 for each player', () => {
        const { result } = setup();
        expect(result.current.state.scores).toEqual({ red: 0, blue: 0 });
    });

    it('each player has 5 dice on the board', () => {
        const { result } = setup();
        const { dice } = result.current.state;
        const allDice = Object.values(dice).flat();
        const redDice = allDice.filter(d => d.owner === 'red');
        const blueDice = allDice.filter(d => d.owner === 'blue');
        expect(redDice).toHaveLength(5);
        expect(blueDice).toHaveLength(5);
    });

    it('exposes a dispatch function', () => {
        const { result } = setup();
        expect(typeof result.current.dispatch).toBe('function');
    });
});

// ---------------------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------------------

describe('useGameState — convenience selectors', () => {
    it('getDiceAt returns dice at an occupied hex', () => {
        const { result } = setup();
        const { state, getDiceAt } = result.current;
        // Find any occupied hex key from initial state
        const occupiedKey = Object.keys(state.dice).find(k => state.dice[k].length > 0);
        expect(getDiceAt(occupiedKey)).toEqual(state.dice[occupiedKey]);
    });

    it('getDiceAt returns empty array for an unoccupied hex', () => {
        const { result } = setup();
        expect(result.current.getDiceAt('0,0,0')).toEqual([]);
    });

    it('getTopDie returns the top die at an occupied hex', () => {
        const { result } = setup();
        const { state, getTopDie } = result.current;
        const occupiedKey = Object.keys(state.dice).find(k => state.dice[k].length > 0);
        const top = getTopDie(occupiedKey);
        const stack = state.dice[occupiedKey];
        expect(top).toEqual(stack[stack.length - 1]);
    });

    it('getController returns the owning player of the top die', () => {
        const { result } = setup();
        const { state, getController } = result.current;
        const redHex = Object.keys(state.dice).find(
            k => state.dice[k].length > 0 && state.dice[k][0].owner === 'red'
        );
        expect(getController(redHex)).toBe('red');
    });

    it('getTowerSize returns 1 for a single die', () => {
        const { result } = setup();
        const { state, getTowerSize } = result.current;
        const singleDieKey = Object.keys(state.dice).find(k => state.dice[k].length === 1);
        expect(getTowerSize(singleDieKey)).toBe(1);
    });

    it('getActiveFocalPoints returns at least one focal point', () => {
        const { result } = setup();
        const active = result.current.getActiveFocalPoints();
        expect(active.length).toBeGreaterThan(0);
    });

    it('isFocalPointActive returns true for an active focal point', () => {
        const { result } = setup();
        const active = result.current.getActiveFocalPoints();
        expect(result.current.isFocalPointActive(active[0])).toBe(true);
    });

    it('hasLegalMoves returns true at game start', () => {
        const { result } = setup();
        expect(result.current.hasLegalMoves()).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Selectors update after dispatch
// ---------------------------------------------------------------------------

describe('useGameState — selectors reflect updated state', () => {
    it('getController reflects new state after END_TURN', () => {
        const { result } = setup();

        act(() => {
            // Skip focal phase (no active focal holders on first turn), then end turn.
            result.current.dispatch({ type: 'CONFIRM_ACTION' }); // focal → action
        });

        act(() => {
            result.current.dispatch({ type: 'END_TURN' });
        });

        // After ending turn, currentPlayer should be blue.
        expect(result.current.state.currentPlayer).toBe('blue');
    });

    it('getDiceAt reflects updated dice after REROLL', () => {
        const { result } = setup();
        const { state } = result.current;

        // Advance to action phase first (hook starts at 'focal')
        act(() => {
            result.current.dispatch({ type: 'CONFIRM_ACTION' });
        });

        // Find a hex with a red die (red is currentPlayer)
        const redHex = Object.keys(state.dice).find(
            k => state.dice[k].length > 0 && state.dice[k][0].owner === 'red'
        );
        const originalValue = state.dice[redHex][0].value;

        // Reroll with a higher value to guarantee the value is kept or increased.
        const higherValue = Math.min(originalValue + 1, 6);
        act(() => {
            result.current.dispatch({ type: 'REROLL', hex: redHex, newValue: higherValue });
        });

        const newDice = result.current.getDiceAt(redHex);
        expect(newDice[0].value).toBe(higherValue);
    });
});

// ---------------------------------------------------------------------------
// dispatch identity
// ---------------------------------------------------------------------------

describe('useGameState — dispatch stability', () => {
    it('dispatch reference is stable across re-renders', () => {
        const { result, rerender } = setup();
        const firstDispatch = result.current.dispatch;
        rerender();
        expect(result.current.dispatch).toBe(firstDispatch);
    });
});
