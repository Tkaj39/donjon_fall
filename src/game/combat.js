/**
 * Phase 5.1 — Combat eligibility
 * Phase 5.2 — Push resolution
 * Phase 5.3 — Occupy resolution
 *
 * All functions are pure — they read GameState but never mutate it.
 * hexKey format: "q,r,s" (produced by hexUtils.hexKey)
 */

import { hexKey, hexFromKey } from "../hex/hexUtils.js";
import { isOnBoard } from "../hex/boardUtils.js";
import { getDiceAt, getController, getAttackStrength, getTowerSize } from "./gameState.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Minimum value a die can have (used as floor when decreasing die values).
 * @constant {number}
 */
const MIN_DIE_VALUE = 1;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Computes the unit cube direction vector pointing from `fromCoords` to `toCoords`.
 * The two hexes must be exactly 1 step apart.
 *
 * @param {{q: number, r: number, s: number}} fromCoords
 * @param {{q: number, r: number, s: number}} toCoords
 * @returns {{q: number, r: number, s: number}}
 */
function cubeDelta(fromCoords, toCoords) {
    return {
        q: toCoords.q - fromCoords.q,
        r: toCoords.r - fromCoords.r,
        s: toCoords.s - fromCoords.s,
    };
}

/**
 * Returns a new dice map with the entry at `key` removed if the resulting stack
 * would be empty, or updated to `newStack` otherwise.
 *
 * @param {Object.<string, import("./gameState.js").Die[]>} dice
 * @param {string} key
 * @param {import("./gameState.js").Die[]} newStack
 * @returns {Object.<string, import("./gameState.js").Die[]>}
 */
function setStack(dice, key, newStack) {
    const next = { ...dice };
    if (newStack.length === 0) {
        delete next[key];
    } else {
        next[key] = newStack;
    }
    return next;
}

// ---------------------------------------------------------------------------
// 5.1 — canAttack / getAvailableCombatOptions
// ---------------------------------------------------------------------------

/**
 * Returns true if the formation at `attackerHex` can legally attack `defenderHex`.
 *
 * Attack is only legal when the attacker"s attack strength strictly exceeds the
 * defender"s attack strength (computed symmetrically with the same formula).
 * A die with attack strength ≤ 1 cannot attack.
 *
 * @param {import("./gameState.js").GameState} state
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
 *   a valid mixed tower (attacker"s die on top with higher attack strength than the
 *   current formation). When Move Whole Tower triggered the combat, occupy is never
 *   available (push only).
 *
 * Per plan section 5.1: tower-vs-tower move allows push only.
 *
 * @param {import("./gameState.js").GameState} state
 * @returns {Array<"push"|"occupy">}
 */
export function getAvailableCombatOptions(state) {
    const combat = state.combat;
    if (!combat) return [];

    const { attackerHex, defenderHex } = combat;

    // If the combat was initiated by a whole-tower move, push only.
    if (combat.towerMove) return ["push"];

    const attackerSize = getTowerSize(state, attackerHex);
    const defenderSize = getTowerSize(state, defenderHex);

    // Tower-vs-tower: push only.
    if (attackerSize > 1 && defenderSize > 1) return ["push"];

    // Attacker must be the controller of the hex (top die) — always true here — and
    // occupy requires the attacker"s die to enter the defender"s tower, which is only
    // legal when the attacker (after entering) would sit on top with higher attack
    // strength. Because canAttack already passed (attacker > defender), occupy is legal.
    const attackerController = getController(state, attackerHex);
    const defenderController = getController(state, defenderHex);
    if (attackerController === null || defenderController === null) return ["push"];

    return ["push", "occupy"];
}

// ---------------------------------------------------------------------------
// 5.2 — Push resolution
// ---------------------------------------------------------------------------

/**
 * Returns the cube direction vector pointing from the attacker"s approach hex
 * toward the defender hex, representing the push direction.
 *
 * `approachHex` is the hexKey of the last step the attacker took before
 * landing on `defenderHex` (i.e., `combat.approachDirection`). If not
 * available, `attackerHex` is used as a fallback (valid when attacker and
 * defender are exactly 1 step apart).
 *
 * @param {string} approachHex  - hexKey of the hex from which the attack arrives
 * @param {string} defenderHex  - hexKey of the defending formation
 * @returns {{q: number, r: number, s: number}}
 */
export function getPushDirection(approachHex, defenderHex) {
    return cubeDelta(hexFromKey(approachHex), hexFromKey(defenderHex));
}

/**
 * Returns the ordered list of hexKeys of formations that would be pushed when
 * `defenderHex` is pushed in `direction`. The list starts with `defenderHex`
 * and continues with each successive occupied hex in the push direction until
 * an empty hex, an off-board position, or the attacker"s own formation is
 * encountered.
 *
 * The returned array contains only hexKeys of occupied positions; the
 * terminating condition (empty / off-map / own unit) is NOT included.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} defenderHex           - hexKey where the chain starts
 * @param {{q: number, r: number, s: number}} direction
 * @returns {string[]}
 */
export function getPushChain(state, defenderHex, direction) {
    const attackerOwner = getController(state, state.combat?.attackerHex);
    const chain = [];
    let current = hexFromKey(defenderHex);

    while (true) {
        const key = hexKey(current);
        const stack = getDiceAt(state, key);

        if (stack.length === 0) break;          // empty hex — end of chain
        const ctrl = getController(state, key);
        if (ctrl === attackerOwner) break;       // own unit — encirclement boundary

        chain.push(key);

        // Step further in push direction
        current = { q: current.q + direction.q, r: current.r + direction.r, s: current.s + direction.s };
    }

    return chain;
}

/**
 * Returns true when the push action can be performed for the formation at
 * `defenderHex` pushed in `direction`.
 *
 * Push is always physically possible: the hex one step past the last formation
 * in the chain is either empty (safe retreat), off-board (destruction), or
 * occupied by the attacker"s own formation (encirclement / destruction). None of
 * these block the push — the only precondition is that a formation actually
 * exists at `defenderHex`.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} defenderHex
 * @param {{q: number, r: number, s: number}} _direction  - unused, kept for API symmetry
 * @returns {boolean}
 */
export function canPush(state, defenderHex, _direction) {
    return getDiceAt(state, defenderHex).length > 0;
}

/**
 * Applies the push combat resolution and returns new game state.
 *
 * Steps performed:
 * 1. Determine push direction from `combat.approachDirection` (or fallback to
 *    direction from `attackerHex` to `defenderHex`).
 * 2. Build push chain via `getPushChain`.
 * 3. Move each formation one hex in the push direction (back-to-front to avoid
 *    overwriting).
 * 4. The last formation in the chain may be destroyed if its destination is
 *    off-board (off the map) or occupied by the attacker"s own formation
 *    (encirclement). Attacker scores 1 point per destroyed enemy die.
 * 5. Reroll one die in the first (immediate) defender"s formation:
 *    new value = min(rerollValue, original) — defender cannot become stronger.
 * 6. Attacker"s top die value decreases by 1 (minimum 1).
 * 7. Phase returns to "action" (or "victory" check is handled by the caller).
 *
 * @param {import("./gameState.js").GameState} state
 * @param {number} rerollValue  - 1..6 random value for defender"s die reroll (pass for purity)
 * @returns {import("./gameState.js").GameState}
 */
export function applyPush(state, rerollValue) {
    const { attackerHex, defenderHex, approachDirection } = state.combat;

    // Determine push direction
    const approachKey = approachDirection ?? attackerHex;
    const direction = getPushDirection(approachKey, defenderHex);

    const chain = getPushChain(state, defenderHex, direction);
    if (chain.length === 0) return state; // nothing to push

    const attackerOwner = getController(state, attackerHex);
    let dice = { ...state.dice };
    let scores = { ...state.scores };

    // Check destination of the LAST formation in the chain
    const lastKey = chain[chain.length - 1];
    const lastCoords = hexFromKey(lastKey);
    const destCoords = {
        q: lastCoords.q + direction.q,
        r: lastCoords.r + direction.r,
        s: lastCoords.s + direction.s,
    };
    const destKey = hexKey(destCoords);
    const destOnBoard = isOnBoard(destCoords);
    const destOwnUnit = destOnBoard && getController({ ...state, dice }, destKey) === attackerOwner;

    const lastDestroyed = !destOnBoard || destOwnUnit;

    // Move formations back-to-front (prevent overwriting)
    for (let i = chain.length - 1; i >= 0; i--) {
        const fromKey = chain[i];
        const fromCoords = hexFromKey(fromKey);
        const toCoords = {
            q: fromCoords.q + direction.q,
            r: fromCoords.r + direction.r,
            s: fromCoords.s + direction.s,
        };
        const toKey = hexKey(toCoords);

        // The last formation: destroyed if off-map or encircled
        if (i === chain.length - 1 && lastDestroyed) {
            const destroyedStack = getDiceAt({ ...state, dice }, fromKey);
            const enemyCount = destroyedStack.filter(d => d.owner !== attackerOwner).length;
            scores = {
                ...scores,
                [attackerOwner]: (scores[attackerOwner] ?? 0) + enemyCount,
            };
            dice = setStack(dice, fromKey, []);
            continue;
        }

        // Normal move: shift formation one step
        const movingStack = getDiceAt({ ...state, dice }, fromKey);
        dice = setStack(dice, fromKey, []);
        dice = setStack(dice, toKey, movingStack);
    }

    // Apply defender die reroll to ONE die in the immediate defender"s new position.
    // The defender formation moved to defenderHex + direction (unless destroyed).
    if (!lastDestroyed || chain.length > 1) {
        // The immediate defender (chain[0]) always survives (it"s only the last that can die)
        const defenderNewCoords = hexFromKey(chain[0]);
        const defenderNewKey = hexKey({
            q: defenderNewCoords.q + direction.q,
            r: defenderNewCoords.r + direction.r,
            s: defenderNewCoords.s + direction.s,
        });
        const defStack = getDiceAt({ ...state, dice }, defenderNewKey);
        if (defStack.length > 0) {
            // Reroll the top die of the defender formation; new value ≤ original (defender cannot grow)
            const topIdx = defStack.length - 1;
            const original = defStack[topIdx].value;
            const newValue = Math.min(rerollValue, original);
            const newDefStack = defStack.map((d, idx) =>
                idx === topIdx ? { ...d, value: newValue } : d
            );
            dice = setStack(dice, defenderNewKey, newDefStack);
        }
    }

    // Attacker"s top die decreases by 1 (minimum = MIN_DIE_VALUE)
    const attackerStack = getDiceAt({ ...state, dice }, attackerHex);
    if (attackerStack.length > 0) {
        const topIdx = attackerStack.length - 1;
        const newValue = Math.max(MIN_DIE_VALUE, attackerStack[topIdx].value - 1);
        const newAttackerStack = attackerStack.map((d, idx) =>
            idx === topIdx ? { ...d, value: newValue } : d
        );
        dice = setStack(dice, attackerHex, newAttackerStack);
    }

    return {
        ...state,
        dice,
        scores,
        combat: null,
        phase: "action",
    };
}

// ---------------------------------------------------------------------------
// 5.3 — Occupy resolution
// ---------------------------------------------------------------------------

/**
 * Applies the occupy combat resolution and returns new game state.
 *
 * Steps performed:
 * 1. The attacker"s top die is physically moved on top of the defender"s formation
 *    (mixed tower; attacker controls from the top).
 * 2. Attacker"s top die value decreases by 1 (minimum 1).
 * 3. Defender"s dice are not rerolled.
 * 4. Phase returns to "action".
 *
 * @param {import("./gameState.js").GameState} state
 * @returns {import("./gameState.js").GameState}
 */
export function applyOccupy(state) {
    const { attackerHex, defenderHex } = state.combat;

    // Move attacker"s top die onto the defender"s stack
    const attackerStack = getDiceAt(state, attackerHex);
    if (attackerStack.length === 0) return state;

    const topDie = attackerStack[attackerStack.length - 1];
    const newValue = Math.max(MIN_DIE_VALUE, topDie.value - 1);
    const movedDie = { ...topDie, value: newValue };

    const newAttackerStack = attackerStack.slice(0, -1);
    const defenderStack = getDiceAt(state, defenderHex);
    const newDefenderStack = [...defenderStack, movedDie];

    let dice = { ...state.dice };
    dice = setStack(dice, attackerHex, newAttackerStack);
    dice = setStack(dice, defenderHex, newDefenderStack);

    return {
        ...state,
        dice,
        combat: null,
        phase: "action"
    };
}
