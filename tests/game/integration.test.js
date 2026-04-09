/**
 * Phase 13.2 — Integration tests
 *
 * These tests drive multiple reducer dispatches in sequence to verify that
 * entire turn flows, scoring paths, and edge-case combat scenarios behave
 * correctly end-to-end.
 */

import { describe, it, expect } from 'vitest';
import { gameReducer } from '../../src/game/gameReducer';

// ---------------------------------------------------------------------------
// Hex coordinates (all within board radius 4, i.e. max |q|,|r|,|s| ≤ 4)
// ---------------------------------------------------------------------------

const A = '0,0,0';
const B = '1,-1,0';
const C = '2,-2,0';
const D = '3,-3,0';    // 3 steps from origin along same axis as B,C
const E = '4,-4,0';    // board edge

// Separate axis for off-map test
const NEAR_EDGE = '3,0,-3';   // on board  (max coord = 3)
const EDGE      = '4,0,-4';   // on board  (max coord = 4)
// (5,0,-5) would be off board

const FOCAL_CENTER = '0,0,0'; // overlaps A — used in focal scoring tests
const FOCAL_LEFT   = '-2,0,2';
const FOCAL_RIGHT  = '2,0,-2';

// ---------------------------------------------------------------------------
// Helper — minimal valid GameState
// ---------------------------------------------------------------------------

function baseState(overrides = {}) {
    return {
        players: ['red', 'blue'],
        currentPlayer: 'red',
        phase: 'focal',
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
// 1. Full turn sequences
// ---------------------------------------------------------------------------

describe('full turn sequence — two consecutive turns without combat', () => {
    it('red moves, turn passes to blue, blue moves, turn passes back to red', () => {
        // Initial state: red die at A (value 3), blue die at far corner (no conflict)
        const BLUE_START = '-4,0,4';
        let state = baseState({
            phase: 'focal',
            currentPlayer: 'red',
            dice: {
                [A]: [{ owner: 'red', value: 3 }],
                [BLUE_START]: [{ owner: 'blue', value: 3 }],
            },
        });

        // Red focal phase — no holder
        state = gameReducer(state, { type: 'ADVANCE_FOCAL_PHASE', dieNewValue: 3, extraDieRoll: 1 });
        expect(state.phase).toBe('action');
        expect(state.currentPlayer).toBe('red');

        // Red moves die from A to B (adjacent empty hex)
        state = gameReducer(state, { type: 'MOVE_DIE', fromHex: A, toHex: B });
        expect(state.actionTaken).toBe(true);
        expect(state.dice[B]).toEqual([{ owner: 'red', value: 3 }]);
        expect(state.dice[A]).toBeUndefined();

        // Red confirms action → turn ends, blue's focal phase
        state = gameReducer(state, { type: 'CONFIRM_ACTION' });
        expect(state.phase).toBe('focal');
        expect(state.currentPlayer).toBe('blue');
        expect(state.actionTaken).toBe(false);

        // Blue focal phase — no holder
        state = gameReducer(state, { type: 'ADVANCE_FOCAL_PHASE', dieNewValue: 3, extraDieRoll: 1 });
        expect(state.phase).toBe('action');
        expect(state.currentPlayer).toBe('blue');

        // Blue moves die one step
        const BLUE_NEXT = '-3,0,3';
        state = gameReducer(state, { type: 'MOVE_DIE', fromHex: BLUE_START, toHex: BLUE_NEXT });
        expect(state.actionTaken).toBe(true);

        // Blue confirms → back to red's focal phase
        state = gameReducer(state, { type: 'CONFIRM_ACTION' });
        expect(state.phase).toBe('focal');
        expect(state.currentPlayer).toBe('red');
        expect(state.actionTaken).toBe(false);
    });
});

describe('full turn sequence — move → combat → push → turn advances', () => {
    it('red attacks blue, chooses push, turn passes to blue', () => {
        // Red (value 5) at A, blue (value 2) at B (adjacent)
        let state = baseState({
            phase: 'focal',
            currentPlayer: 'red',
            dice: {
                [A]: [{ owner: 'red', value: 5 }],
                [B]: [{ owner: 'blue', value: 2 }],
            },
        });

        // Focal phase — no holders
        state = gameReducer(state, { type: 'ADVANCE_FOCAL_PHASE', dieNewValue: 3, extraDieRoll: 1 });
        expect(state.phase).toBe('action');

        // Red moves onto enemy → combat triggered immediately (phase already 'combat')
        state = gameReducer(state, { type: 'MOVE_DIE', fromHex: A, toHex: B });
        expect(state.phase).toBe('combat');
        expect(state.combat).not.toBeNull();

        // Red chooses push (blue pushed from B to C, reroll=1)
        state = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'push', rerollValue: 1 });
        // Blue moved to C, red attacker value decremented (5→4)
        expect(state.combat).toBeNull();
        const pushedStack = state.dice[C] ?? [];
        expect(pushedStack.some(d => d.owner === 'blue')).toBe(true);
        expect((state.dice[B] ?? []).some(d => d.owner === 'blue')).toBe(false);
        // Red attacker moved to B (defenderHex), value decreased by 1
        expect(state.dice[A]).toBeUndefined();
        expect(state.dice[B][0].value).toBe(4);
        expect(state.dice[B][0].owner).toBe('red');
        // Turn passed to blue
        expect(state.phase).toBe('focal');
        expect(state.currentPlayer).toBe('blue');
    });
});

describe('full turn sequence — focal point holder scores on next turn', () => {
    it('red holds active focal at end of turn, scores VP on the next turn', () => {
        // Red die sits on active focal point A.
        // After red's action phase, endTurn snapshots the holder.
        // On red's next turn, ADVANCE_FOCAL_PHASE awards 1 VP and rerolls the die.

        // Set up: red holds focal center (active), two passive focal points exist
        let state = baseState({
            phase: 'action',
            currentPlayer: 'red',
            actionTaken: false,
            dice: {
                [FOCAL_CENTER]: [{ owner: 'red', value: 4 }],
                ['-4,0,4']:     [{ owner: 'blue', value: 3 }], // blue far away
            },
            focalPoints: {
                [FOCAL_CENTER]: { isActive: true,  group: 'main' },
                [FOCAL_LEFT]:   { isActive: false, group: 'main' },
                [FOCAL_RIGHT]:  { isActive: false, group: 'main' },
            },
            activeFocalHolders: { red: null, blue: null },
        });

        // Red rerolls (simple action that doesn't move the die off the focal point)
        state = gameReducer(state, { type: 'REROLL', hex: FOCAL_CENTER, newValue: 4 });
        expect(state.actionTaken).toBe(true);

        // Confirm action → endTurn snapshots holder, blue's focal phase
        state = gameReducer(state, { type: 'CONFIRM_ACTION' });
        expect(state.currentPlayer).toBe('blue');
        // Focal holder recorded: red still controls FOCAL_CENTER
        expect(state.activeFocalHolders.red).toBe(FOCAL_CENTER);

        // Blue takes a trivial turn
        state = gameReducer(state, { type: 'ADVANCE_FOCAL_PHASE', dieNewValue: 3, extraDieRoll: 1 });
        state = gameReducer(state, { type: 'REROLL', hex: '-4,0,4', newValue: 4 });
        state = gameReducer(state, { type: 'CONFIRM_ACTION' });
        expect(state.currentPlayer).toBe('red');

        // Red's focal phase — should award 1 VP and reroll the die
        const prevDieValue = state.dice[FOCAL_CENTER][0].value;
        state = gameReducer(state, { type: 'ADVANCE_FOCAL_PHASE', dieNewValue: 1, extraDieRoll: 2 });
        expect(state.scores.red).toBe(1);
        // Die value must decrease (min(1, prevDieValue-1) = 1 since prevDieValue >= 1)
        expect(state.dice[FOCAL_CENTER][0].value).toBeLessThan(prevDieValue);
        // A passive focal point is now active
        const activeFPs = Object.entries(state.focalPoints).filter(([, fp]) => fp.isActive);
        expect(activeFPs.length).toBe(1);
        expect(activeFPs[0][0]).not.toBe(FOCAL_CENTER);
    });
});

// ---------------------------------------------------------------------------
// 2. Edge case — die value 1 attacking (attacker value clamps at 1 after combat)
// ---------------------------------------------------------------------------

describe('edge case — attacker value clamps at 1 after combat', () => {
    it('attacker with value 2 attacks and drops to 1 (not 0) after push', () => {
        let state = baseState({
            phase: 'combat',
            currentPlayer: 'red',
            dice: {
                [A]: [{ owner: 'red',  value: 2 }],
                [B]: [{ owner: 'blue', value: 1 }],
            },
            scores: { red: 0, blue: 0 },
            combat: {
                attackerHex: A,
                defenderHex: B,
                approachDirection: A,
                options: ['push', 'occupy'],
            },
        });
        state = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'push', rerollValue: 1 });
        // Attacker value: 2 − 1 = 1 (not 0); attacker moved to B (defenderHex)
        expect(state.dice[A]).toBeUndefined();
        expect(state.dice[B][0].value).toBe(1);
    });

    it('attacker already at value 1 stays at 1 after occupy', () => {
        // Red value 2 (strength 3) vs blue value 1 (strength 2) → legal attack
        let state = baseState({
            phase: 'combat',
            currentPlayer: 'red',
            dice: {
                [A]: [{ owner: 'red',  value: 2 }],
                [B]: [{ owner: 'blue', value: 1 }],
            },
            scores: { red: 0, blue: 0 },
            combat: {
                attackerHex: A,
                defenderHex: B,
                approachDirection: A,
                options: ['push', 'occupy'],
            },
        });
        state = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'occupy' });
        // Mixed tower at B: [blue(1), red(1)] — attacker dropped from 2→1
        const stack = state.dice[B];
        expect(stack.length).toBe(2);
        const redDie = stack.find(d => d.owner === 'red');
        expect(redDie.value).toBe(1); // clamped at 1
    });
});

// ---------------------------------------------------------------------------
// 3. Edge case — tower collapse scoring
// ---------------------------------------------------------------------------

describe('edge case — tower collapse scoring', () => {
    it('collapsing an enemy bottom die awards 1 VP and advances turn', () => {
        // 3-die tower: [blue(2), red(3), red(5)] — red controls top, blue on bottom
        let state = baseState({
            phase: 'action',
            currentPlayer: 'red',
            dice: {
                [A]: [
                    { owner: 'blue', value: 2 },
                    { owner: 'red',  value: 3 },
                    { owner: 'red',  value: 5 },
                ],
            },
            scores: { red: 0, blue: 0 },
        });
        state = gameReducer(state, { type: 'COLLAPSE', hex: A });
        expect(state.actionTaken).toBe(true);
        expect(state.scores.red).toBe(1);
        // Bottom die removed — 2 dice remain
        expect(state.dice[A].length).toBe(2);
        expect(state.dice[A][0]).toEqual({ owner: 'red', value: 3 });

        // Confirm → turn passes to blue
        state = gameReducer(state, { type: 'CONFIRM_ACTION' });
        expect(state.phase).toBe('focal');
        expect(state.currentPlayer).toBe('blue');
    });

    it('collapsing own bottom die does NOT award a point', () => {
        let state = baseState({
            phase: 'action',
            currentPlayer: 'red',
            dice: {
                [A]: [
                    { owner: 'red', value: 1 },
                    { owner: 'red', value: 3 },
                    { owner: 'red', value: 5 },
                ],
            },
            scores: { red: 0, blue: 0 },
        });
        state = gameReducer(state, { type: 'COLLAPSE', hex: A });
        expect(state.scores.red).toBe(0);
        expect(state.dice[A].length).toBe(2);
    });

    it('collapse scoring can trigger victory condition', () => {
        // Red is at 4 VP — one more destroy wins
        let state = baseState({
            phase: 'action',
            currentPlayer: 'red',
            dice: {
                [A]: [
                    { owner: 'blue', value: 2 },
                    { owner: 'red',  value: 3 },
                    { owner: 'red',  value: 5 },
                ],
            },
            scores: { red: 4, blue: 0 },
        });
        state = gameReducer(state, { type: 'COLLAPSE', hex: A });
        expect(state.scores.red).toBe(5);
        state = gameReducer(state, { type: 'CONFIRM_ACTION' });
        expect(state.phase).toBe('victory');
        expect(state.currentPlayer).toBe('red');
    });
});

// ---------------------------------------------------------------------------
// 4. Edge case — chain push encirclement
// ---------------------------------------------------------------------------

describe('edge case — chain push encirclement', () => {
    it('last formation in push chain blocked by own unit is destroyed (encirclement)', () => {
        // Layout along q-axis:
        //   A (red, attacker) → B (blue) → C (blue) → D (red, blocks retreat)
        // Push direction: A→B = (1,-1,0)
        // Chain: [B, C]. C's destination = D = own unit → encirclement → C destroyed, +1 VP
        // B survives, moves to C; B's top die rerolled to min(rerollValue, original)

        let state = baseState({
            phase: 'combat',
            currentPlayer: 'red',
            dice: {
                [A]: [{ owner: 'red',  value: 5 }],
                [B]: [{ owner: 'blue', value: 3 }],
                [C]: [{ owner: 'blue', value: 2 }],
                [D]: [{ owner: 'red',  value: 4 }],
            },
            scores: { red: 0, blue: 0 },
            combat: {
                attackerHex: A,
                defenderHex: B,
                approachDirection: A,
                options: ['push'],
            },
        });

        state = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'push', rerollValue: 2 });

        // C (the last formation) should be destroyed
        expect(state.dice[C]).toBeDefined();         // C is now where B was pushed to
        expect((state.dice[C] ?? []).some(d => d.owner === 'blue')).toBe(true); // B moved here
        // D must still exist (not overwritten)
        expect(state.dice[D][0].owner).toBe('red');
        // Red scored 1 for destroying the blue die at C's original position
        expect(state.scores.red).toBe(1);
        // Attacker moved to B (defenderHex), value decremented
        expect(state.dice[A]).toBeUndefined();
        expect(state.dice[B][0].owner).toBe('red');
        expect(state.dice[B][0].value).toBe(4);
    });

    it('chain push: two blue dice destroyed by encirclement scores 2 VPs', () => {
        // A (red) → B (blue, 2 dice) → own red at C
        // Push direction: A→B = (1,-1,0)
        // Chain: [B]. B's destination = C = own unit → encirclement → all 2 blue dice at B destroyed

        let state = baseState({
            phase: 'combat',
            currentPlayer: 'red',
            dice: {
                [A]: [{ owner: 'red',  value: 6 }],
                [B]: [
                    { owner: 'blue', value: 1 },
                    { owner: 'blue', value: 2 },
                ],
                [C]: [{ owner: 'red', value: 3 }],
            },
            scores: { red: 0, blue: 0 },
            combat: {
                attackerHex: A,
                defenderHex: B,
                approachDirection: A,
                options: ['push'],
            },
        });

        state = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'push', rerollValue: 1 });

        // Both blue dice at B destroyed → +2 VP
        expect(state.scores.red).toBe(2);
        // Attacker moved to B (defenderHex); blue dice destroyed
        expect(state.dice[A]).toBeUndefined();
        expect(state.dice[B][0].owner).toBe('red');
        // C untouched
        expect(state.dice[C][0].owner).toBe('red');
    });
});

// ---------------------------------------------------------------------------
// 5. Edge case — off-map scoring
// ---------------------------------------------------------------------------

describe('edge case — off-map scoring', () => {
    it('defender pushed off the board edge is destroyed and scores 1 VP for attacker', () => {
        // Red at NEAR_EDGE (3,0,-3), blue at EDGE (4,0,-4)
        // Push direction (3,0,-3) → (4,0,-4) = (1,0,-1)
        // Blue's pushed destination = (5,0,-5) → off board → destroyed, +1 VP

        let state = baseState({
            phase: 'combat',
            currentPlayer: 'red',
            dice: {
                [NEAR_EDGE]: [{ owner: 'red',  value: 5 }],
                [EDGE]:      [{ owner: 'blue', value: 2 }],
            },
            scores: { red: 0, blue: 0 },
            combat: {
                attackerHex: NEAR_EDGE,
                defenderHex: EDGE,
                approachDirection: NEAR_EDGE,
                options: ['push', 'occupy'],
            },
        });

        state = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'push', rerollValue: 1 });

        expect(state.scores.red).toBe(1);
        // Attacker moved to EDGE (defenderHex), value decremented
        expect(state.dice[NEAR_EDGE]).toBeUndefined();
        expect(state.dice[EDGE][0].owner).toBe('red');
        expect(state.dice[EDGE][0].value).toBe(4);
    });

    it('two blue dice pushed off map scores 2 VPs', () => {
        // Mixed blue tower at EDGE, pushed off map
        let state = baseState({
            phase: 'combat',
            currentPlayer: 'red',
            dice: {
                [NEAR_EDGE]: [{ owner: 'red',  value: 6 }],
                [EDGE]: [
                    { owner: 'blue', value: 1 },
                    { owner: 'blue', value: 3 },
                ],
            },
            scores: { red: 0, blue: 0 },
            combat: {
                attackerHex: NEAR_EDGE,
                defenderHex: EDGE,
                approachDirection: NEAR_EDGE,
                options: ['push'],
            },
        });

        state = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'push', rerollValue: 1 });

        expect(state.scores.red).toBe(2);
        // Attacker moved to EDGE; the two blue dice were destroyed (off map)
        expect(state.dice[NEAR_EDGE]).toBeUndefined();
        expect(state.dice[EDGE][0].owner).toBe('red');
    });

    it('off-map destruction with 5 VP triggers victory', () => {
        let state = baseState({
            phase: 'combat',
            currentPlayer: 'red',
            dice: {
                [NEAR_EDGE]: [{ owner: 'red',  value: 5 }],
                [EDGE]:      [{ owner: 'blue', value: 2 }],
            },
            scores: { red: 4, blue: 0 },
            combat: {
                attackerHex: NEAR_EDGE,
                defenderHex: EDGE,
                approachDirection: NEAR_EDGE,
                options: ['push', 'occupy'],
            },
        });

        state = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'push', rerollValue: 1 });

        expect(state.scores.red).toBe(5);
        expect(state.phase).toBe('victory');
        expect(state.currentPlayer).toBe('red');
    });
});

// ---------------------------------------------------------------------------
// 6. Edge case — chain push off map (two formations, last goes off map)
// ---------------------------------------------------------------------------

describe('edge case — chain push where last formation exits the board', () => {
    it('first formation survives, second pushed off map, attacker scores 1 VP', () => {
        // Use the (q=0, s=-q) axis so NEAR_EDGE=(3,0,-3) and EDGE=(4,0,-4) are adjacent.
        // Red at (2,0,-2) attacks blue at NEAR_EDGE=(3,0,-3).
        // Another blue at EDGE=(4,0,-4).
        // Push direction (1,0,-1); chain = [NEAR_EDGE, EDGE].
        // EDGE's destination (5,0,-5) is off board → EDGE's blue destroyed (+1 VP).
        // NEAR_EDGE's blue moves to EDGE's position.

        const ATTACKER = '2,0,-2';

        let state = baseState({
            phase: 'combat',
            currentPlayer: 'red',
            dice: {
                [ATTACKER]: [{ owner: 'red',  value: 6 }],
                [NEAR_EDGE]: [{ owner: 'blue', value: 3 }],
                [EDGE]:      [{ owner: 'blue', value: 2 }],
            },
            scores: { red: 0, blue: 0 },
            combat: {
                attackerHex: ATTACKER,
                defenderHex: NEAR_EDGE,
                approachDirection: ATTACKER,
                options: ['push'],
            },
        });

        state = gameReducer(state, { type: 'CHOOSE_COMBAT_OPTION', option: 'push', rerollValue: 1 });

        // EDGE's blue die destroyed → +1 VP
        expect(state.scores.red).toBe(1);
        // NEAR_EDGE's blue moved to EDGE's position
        expect(state.dice[NEAR_EDGE][0].owner).toBe('red'); // attacker moved here
        expect(state.dice[ATTACKER]).toBeUndefined(); // attacker left
        expect(state.dice[EDGE]).toBeDefined();
        expect(state.dice[EDGE].some(d => d.owner === 'blue')).toBe(true);
        // Attacker decremented
        expect(state.dice[NEAR_EDGE][0].value).toBe(5);
    });
});