/**
 * Bot scenario tests
 *
 * Specific board positions used to verify bot move generation and MCTS output.
 */

import { describe, it, expect } from 'vitest';
import { generateLegalMoves, getBotMoveAsync } from '../../src/game/bot.js';

// ---------------------------------------------------------------------------
// Helper — minimal valid GameState
// ---------------------------------------------------------------------------

function baseState(overrides = {}) {
    return {
        players: ['red', 'blue'],
        currentPlayer: 'red',
        phase: 'action',
        dice: {},
        focalPoints: {},
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
// Scenario: blue 6 at (-1,4,-3), blue 4 at (0,1,-1), red 6 at (0,0,0)
// ---------------------------------------------------------------------------

const BLUE_6 = '-1,4,-3';
const BLUE_4 = '0,1,-1';
const RED_6  = '0,0,0';

const scenarioState = baseState({
    dice: {
        [BLUE_6]: [{ owner: 'blue', value: 6 }],
        [BLUE_4]: [{ owner: 'blue', value: 4 }],
        [RED_6]:  [{ owner: 'red',  value: 6 }],
    },
});

describe('Bot scenario — blue 6 at (-1,4,-3), blue 4 at (0,1,-1), red 6 at (0,0,0)', () => {
    it('generates legal moves for red', () => {
        const moves = generateLegalMoves(scenarioState);
        expect(moves.length).toBeGreaterThan(0);
        for (const move of moves) {
            expect(['MOVE_DIE', 'MOVE_TOWER', 'JUMP', 'COLLAPSE', 'REROLL']).toContain(move.type);
        }
    });

    it('bot returns a move within 3 seconds', () => new Promise((resolve, reject) => {
        const cancel = getBotMoveAsync(scenarioState, 'red', {
            onMove(move) {
                try {
                    expect(move).not.toBeNull();
                    expect(move.type).toBeDefined();
                    resolve();
                } catch (e) {
                    reject(e);
                }
            },
            timeoutMs: 3000,
        });

        setTimeout(() => { cancel(); reject(new Error('Bot did not respond within 3 s')); }, 4000);
    }));
});