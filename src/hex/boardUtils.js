import { hexKey } from './hexUtils.js';
import { BOARD_HEX_SET } from './boardConstants.js';

/**
 * Returns true if the given hex is within the 61-field board.
 * @param {{q: number, r: number, s: number}} hex
 * @returns {boolean}
 */
export function isOnBoard(hex) {
    return BOARD_HEX_SET.has(hexKey(hex));
}