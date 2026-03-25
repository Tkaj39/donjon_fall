/**
 * Board component — renders all 61 board hexes inside an SVG element.
 * Phase 4 — Board visualization.
 */

import { BOARD_HEXES, BOARD_FIELDS } from '../hex/boardConstants.js';
import { hexToPixel, hexKey } from '../hex/hexUtils.js';
import { HexTile } from './HexTile.jsx';

/** Circumradius in pixels for each hex tile. */
const HEX_SIZE = 36;

/** Padding multiplier for extra space around the board edge. */
const PADDING_RATIO = 1.2;

/**
 * Ordered colour palette for up to 6 players.
 * Player at index 0 in state.players gets palette[0], etc.
 * `primary` — die body colour; `tint` — base-hex background tint.
 */
const PLAYER_PALETTE = [
    { primary: '#dc2626', tint: '#fca5a5' }, // red
    { primary: '#2563eb', tint: '#93c5fd' }, // blue
    { primary: '#16a34a', tint: '#86efac' }, // green
    { primary: '#d97706', tint: '#fcd34d' }, // amber
    { primary: '#9333ea', tint: '#d8b4fe' }, // purple
    { primary: '#0891b2', tint: '#67e8f9' }, // cyan
];

/**
 * Fallback playerColors derived from BOARD_FIELDS for empty-board dev rendering.
 * Owners are discovered by the order they first appear in BOARD_FIELDS properties.
 */
const DEFAULT_PLAYER_COLORS = (() => {
    const owners = [];
    for (const field of BOARD_FIELDS) {
        for (const prop of field.properties) {
            if (prop.type === 'startingField' && !owners.includes(prop.owner)) {
                owners.push(prop.owner);
            }
        }
    }
    return Object.fromEntries(owners.map((id, i) => [id, PLAYER_PALETTE[i] ?? PLAYER_PALETTE[0]]));
})();

/** Pre-computed pixel centres of every hex. */
const PIXELS = BOARD_HEXES.map(h => hexToPixel(h, HEX_SIZE));

const minX = Math.min(...PIXELS.map(p => p.x));
const maxX = Math.max(...PIXELS.map(p => p.x));
const minY = Math.min(...PIXELS.map(p => p.y));
const maxY = Math.max(...PIXELS.map(p => p.y));

/** Extra space around the board so edge hexes are never clipped by the SVG boundary. */
const BOARD_PADDING = HEX_SIZE * PADDING_RATIO;

/** Total SVG canvas width. */
const SVG_WIDTH  = maxX - minX + BOARD_PADDING * 2;

/** Total SVG canvas height. */
const SVG_HEIGHT = maxY - minY + BOARD_PADDING * 2;

/** Shifts hex pixel coords so the leftmost/topmost center lands at BOARD_PADDING. */
const OFFSET_X = -minX + BOARD_PADDING;

/** Vertical coordinate offset for hex rendering. */
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
    const focalPoints = state?.focalPoints ?? {};

    const players = state?.players ?? [];
    const playerColors = players.length > 0
        ? Object.fromEntries(players.map((id, i) => [id, PLAYER_PALETTE[i] ?? PLAYER_PALETTE[0]]))
        : DEFAULT_PLAYER_COLORS;

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
                        playerColors={playerColors}
                        isActiveFocalPoint={focalPoints[key]?.isActive ?? false}
                        onClick={onHexClick}
                    />
                );
            })}
        </svg>
    );
}

