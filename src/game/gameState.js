/**
 * Game State Data Structures (Phase 2.1)
 *
 * All game state is plain JS objects — no classes.
 * hexKey format: "q,r,s"
 */

import { hexKey as toHexKey } from "../hex/hexUtils.js";

/**
 * @typedef {Object} Die
 * @property {string} owner   - Player ID (e.g. "red", "blue")
 * @property {1|2|3|4|5|6} value
 */

/**
 * @typedef {Object} FocalPointState
 * @property {boolean} isActive
 * Arbitrary group ID copied from board definition; hexes sharing the same group belong to one logical focal point
 * group. When the active hex in a group is scored, the next active hex is chosen from the remaining passive hexes in
 * the same group.
 * @property {string}  group
 */

/**
 * @typedef {Object} CombatState
 * @property {string}   attackerHex
 * @property {string}   defenderHex
 * @property {Array<"push"|"occupy">} options
 */

/**
 * @typedef {Object} GameState
 * @property {string[]}                          players            - Ordered list of player IDs
 * @property {string}                            currentPlayer      - Active player ID
 * @property {"focal"|"action"|"combat"|"victory"} phase            - Current turn phase
 * @property {Object.<string, Die[]>}            dice               - hexKey → Die[]
 * @property {Object.<string, FocalPointState>}  focalPoints        - hexKey → FocalPointState
 * @property {Object.<string, number>}           scores             - playerId → VP count
 * @property {Object.<string, string|null>}      activeFocalHolders - playerId → hexKey|null
 * @property {CombatState|null}                  combat             - Set when combat needs to be resolved, null otherwise
 * @property {boolean}                           actionTaken        - Whether the current player has used their one action this turn
 */

// ---------------------------------------------------------------------------
// Phase 2.2 — Derived selectors
// ---------------------------------------------------------------------------

/**
 * Returns the array of dice stacked at the given hex key (bottom → top order).
 * Returns an empty array if nobody is there.
 * @param {GameState} state
 * @param {string} hexKey
 * @returns {Die[]}
 */
export function getDiceAt(state, hexKey) {
    return state.dice[hexKey] ?? [];
}

/**
 * Returns the topmost die at a hex, or null if the hex is empty.
 * @param {GameState} state
 * @param {string} hexKey
 * @returns {Die|null}
 */
export function getTopDie(state, hexKey) {
    const stack = getDiceAt(state, hexKey);
    return stack.length > 0 ? stack[stack.length - 1] : null;
}

/**
 * Returns the player ID that controls a hex (owner of the top die), or null if empty.
 * @param {GameState} state
 * @param {string} hexKey
 * @returns {string|null}
 */
export function getController(state, hexKey) {
    return getTopDie(state, hexKey)?.owner ?? null;
}

/**
 * Returns the total number of dice stacked at a hex.
 * @param {GameState} state
 * @param {string} hexKey
 * @returns {number}
 */
export function getTowerSize(state, hexKey) {
    return getDiceAt(state, hexKey).length;
}

/**
 * Returns the attack strength of the formation at a hex from the perspective of its controlling player.
 * Formula: top-die value + own-dice count − enemy-dice count.
 * Returns 0 for an empty hex.
 *
 * @param {GameState} state
 * @param {string} hexKey
 * @param {{ jumped?: boolean }} [opts]  - pass `{ jumped: true }` for a tower-jump attack;
 *                                         in that case only the top die"s face value is used
 *                                         (no own/enemy tower bonus).
 * @returns {number}
 */
export function getAttackStrength(state, hexKey, { jumped = false } = {}) {
    const stack = getDiceAt(state, hexKey);
    if (stack.length === 0) return 0;
    const top = stack[stack.length - 1];
    if (jumped) return top.value;
    const ownCount = stack.filter(d => d.owner === top.owner).length - 1; // exclude top die
    const enemyCount = stack.length - ownCount - 1; // exclude top die from total
    return top.value + ownCount - enemyCount;
}

/**
 * Returns true if `moverDie` can be placed on top of the formation at `targetHexKey`.
 * A die can enter a tower only if its attack strength (computed as if already on the target hex)
 * strictly exceeds the current top die"s attack strength at the target.
 * @param {GameState} state
 * @param {Die} moverDie
 * @param {string} targetHexKey
 * @returns {boolean}
 */
export function canEnterTower(state, moverDie, targetHexKey) {
    const stack = getDiceAt(state, targetHexKey);
    if (stack.length === 0) return true; // empty hex — always fine

    // Top die"s attack strength at the target (current state, before mover arrives)
    const topStrength = getAttackStrength(state, targetHexKey);

    // Mover"s standalone attack strength (solo die: own=1, enemy=0)
    const moverStrength = moverDie.value + 1;

    return moverStrength > topStrength;
}

/**
 * Returns true if the focal point at the given hex key is currently active.
 * Returns false for hexes that are not focal points.
 * @param {GameState} state
 * @param {string} hexKey
 * @returns {boolean}
 */
export function isFocalPointActive(state, hexKey) {
    return state.focalPoints[hexKey]?.isActive ?? false;
}

/**
 * Returns the list of hex keys of all currently active focal points.
 * @param {GameState} state
 * @returns {string[]}
 */
export function getActiveFocalPoints(state) {
    return Object.entries(state.focalPoints)
        .filter(([, fp]) => fp.isActive)
        .map(([key]) => key);
}

// ---------------------------------------------------------------------------
// Phase 2.3 — Initial state factory
// ---------------------------------------------------------------------------

/** Default starting die value (face-up value for all dice at game start). */
const DEFAULT_DIE_VALUE = 6;

/**
 * Builds the canonical starting GameState for a new game.
 *
 * @param {string[]} players        - Ordered list of player IDs (e.g. ["red", "blue"]).
 *                                    The first player takes the first turn.
 * @param {Array<{coords:{q,r,s}, properties:Array}>} boardFields
 *                                  - Full list of HexField objects describing the board.
 *                                    Each field may carry `startingField` and/or `focalPoint`
 *                                    properties (see fieldProperties.js).
 * @returns {GameState}
 */
export function createInitialState(players, boardFields, firstPlayer = null) {
    const dice = {};
    const focalPoints = {};
    const scores = {};
    const activeFocalHolders = {};

    // Initialise per-player entries
    for (const player of players) {
        scores[player] = 0;
        activeFocalHolders[player] = null;
    }

    // Place starting dice
    // Each player"s `startingField` hexes in boardFields define where their dice begin.
    // All starting dice have value DEFAULT_DIE_VALUE.
    for (const field of boardFields) {
        const startProp = field.properties.find(p => p.type === "startingField");
        if (startProp && players.includes(startProp.owner)) {
            const key = toHexKey(field.coords);
            dice[key] = [{ owner: startProp.owner, value: DEFAULT_DIE_VALUE }];
        }
    }

    // Build focal point state from board definition
    for (const field of boardFields) {
        const fpProp = field.properties.find(p => p.type === "focalPoint");
        if (fpProp) {
            const key = toHexKey(field.coords);
            focalPoints[key] = { isActive: fpProp.active, group: fpProp.group };
        }
    }

    return {
        players: [...players],
        currentPlayer: (firstPlayer && players.includes(firstPlayer)) ? firstPlayer : players[Math.floor(Math.random() * players.length)],
        phase: "focal",
        dice,
        focalPoints,
        scores,
        activeFocalHolders,
        combat: null,
        selectedHex: null,
        highlightedHexes: [],
        actionTaken: false,
    };
}
