/**
 * Phase 6.1 — Focal point scoring phase
 * Phase 6.2 — Focal point detection (end of action phase)
 *
 * All functions are pure — they read GameState but never mutate it.
 * hexKey format: "q,r,s" (produced by hexUtils.hexKey)
 */

import { getDiceAt, getController, isFocalPointActive, getActiveFocalPoints } from './gameState.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Minimum value a die can have (floor when decreasing die values).
 * @constant {number}
 */
const MIN_DIE_VALUE = 1;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns all focal point hex keys in the same group as `groupId` that are
 * currently passive (inactive), sorted alphabetically for deterministic ordering.
 *
 * @param {import('./gameState.js').GameState} state
 * @param {string} groupId
 * @returns {string[]}
 */
function getPassiveHexesInGroup(state, groupId) {
    return Object.entries(state.focalPoints)
        .filter(([, fp]) => fp.group === groupId && !fp.isActive)
        .map(([key]) => key)
        .sort();
}

/**
 * Returns a new focalPoints map with `hexKey` set to the given `isActive` value.
 *
 * @param {Object.<string, import('./gameState.js').FocalPointState>} focalPoints
 * @param {string} hexKey
 * @param {boolean} isActive
 * @returns {Object.<string, import('./gameState.js').FocalPointState>}
 */
function setFocalActive(focalPoints, hexKey, isActive) {
    return {
        ...focalPoints,
        [hexKey]: { ...focalPoints[hexKey], isActive },
    };
}

// ---------------------------------------------------------------------------
// Phase 6.1 — Focal point scoring phase
// ---------------------------------------------------------------------------

/**
 * Applies the focal point scoring phase at the start of the current player's turn.
 *
 * If the current player held an active focal point at the end of their previous turn
 * (recorded in `state.activeFocalHolders`), this function:
 *   1. Awards 1 victory point to the current player.
 *   2. Rerolls the die at that hex: new value = max(MIN_DIE_VALUE, min(dieRoll, original − 1)),
 *      so the die can only decrease.
 *   3. Deactivates that focal point (it becomes passive).
 *   4. Activates one of the passive hexes in the same focal point group, chosen by
 *      `extraDieRoll % passiveCount` (even roll → first passive, odd roll → second, etc.).
 *
 * Always transitions phase to 'action'.
 * Accepts roll values as parameters so the function stays pure and testable.
 *
 * @param {import('./gameState.js').GameState} state
 * @param {number} dieRoll       - D6 roll (1–6) used to reroll the held die.
 * @param {number} extraDieRoll  - D6 roll (1–6) used to pick the next active focal point.
 * @returns {import('./gameState.js').GameState}
 */
export function applyFocalPhase(state, dieRoll, extraDieRoll) {
    const player = state.currentPlayer;
    const heldHex = state.activeFocalHolders[player];

    // No focal point was held, or it is no longer active — just advance phase.
    if (!heldHex || !isFocalPointActive(state, heldHex)) {
        return { ...state, phase: 'action' };
    }

    // 1. Award 1 victory point.
    const newScores = {
        ...state.scores,
        [player]: state.scores[player] + 1,
    };

    // 2. Reroll the top die at the held hex (die can only decrease).
    const stack = getDiceAt(state, heldHex);
    const topDie = stack[stack.length - 1];
    const newValue = Math.max(MIN_DIE_VALUE, Math.min(dieRoll, topDie.value - 1));
    const newStack = [
        ...stack.slice(0, -1),
        { ...topDie, value: newValue },
    ];
    const newDice = { ...state.dice, [heldHex]: newStack };

    // 3. Deactivate the scored focal point.
    let newFocalPoints = setFocalActive(state.focalPoints, heldHex, false);

    // 4. Activate a passive hex from the same group (excluding the just-scored hex).
    const group = state.focalPoints[heldHex].group;
    const passives = getPassiveHexesInGroup({ ...state, focalPoints: newFocalPoints }, group)
        .filter(key => key !== heldHex);
    if (passives.length > 0) {
        const nextIndex = extraDieRoll % passives.length;
        newFocalPoints = setFocalActive(newFocalPoints, passives[nextIndex], true);
    }

    return {
        ...state,
        scores:      newScores,
        dice:        newDice,
        focalPoints: newFocalPoints,
        phase:       'action',
    };
}

// ---------------------------------------------------------------------------
// Phase 6.2 — Focal point detection
// ---------------------------------------------------------------------------

/**
 * Records which active focal point (if any) each player currently controls.
 * Called at the end of the action phase, after movement and combat are resolved.
 *
 * For each player, finds the first active focal point hex whose top die belongs
 * to that player, and stores that hex key in `activeFocalHolders`.
 * If a player controls no active focal point, their entry is set to null.
 *
 * @param {import('./gameState.js').GameState} state
 * @returns {import('./gameState.js').GameState}
 */
export function updateFocalHolders(state) {
    const activeFocalKeys = getActiveFocalPoints(state);
    const newHolders = {};

    for (const player of state.players) {
        const heldKey = activeFocalKeys.find(key => getController(state, key) === player) ?? null;
        newHolders[player] = heldKey;
    }

    return { ...state, activeFocalHolders: newHolders };
}
