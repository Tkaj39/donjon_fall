/**
 * Turn & Phase Management (Phase 7.1 + 7.2)
 *
 * Pure functions that control phase transitions, turn advancement, and
 * legal-move detection. No randomness here — roll values are injected
 * by callers so these functions remain deterministic and testable.
 */

import { getController } from "./gameState.js";
import { updateFocalHolders } from "./focal.js";

/** Victory-point threshold required to win. */
export const VICTORY_POINTS = 5;

// ---------------------------------------------------------------------------
// 7.1 — advancePhase
// ---------------------------------------------------------------------------

/**
 * Advances the game to the next phase following the rules" phase order:
 *
 * ```
 * focal  → victory (when current player reached VICTORY_POINTS after focal scoring)
 *        → action
 * action → combat  (when combat is pending in state.combat)
 *        → victory (when current player reached VICTORY_POINTS)
 *        → focal   (next player"s turn, via endTurn)
 * combat → victory (when current player reached VICTORY_POINTS)
 *        → focal   (next player"s turn, via endTurn)
 * victory → (no-op, game is over)
 * ```
 *
 * Called by the game reducer after the current phase"s work is complete.
 * For the `action → combat` case, combat state has already been set by
 * `applyMoveAction` / `applyMoveTowerAction`; `advancePhase` simply
 * formalises the transition.
 *
 * @param {import("./gameState.js").GameState} state
 * @returns {import("./gameState.js").GameState}
 */
export function advancePhase(state) {
    switch (state.phase) {
        case "focal":
            if ((state.scores[state.currentPlayer] ?? 0) >= VICTORY_POINTS) {
                return { ...state, phase: "victory" };
            }
            return { ...state, phase: "action" };

        case "action": {
            if (state.combat !== null) {
                return { ...state, phase: "combat" };
            }
            if ((state.scores[state.currentPlayer] ?? 0) >= VICTORY_POINTS) {
                return { ...state, phase: "victory" };
            }
            return endTurn(state);
        }

        case "combat": {
            if ((state.scores[state.currentPlayer] ?? 0) >= VICTORY_POINTS) {
                return { ...state, phase: "victory" };
            }
            return endTurn(state);
        }

        case "victory":
            return state; // game over — no further transitions

        default:
            return state;
    }
}

// ---------------------------------------------------------------------------
// 7.1 — endTurn
// ---------------------------------------------------------------------------

/**
 * Ends the current player"s turn:
 *  1. Snapshots active focal-point holders via `updateFocalHolders`.
 *  2. Advances `currentPlayer` to the next player in `state.players` (wrap around).
 *  3. Resets all per-turn flags: `actionTaken`, `combat`, `selectedHex`, `highlightedHexes`.
 *  4. Sets `phase` to `"focal"` so the next player starts with the focal phase.
 *
 * @param {import("./gameState.js").GameState} state
 * @returns {import("./gameState.js").GameState}
 */
export function endTurn(state) {
    const afterSnapshot = updateFocalHolders(state);

    const idx = state.players.indexOf(state.currentPlayer);
    const nextPlayer = state.players[(idx + 1) % state.players.length];

    return {
        ...afterSnapshot,
        currentPlayer: nextPlayer,
        phase: "focal",
        actionTaken: false,
        combat: null,
        selectedHex: null,
        highlightedHexes: [],
    };
}

// ---------------------------------------------------------------------------
// 7.2 — hasLegalMoves
// ---------------------------------------------------------------------------

/**
 * Returns `false` when the current player has no legal action available,
 * triggering the sudden-death loss condition.
 *
 * A player has at least one legal move when their die is on top of any field
 * (standalone or as the top die of a tower) — because the **Reroll** action is
 * always available to any controlled die, regardless of position.
 *
 * If every one of the current player"s dice is buried beneath an enemy die in a
 * mixed tower, they control no field and have no legal actions.
 *
 * @param {import("./gameState.js").GameState} state
 * @returns {boolean}
 */
export function hasLegalMoves(state) {
    return Object.keys(state.dice).some(
        key => state.dice[key].length > 0 && getController(state, key) === state.currentPlayer
    );
}
