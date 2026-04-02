/**
 * BoardDefinition — wraps board fields with map-level metadata.
 * Phase 9.4
 *
 * @typedef {Object} BoardDefinition
 * @property {string}   id           - Unique map identifier.
 * @property {string}   name         - Display name shown in map selection.
 * @property {import('../hex/fieldProperties.js').HexField[]} fields - All hex fields.
 * @property {number}   minPlayers   - Minimum players (derived from distinct base owners).
 * @property {number}   maxPlayers   - Maximum players (same as minPlayers for fixed maps).
 * @property {number}   victoryPoints - VP needed to win.
 */

import { BOARD_FIELDS } from '../hex/boardConstants.js';

/**
 * Derives min/max player count from the number of distinct `startingField` owners
 * defined in the given fields array.
 *
 * @param {import('../hex/fieldProperties.js').HexField[]} fields
 * @returns {{ minPlayers: number, maxPlayers: number }}
 */
function derivePlayerCount(fields) {
    const owners = new Set(
        fields
            .flatMap(f => f.properties)
            .filter(p => p.type === 'startingField')
            .map(p => p.owner),
    );
    const count = owners.size;
    return { minPlayers: count, maxPlayers: count };
}

/** The built-in default 61-hex map. */
export const DEFAULT_MAP = (() => {
    const { minPlayers, maxPlayers } = derivePlayerCount(BOARD_FIELDS);
    return /** @type {BoardDefinition} */ ({
        id:            'default',
        name:          'Classic',
        fields:        BOARD_FIELDS,
        minPlayers,
        maxPlayers,
        victoryPoints: 5,
    });
})();

/** All maps available for selection. Custom maps (Board Creator) will be appended here at runtime. */
export const ALL_MAPS = [DEFAULT_MAP];
