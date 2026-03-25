/**
 * HexTile component — renders a single SVG hexagon with dice stack overlay.
 * Phase 4 — Board visualization.
 */

import { hexCorners, hexKey } from '../hex/hexUtils.js';
import { Die } from './Die.jsx';

/** Highlight-type to CSS variable name mapping. */
const HIGHLIGHT_FILL = {
    reachable:         'var(--color-hex-reachable)',
    selected:          'var(--color-hex-highlighted)',
    trajectory:        'var(--color-hex-trajectory)',
    'enemy-reachable': 'var(--color-hex-enemy-reachable)',
};

/** Focal point marker circle radius as a fraction of hex size. */
const FOCAL_MARKER_RATIO = 0.18;

/** Vertical spacing between stacked dice as a fraction of hex size. */
const STACK_OFFSET_RATIO = 0.22;

/**
 * Renders a single pointy-top SVG hexagon with optional dice stack overlay.
 *
 * @param {{q:number,r:number,s:number}} props.coords      - Cube coordinates of this hex.
 * @param {number}   props.centerX                         - Pixel x of hex centre.
 * @param {number}   props.centerY                         - Pixel y of hex centre.
 * @param {number}   props.size                            - Circumradius in pixels.
 * @param {Array<{type:string}>} props.fieldProperties     - Static field properties from BOARD_FIELDS.
 * @param {import('../game/gameState.jsx').Die[]} props.diceStack - Dice at this hex (bottom → top).
 * @param {'reachable'|'selected'|'trajectory'|'enemy-reachable'|null} props.highlight - Visual overlay type.
 * @param {boolean}  props.isSelected                      - Whether the player has selected this hex.
 * @param {Object.<string,{primary:string,tint:string}>} [props.playerColors]
 *   Map of owner ID → colour pair; controls die body colour and base-hex tint.
 * @param {function(): void} [props.onClick]               - Click handler; cursor becomes pointer when provided.
 * @returns {JSX.Element}
 */
export function HexTile({ coords, centerX, centerY, size, fieldProperties = [], diceStack = [], highlight = null, isSelected = false, playerColors = {}, onClick }) {
    const corners = hexCorners(centerX, centerY, size);
    const points = corners.map(({ x, y }) => `${x},${y}`).join(' ');

    const startingProp = fieldProperties.find(p => p.type === 'startingField');
    const isFocalPoint = fieldProperties.some(p => p.type === 'focalPoint');

    let fill = 'var(--color-hex-default)';
    if (startingProp) fill = playerColors[startingProp.owner]?.tint ?? 'var(--color-hex-starting)';
    if (isFocalPoint) fill = 'var(--color-hex-focal)';
    if (highlight)    fill = HIGHLIGHT_FILL[highlight] ?? fill;
    if (isSelected)   fill = 'var(--color-hex-selected)';

    return (
        <g
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick ? () => onClick(hexKey(coords)) : undefined}
        >
            <polygon
                points={points}
                fill={fill}
                stroke="var(--color-hex-stroke)"
                strokeWidth={1.5}
            />
            {isFocalPoint && (
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={size * FOCAL_MARKER_RATIO}
                    fill="var(--color-focal-marker)"
                    opacity={0.6}
                />
            )}
            {diceStack.map((die, index) => {
                const isTop = index === diceStack.length - 1;
                const stackOffsetY = (diceStack.length - 1 - index) * (size * STACK_OFFSET_RATIO);
                const color = playerColors[die.owner]?.primary ?? 'var(--color-die-default)';
                return (
                    <Die
                        key={index}
                        cx={centerX}
                        cy={centerY - stackOffsetY}
                        hexSize={size}
                        value={die.value}
                        color={color}
                        isTop={isTop}
                    />
                );
            })}
        </g>
    );
}

