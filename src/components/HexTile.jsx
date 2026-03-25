/**
 * HexTile component — renders a single SVG hexagon with dice stack overlay.
 * Phase 4 — Board visualization.
 */

import { hexCorners, hexKey } from '../hex/hexUtils.js';

/** Highlight-type to CSS variable name mapping. */
const HIGHLIGHT_FILL = {
    reachable:       'var(--color-hex-reachable)',
    selected:        'var(--color-hex-highlighted)',
    trajectory:      'var(--color-hex-trajectory)',
    'enemy-reachable': 'var(--color-hex-enemy-reachable)',
};

/** Owner ID to die-fill CSS variable. */
const OWNER_DIE_FILL = {
    red:  'var(--color-die-red)',
    blue: 'var(--color-die-blue)',
};

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
 * @param {function(): void} [props.onClick]               - Click handler; cursor becomes pointer when provided.
 * @returns {JSX.Element}
 */
export function HexTile({ coords, centerX, centerY, size, fieldProperties = [], diceStack = [], highlight = null, isSelected = false, onClick }) {
    const corners = hexCorners(centerX, centerY, size);
    const points = corners.map(({ x, y }) => `${x},${y}`).join(' ');

    const isFocalPoint = fieldProperties.some(p => p.type === 'focalPoint');
    const isStartingField = fieldProperties.some(p => p.type === 'startingField');

    let fill = 'var(--color-hex-default)';
    if (isStartingField) fill = 'var(--color-hex-starting)';
    if (isFocalPoint)    fill = 'var(--color-hex-focal)';
    if (highlight)       fill = HIGHLIGHT_FILL[highlight] ?? fill;
    if (isSelected)      fill = 'var(--color-hex-selected)';

    /**
     * Renders a single die as a coloured circle with a value label (Phase 4.2 will replace this).
     *
     * @param {import('../game/gameState.jsx').Die} die - The die object to render.
     * @param {number} index - Position in the stack (0 = bottom).
     * @returns {JSX.Element}
     */
    function renderDie(die, index) {
        const dieFill = OWNER_DIE_FILL[die.owner] ?? 'var(--color-die-default)';
        const stackOffsetY = (diceStack.length - 1 - index) * (size * 0.22);
        const dieR = size * 0.28;
        return (
            <g key={index} transform={`translate(0, ${-stackOffsetY})`}>
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={dieR}
                    fill={dieFill}
                    stroke="var(--color-hex-stroke)"
                    strokeWidth={1}
                    opacity={index === diceStack.length - 1 ? 1 : 0.55}
                />
                <text
                    x={centerX}
                    y={centerY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={dieR * 1.1}
                    fontWeight="bold"
                    fill="white"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                    {die.value}
                </text>
            </g>
        );
    }

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
                    r={size * 0.18}
                    fill="var(--color-focal-marker)"
                    opacity={0.6}
                />
            )}
            {diceStack.map(renderDie)}
        </g>
    );
}

