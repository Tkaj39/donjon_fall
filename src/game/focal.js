/**
 * Focal Point Logic (Phase 6)
 *
 * Implements the focal-point scoring phase that runs at the start of each
 * player"s turn, and the end-of-action snapshot that records which active
 * focal points each player currently holds.
 */

import { getDiceAt, getController, isFocalPointActive } from "./gameState.js";

// ---------------------------------------------------------------------------
// 6.1 — applyFocalPhase
// ---------------------------------------------------------------------------

/**
 * Processes the focal-point scoring phase at the start of the current player"s
 * turn ("focal" phase).
 *
 * If the current player held an active focal point at the end of their previous
 * turn (recorded in `state.activeFocalHolders`):
 *   1. Awards 1 VP to the current player.
 *   2. Rerolls the die sitting on that hex: new value = max(1, min(dieNewValue, original − 1)).
 *      The die can only decrease in value (or stay at 1).
 *   3. Deactivates the scored focal point.
 *   4. Uses extraDieRoll to select which passive hex in the same group becomes
 *      the next active focal point.
 *
 * Roll-to-index mapping for N passive hexes (sorted deterministically by hexKey):
 *   activationRoll % N  →  index into sorted passive hex array
 *   With 2 passives: even roll (2,4,6) → index 0 (left), odd roll (1,3,5) → index 1 (right).
 *   This matches the CLAUDE.md rule: even = left, odd = right.
 *
 * Pure function — rolls are passed in as parameters so logic is deterministic
 * and trivially testable.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {number} dieNewValue   - D6 result (1–6) for rerolling the held die;
 *                                 effective new value = max(1, min(dieNewValue, original − 1))
 * @param {number} extraDieRoll  - D6 result (1–6) that selects the next active focal point
 *                                 within the same group (extraDieRoll % N, N = passive count)
 * @returns {import("./gameState.js").GameState}
 */
export function applyFocalPhase(state, dieNewValue, extraDieRoll) {
    const player = state.currentPlayer;
    const heldHexKey = state.activeFocalHolders[player];

    if (heldHexKey === null) {
        // Current player held no active focal point last turn — nothing to do.
        return state;
    }

    // 1. Award 1 VP.
    const newScores = { ...state.scores, [player]: state.scores[player] + 1 };

    // 2. Reroll the die on that hex: max(1, min(dieNewValue, original − 1)).
    const stack = getDiceAt(state, heldHexKey);
    const topDie = stack[stack.length - 1];
    const newDieValue = Math.max(1, Math.min(dieNewValue, topDie.value - 1));
    const newStack = [...stack.slice(0, -1), { ...topDie, value: newDieValue }];

    // 3. Deactivate the scored focal point.
    const group = state.focalPoints[heldHexKey].group;
    let newFocalPoints = {
        ...state.focalPoints,
        [heldHexKey]: { ...state.focalPoints[heldHexKey], isActive: false },
    };

    // 4. Activate a passive sibling in the same group.
    const passiveKeys = Object.entries(state.focalPoints)
        .filter(([key, fp]) => fp.group === group && !fp.isActive && key !== heldHexKey)
        .map(([key]) => key)
        .sort(); // deterministic order (lexicographic by hexKey)

    if (passiveKeys.length > 0) {
        const activateIndex = extraDieRoll % passiveKeys.length;
        const activateKey = passiveKeys[activateIndex];
        newFocalPoints = {
            ...newFocalPoints,
            [activateKey]: { ...newFocalPoints[activateKey], isActive: true },
        };
    }

    return {
        ...state,
        scores: newScores,
        dice: { ...state.dice, [heldHexKey]: newStack },
        focalPoints: newFocalPoints,
    };
}

// ---------------------------------------------------------------------------
// 6.2 — updateFocalHolders
// ---------------------------------------------------------------------------

/**
 * Snapshot called at the end of the action phase after every move.
 *
 * For every player: records the hex key of the active focal point they currently
 * control (i.e. their die is on top of an active focal point hex), or null if
 * none. This snapshot is consumed at the start of their next turn by
 * `applyFocalPhase`.
 *
 * If a player somehow controls more than one active focal point (impossible on
 * the default board but possible on custom maps), the last one wins — in
 * practice this edge case should not arise with well-formed board definitions
 * where only one hex per group is active at a time.
 *
 * @param {import("./gameState.js").GameState} state
 * @returns {import("./gameState.js").GameState}
 */
export function updateFocalHolders(state) {
    const newHolders = {};
    for (const player of state.players) {
        newHolders[player] = null;
    }

    for (const [hexKey, fp] of Object.entries(state.focalPoints)) {
        if (!fp.isActive) continue;
        const controller = getController(state, hexKey);
        if (controller !== null) {
            newHolders[controller] = hexKey;
        }
    }

    return {
        ...state,
        activeFocalHolders: newHolders,
    };
}
