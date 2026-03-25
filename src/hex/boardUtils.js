import { hexKey } from './hexUtils';
import { BOARD_HEX_SET } from './boardConstants';

// Returns true if the given hex is within the 61-field board.
// @param {Object} hex - {q, r, s}
export function isOnBoard(hex) {
    return BOARD_HEX_SET.has(hexKey(hex));
}