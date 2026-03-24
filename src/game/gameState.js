/**
 * Game State Data Structures (Phase 2.1)
 *
 * All game state is plain JS objects — no classes.
 * hexKey format: "q,r,s"
 */

/**
 * @typedef {Object} Die
 * @property {string} owner   - Player ID (e.g. 'red', 'blue')
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
 * @property {Array<'push'|'occupy'>} options
 */

/**
 * @typedef {Object} GameState
 * @property {string[]}                          players            - Ordered list of player IDs
 * @property {string}                            currentPlayer      - Active player ID
 * @property {'focal'|'action'|'combat'|'victory'} phase            - Current turn phase
 * @property {Object.<string, Die[]>}            dice               - hexKey → Die[]
 * @property {Object.<string, FocalPointState>}  focalPoints        - hexKey → FocalPointState
 * @property {Object.<string, number>}           scores             - playerId → VP count
 * @property {Object.<string, string|null>}      activeFocalHolders - playerId → hexKey|null
 * @property {CombatState|null}                  combat             - Set when combat needs to be resolved, null otherwise
 * @property {boolean}                           actionTaken        - Whether the current player has used their one action this turn
 */
