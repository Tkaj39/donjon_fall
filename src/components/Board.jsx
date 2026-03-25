/**
 * Board component — renders all 61 board hexes inside an SVG element.
 * Phase 4 — Board visualization.
 */

import { BOARD_HEXES, BOARD_FIELDS } from '../hex/boardConstants.js';
import { hexToPixel, hexKey } from '../hex/hexUtils.js';
import { HexTile } from './HexTile.jsx';

const HEX_SIZE = 36;

/** Pre-computed pixel centres of every hex. */
const PIXELS = BOARD_HEXES.map(h => hexToPixel(h, HEX_SIZE));

const minX = Math.min(...PIXELS.map(p => p.x));
const maxX = Math.max(...PIXELS.map(p => p.x));
const minY = Math.min(...PIXELS.map(p => p.y));
const maxY = Math.max(...PIXELS.map(p => p.y));

/** Extra space around the board so edge hexes are never clipped by the SVG boundary. */
const BOARD_PADDING = HEX_SIZE * 1.2;

const SVG_WIDTH  = maxX - minX + BOARD_PADDING * 2;
const SVG_HEIGHT = maxY - minY + BOARD_PADDING * 2;

/** Shifts hex pixel coords so the leftmost/topmost center lands at BOARD_PADDING. */
const OFFSET_X = -minX + BOARD_PADDING;
const OFFSET_Y = -minY + BOARD_PADDING;

/** Static field-properties lookup: hexKey → HexField.properties[]. */
const FIELD_PROPS_BY_KEY = Object.fromEntries(
    BOARD_FIELDS.map(field => [hexKey(field.coords), field.properties])
);

/**
 * Renders all 61 board hexes inside an SVG element.
 *
 * @param {import('../game/gameState.jsx').GameState|null} props.state - Current game state; null renders an empty board.
 * @param {string|null}    props.selectedHex     - hexKey of the currently selected hex, or null.
 * @param {Object.<string,'reachable'|'selected'|'trajectory'|'enemy-reachable'>} props.highlightedHexes
 *   Map of hexKey → highlight type for all hexes that should be visually marked.
 * @param {function(string): void} [props.onHexClick] - Called with the hexKey when a hex is clicked.
 * @returns {JSX.Element}
 */
export function Board({ state = null, selectedHex = null, highlightedHexes = {}, onHexClick }) {
    const dice = state?.dice ?? {};

    return (
        <svg
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            style={{ display: 'block', margin: '0 auto' }}
        >
            {BOARD_HEXES.map(hex => {
                const key = hexKey(hex);
                const { x, y } = hexToPixel(hex, HEX_SIZE);

                return (
                    <HexTile
                        key={key}
                        coords={hex}
                        centerX={x + OFFSET_X}
                        centerY={y + OFFSET_Y}
                        size={HEX_SIZE - 1}
                        fieldProperties={FIELD_PROPS_BY_KEY[key] ?? []}
                        diceStack={dice[key] ?? []}
                        highlight={highlightedHexes[key] ?? null}
                        isSelected={selectedHex === key}
                        onClick={onHexClick}
                    />
                );
            })}
        </svg>
    );
}

