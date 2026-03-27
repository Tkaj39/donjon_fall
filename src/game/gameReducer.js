/**
 * Game Reducer (Phase 11.1)
 *
 * Central reducer that handles all game actions. All side-effects (randomness)
 * are injected via the action payload — the reducer itself is a pure function.
 *
 * Action types and their payloads:
 *
 *   ADVANCE_FOCAL_PHASE  { dieNewValue: number, extraDieRoll: number }
 *     — Processes focal-point scoring (may be no-op when player held no focal
 *       point last turn), then advances phase focal → action.
 *
 *   MOVE_DIE             { fromHex: string, toHex: string, approachDirection?: string }
 *   MOVE_TOWER           { fromHex: string, toHex: string, approachDirection?: string }
 *   JUMP                 { towerHex: string, targetHex: string, approachDirection?: string }
 *   COLLAPSE             { hex: string }
 *   REROLL               { hex: string, newValue: number }
 *     — Perform the chosen action and mark actionTaken: true.
 *       Moves that end on an enemy automatically enter the 'combat' phase.
 *
 *   CHOOSE_COMBAT_OPTION { option: 'push'|'occupy', rerollValue?: number }
 *     — Resolves pending combat, then advances phase.
 *       rerollValue is required when option === 'push'.
 *
 *   CONFIRM_ACTION       {}
 *     — Advances the current phase after a non-combat action:
 *       action → victory (if player has ≥ 5 VP) or → endTurn → focal (next player).
 *
 *   END_TURN             {}
 *     — Directly ends the current player's turn and starts the next player's
 *       focal phase (convenience escape hatch; CONFIRM_ACTION is preferred).
 */

import {
    applyMoveAction,
    applyMoveTowerAction,
    applyJumpAction,
    applyCollapseAction,
    applyRerollAction,
} from './movement.js';
import { applyPush, applyOccupy } from './combat.js';
import { applyFocalPhase } from './focal.js';
import { advancePhase, endTurn } from './turnManager.js';

// ---------------------------------------------------------------------------
// 11.1 — gameReducer
// ---------------------------------------------------------------------------

/**
 * Central game reducer.
 *
 * @param {import('./gameState.js').GameState} state
 * @param {{ type: string, [key: string]: any }} action
 * @returns {import('./gameState.js').GameState}
 */
export function gameReducer(state, action) {
    switch (action.type) {

        // ------------------------------------------------------------------
        // Focal phase — runs at the start of each player's turn.
        // ------------------------------------------------------------------
        case 'ADVANCE_FOCAL_PHASE': {
            const afterFocal = applyFocalPhase(
                state,
                action.dieNewValue,
                action.extraDieRoll,
            );
            return advancePhase(afterFocal);
        }

        // ------------------------------------------------------------------
        // Movement actions — the player's one action per turn.
        // ------------------------------------------------------------------
        case 'MOVE_DIE': {
            const next = applyMoveAction(
                state,
                action.fromHex,
                action.toHex,
                action.approachDirection ?? null,
            );
            return { ...next, actionTaken: true };
        }

        case 'MOVE_TOWER': {
            const next = applyMoveTowerAction(
                state,
                action.fromHex,
                action.toHex,
                action.approachDirection ?? null,
            );
            return { ...next, actionTaken: true };
        }

        case 'JUMP': {
            const next = applyJumpAction(
                state,
                action.towerHex,
                action.targetHex,
                action.approachDirection ?? null,
            );
            return { ...next, actionTaken: true };
        }

        case 'COLLAPSE': {
            const next = applyCollapseAction(state, action.hex);
            return { ...next, actionTaken: true };
        }

        case 'REROLL': {
            const next = applyRerollAction(state, action.hex, action.newValue);
            return { ...next, actionTaken: true };
        }

        // ------------------------------------------------------------------
        // Combat resolution — player chooses push or occupy.
        // ------------------------------------------------------------------
        case 'CHOOSE_COMBAT_OPTION': {
            if (action.option === 'push') {
                const afterPush = applyPush(state, action.rerollValue);
                return advancePhase(afterPush);
            }
            if (action.option === 'occupy') {
                const afterOccupy = applyOccupy(state);
                return advancePhase(afterOccupy);
            }
            return state;
        }

        // ------------------------------------------------------------------
        // Phase / turn advancement.
        // ------------------------------------------------------------------
        case 'CONFIRM_ACTION':
            return advancePhase(state);

        case 'END_TURN':
            return endTurn(state);

        default:
            return state;
    }
}
