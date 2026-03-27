import { describe, it, expect } from 'vitest';
import { gameReducer } from '../../src/game/gameReducer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid GameState for unit tests. */
function makeState(overrides = {}) {
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

// Hex keys used across tests.
// A and B are adjacent (cube distance 1).
const A = '0,0,0';
const B = '1,-1,0';
const C = '0,-1,1';        // also adjacent to A
const D = '-1,0,1';        // also adjacent to A, not adjacent to B

const FOCAL_CENTER = '0,0,0'; // same as A — used when testing focal scoring
const FOCAL_LEFT   = '-2,0,2';
const FOCAL_RIGHT  = '2,0,-2';

/** State with red die at A and blue die at B (adjacent — combat possible). */
function makeCombatReady({ redValue = 4, blueValue = 2 } = {}) {
    return makeState({
        phase: 'action',
        dice: {
            [A]: [{ owner: 'red', value: redValue }],
            [B]: [{ owner: 'blue', value: blueValue }],
        },
    });
}

// ---------------------------------------------------------------------------
// Unknown / default action
// ---------------------------------------------------------------------------

describe('gameReducer — unknown action type', () => {
    it('returns state unchanged for an unknown action type', () => {
        const state = makeState();
        const next = gameReducer(state, { type: 'UNKNOWN_ACTION' });
        expect(next).toBe(state);
    });
});

// ---------------------------------------------------------------------------
// ADVANCE_FOCAL_PHASE
// ---------------------------------------------------------------------------

describe('ADVANCE_FOCAL_PHASE', () => {
    it('advances focal → action when player held no focal point', () => {
        const state = makeState({
            phase: 'focal',
            activeFocalHolders: { red: null, blue: null },
        });
        const next = gameReducer(state, {
            type: 'ADVANCE_FOCAL_PHASE',
            dieNewValue: 3,
            extraDieRoll: 1,
        });
        expect(next.phase).toBe('action');
        expect(next.scores.red).toBe(0); // no points awarded
    });

    it('awards 1 VP and rerolls die when player held an active focal point', () => {
        const state = makeState({
            phase: 'focal',
            dice: { [FOCAL_CENTER]: [{ owner: 'red', value: 4 }] },
            focalPoints: {
                [FOCAL_CENTER]: { isActive: true, group: 'main' },
                [FOCAL_LEFT]:   { isActive: false, group: 'main' },
                [FOCAL_RIGHT]:  { isActive: false, group: 'main' },
            },
            activeFocalHolders: { red: FOCAL_CENTER, blue: null },
            scores: { red: 0, blue: 0 },
        });
        // dieNewValue 1 → effective new value = max(1, min(1, 4−1)) = 1
        const next = gameReducer(state, {
            type: 'ADVANCE_FOCAL_PHASE',
            dieNewValue: 1,
            extraDieRoll: 2, // even → index 0 of sorted passives → FOCAL_LEFT
        });
        expect(next.phase).toBe('action');
        expect(next.scores.red).toBe(1);
        // die value should decrease (max(1, min(1, 4-1)) = 1)
        expect(next.dice[FOCAL_CENTER][0].value).toBe(1);
        // center should be deactivated, left should now be active
        expect(next.focalPoints[FOCAL_CENTER].isActive).toBe(false);
        expect(next.focalPoints[FOCAL_LEFT].isActive).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// MOVE_DIE
// ---------------------------------------------------------------------------

describe('MOVE_DIE', () => {
    it('moves die to empty hex and sets actionTaken', () => {
        const state = makeState({
            phase: 'action',
            dice: { [A]: [{ owner: 'red', value: 3 }] },
        });
        const next = gameReducer(state, { type: 'MOVE_DIE', fromHex: A, toHex: B });
        expect(next.actionTaken).toBe(true);
        expect(next.dice[B]).toEqual([{ owner: 'red', value: 3 }]);
        const srcStack = next.dice[A] ?? [];
        expect(srcStack.length).toBe(0);
    });

    it('sets phase to combat and records CombatState when moving onto enemy', () => {
        const state = makeCombatReady();
        const next = gameReducer(state, { type: 'MOVE_DIE', fromHex: A, toHex: B });
        expect(next.phase).toBe('combat');
        expect(next.actionTaken).toBe(true);
        expect(next.combat).not.toBeNull();
        expect(next.combat.attackerHex).toBe(A);
        expect(next.combat.defenderHex).toBe(B);
    });

    it('passes approachDirection through to CombatState', () => {
        const state = makeCombatReady();
        const next = gameReducer(state, {
            type: 'MOVE_DIE',
            fromHex: A,
            toHex: B,
            approachDirection: A,
        });
        expect(next.combat.approachDirection).toBe(A);
    });
});

// ---------------------------------------------------------------------------
// MOVE_TOWER
// ---------------------------------------------------------------------------

describe('MOVE_TOWER', () => {
    it('moves whole tower to empty hex and sets actionTaken', () => {
        // A tower of 2 red dice at A
        const state = makeState({
            phase: 'action',
            dice: {
                [A]: [
                    { owner: 'red', value: 2 },
                    { owner: 'red', value: 4 },
                ],
            },
        });
        const next = gameReducer(state, { type: 'MOVE_TOWER', fromHex: A, toHex: B });
        expect(next.actionTaken).toBe(true);
        const destStack = next.dice[B] ?? [];
        expect(destStack.length).toBe(2);
    });

    it('triggers combat when tower moves onto enemy', () => {
        const state = makeState({
            phase: 'action',
            dice: {
                [A]: [
                    { owner: 'red', value: 2 },
                    { owner: 'red', value: 4 },
                ],
                [B]: [{ owner: 'blue', value: 2 }],
            },
        });
        const next = gameReducer(state, { type: 'MOVE_TOWER', fromHex: A, toHex: B });
        expect(next.phase).toBe('combat');
        expect(next.actionTaken).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// JUMP
// ---------------------------------------------------------------------------

describe('JUMP', () => {
    it('jumps top die from tower to empty hex and sets actionTaken', () => {
        // Tower: blue at bottom, red on top at A → jump to empty C
        const state = makeState({
            phase: 'action',
            dice: {
                [A]: [
                    { owner: 'blue', value: 2 },
                    { owner: 'red', value: 4 },
                ],
            },
        });
        const next = gameReducer(state, {
            type: 'JUMP',
            towerHex: A,
            targetHex: C,
        });
        expect(next.actionTaken).toBe(true);
        // Red die should be at C
        const destStack = next.dice[C] ?? [];
        expect(destStack.length).toBe(1);
        expect(destStack[0].owner).toBe('red');
        // Blue die remains at A
        const srcStack = next.dice[A] ?? [];
        expect(srcStack.length).toBe(1);
        expect(srcStack[0].owner).toBe('blue');
    });
});

// ---------------------------------------------------------------------------
// COLLAPSE
// ---------------------------------------------------------------------------

describe('COLLAPSE', () => {
    it('removes the bottom die from a tower and sets actionTaken', () => {
        const state = makeState({
            phase: 'action',
            currentPlayer: 'red',
            dice: {
                [A]: [
                    { owner: 'blue', value: 2 },
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 5 },
                ],
            },
            scores: { red: 0, blue: 0 },
        });
        const next = gameReducer(state, { type: 'COLLAPSE', hex: A });
        expect(next.actionTaken).toBe(true);
        const stack = next.dice[A] ?? [];
        expect(stack.length).toBe(2); // bottom removed
        expect(next.scores.red).toBe(1); // enemy die removed → +1 VP
    });
});

// ---------------------------------------------------------------------------
// REROLL
// ---------------------------------------------------------------------------

describe('REROLL', () => {
    it('rerolls die upward and sets actionTaken', () => {
        const state = makeState({
            phase: 'action',
            dice: { [A]: [{ owner: 'red', value: 2 }] },
        });
        const next = gameReducer(state, { type: 'REROLL', hex: A, newValue: 5 });
        expect(next.actionTaken).toBe(true);
        expect(next.dice[A][0].value).toBe(5); // new value is higher → kept
    });

    it('keeps original die value when reroll is lower', () => {
        const state = makeState({
            phase: 'action',
            dice: { [A]: [{ owner: 'red', value: 4 }] },
        });
        const next = gameReducer(state, { type: 'REROLL', hex: A, newValue: 1 });
        expect(next.dice[A][0].value).toBe(4); // original kept
    });
});

// ---------------------------------------------------------------------------
// CHOOSE_COMBAT_OPTION — occupy
// ---------------------------------------------------------------------------

describe('CHOOSE_COMBAT_OPTION — occupy', () => {
    it('places attacker die on top of defender, decrements attacker, advances phase', () => {
        // Red (value 5) attacks blue (value 2) at adjacent hex B
        const state = makeState({
            phase: 'combat',
            dice: {
                [A]: [{ owner: 'red', value: 5 }],
                [B]: [{ owner: 'blue', value: 2 }],
            },
            scores: { red: 0, blue: 0 },
            combat: {
                attackerHex: A,
                defenderHex: B,
                approachDirection: A,
                options: ['push', 'occupy'],
            },
        });
        const next = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'occupy' });
        // B should now have 2 dice: blue on bottom, red on top
        const stack = next.dice[B] ?? [];
        expect(stack.length).toBe(2);
        expect(stack[0].owner).toBe('blue');
        expect(stack[1].owner).toBe('red');
        // Attacker decrements from 5 → 4
        expect(stack[1].value).toBe(4);
        // combat cleared
        expect(next.combat).toBeNull();
        // Phase advanced (score < 5 → end turn → focal, next player)
        expect(next.phase).toBe('focal');
        expect(next.currentPlayer).toBe('blue');
    });
});

// ---------------------------------------------------------------------------
// CHOOSE_COMBAT_OPTION — push
// ---------------------------------------------------------------------------

describe('CHOOSE_COMBAT_OPTION — push', () => {
    it('pushes defender away from board edge when free space exists, advances phase', () => {
        // Red at center A, blue at B adjacent. Push direction: A → B continued.
        // We need blue's pushed destination to be on the board: B's neighbor in push direction.
        // B = (1,-1,0). Push direction = B - A = (1,-1,0). Neighbor = B + dir = (2,-2,0).
        // Verify (2,-2,0): q+r+s = 0 ✓, |q|=2, |r|=2, |s|=0 — within radius 4, valid field.
        const state = makeState({
            phase: 'combat',
            dice: {
                [A]: [{ owner: 'red', value: 5 }],
                [B]: [{ owner: 'blue', value: 2 }],
            },
            scores: { red: 0, blue: 0 },
            combat: {
                attackerHex: A,
                defenderHex: B,
                approachDirection: A,
                options: ['push', 'occupy'],
            },
        });
        const next = gameReducer(state, {
            type: 'CHOOSE_COMBAT_OPTION',
            option: 'push',
            rerollValue: 3,
        });
        expect(next.combat).toBeNull();
        // Defender pushed: B should be empty, '2,-2,0' should be occupied by blue
        const bStack = next.dice[B] ?? [];
        expect(bStack.filter(d => d.owner === 'blue').length).toBe(0);
        const pushedStack = next.dice['2,-2,0'] ?? [];
        expect(pushedStack.some(d => d.owner === 'blue')).toBe(true);
        // Phase advanced (no victory) → turn ended → focal, blue's turn
        expect(next.phase).toBe('focal');
        expect(next.currentPlayer).toBe('blue');
    });
});

// ---------------------------------------------------------------------------
// CONFIRM_ACTION
// ---------------------------------------------------------------------------

describe('CONFIRM_ACTION', () => {
    it('advances action phase to focal of next player when no combat and no victory', () => {
        const state = makeState({
            phase: 'action',
            actionTaken: true,
            combat: null,
            scores: { red: 0, blue: 0 },
        });
        const next = gameReducer(state, { type: 'CONFIRM_ACTION' });
        expect(next.phase).toBe('focal');
        expect(next.currentPlayer).toBe('blue');
        expect(next.actionTaken).toBe(false);
    });

    it('advances to victory phase when player has reached VICTORY_POINTS', () => {
        const state = makeState({
            phase: 'action',
            actionTaken: true,
            combat: null,
            scores: { red: 5, blue: 0 },
        });
        const next = gameReducer(state, { type: 'CONFIRM_ACTION' });
        expect(next.phase).toBe('victory');
        expect(next.currentPlayer).toBe('red');
    });

    it('advances action → combat when combat is pending', () => {
        const state = makeState({
            phase: 'action',
            actionTaken: true,
            combat: { attackerHex: A, defenderHex: B, approachDirection: A, options: ['push', 'occupy'] },
            scores: { red: 0, blue: 0 },
        });
        const next = gameReducer(state, { type: 'CONFIRM_ACTION' });
        expect(next.phase).toBe('combat');
    });
});

// ---------------------------------------------------------------------------
// END_TURN
// ---------------------------------------------------------------------------

describe('END_TURN', () => {
    it('ends current turn and starts next player\'s focal phase', () => {
        const state = makeState({
            phase: 'action',
            currentPlayer: 'red',
            actionTaken: true,
        });
        const next = gameReducer(state, { type: 'END_TURN' });
        expect(next.phase).toBe('focal');
        expect(next.currentPlayer).toBe('blue');
        expect(next.actionTaken).toBe(false);
        expect(next.combat).toBeNull();
    });

    it('wraps around to first player after last player', () => {
        const state = makeState({
            currentPlayer: 'blue',
            phase: 'action',
        });
        const next = gameReducer(state, { type: 'END_TURN' });
        expect(next.currentPlayer).toBe('red');
    });
});
