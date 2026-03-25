/**
 * Phase 5.1 — Combat eligibility
 *
 * All functions are pure — they read GameState but never mutate it.
 * hexKey format: "q,r,s" (produced by hexUtils.hexKey)
 */

import { getController, getAttackStrength, getTowerSize } from './gameState.js';

// ---------------------------------------------------------------------------
// 5.1 — canAttack / getAvailableCombatOptions
// ---------------------------------------------------------------------------

/**
 * Returns true if the formation at `attackerHex` can legally attack `defenderHex`.
 *
 * Attack is only legal when the attacker's attack strength strictly exceeds the
 * defender's attack strength (computed symmetrically with the same formula).
 * A die with attack strength ≤ 1 cannot attack.
 *
 * @param {import('./gameState.js').GameState} state
 * @param {string} attackerHex  - hexKey of the attacking formation
 * @param {string} defenderHex  - hexKey of the defending formation
 * @returns {boolean}
 */
export function canAttack(state, attackerHex, defenderHex) {
    const attackStrength = getAttackStrength(state, attackerHex);
    const defenseStrength = getAttackStrength(state, defenderHex);
    return attackStrength > defenseStrength;
}

/**
 * Returns the list of combat options available for the pending combat in `state.combat`.
 *
 * Rules:
 * - **Push** is always an option.
 * - **Occupy** is available only when the attacker is a lone die (no tower) and when
 *   the target is also a lone die or is an enemy-only tower — i.e. the result would be
 *   a valid mixed tower (attacker's die on top with higher attack strength than the
 *   current formation). When Move Whole Tower triggered the combat, occupy is never
 *   available (push only).
 *
 * Per plan section 5.1: tower-vs-tower move allows push only.
 *
 * @param {import('./gameState.js').GameState} state
 * @returns {Array<'push'|'occupy'>}
 */
export function getAvailableCombatOptions(state) {
    const combat = state.combat;
    if (!combat) return [];

    const { attackerHex, defenderHex } = combat;

    // If the combat was initiated by a whole-tower move, push only.
    if (combat.towerMove) return ['push'];

    const attackerSize = getTowerSize(state, attackerHex);
    const defenderSize = getTowerSize(state, defenderHex);

    // Tower-vs-tower: push only.
    if (attackerSize > 1 && defenderSize > 1) return ['push'];

    // Attacker must be the controller of the hex (top die) — always true here — and
    // occupy requires the attacker's die to enter the defender's tower, which is only
    // legal when the attacker (after entering) would sit on top with higher attack
    // strength. Because canAttack already passed (attacker > defender), occupy is legal.
    const attackerController = getController(state, attackerHex);
    const defenderController = getController(state, defenderHex);
    if (attackerController === null || defenderController === null) return ['push'];

    return ['push', 'occupy'];
}
