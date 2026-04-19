/**
 * HexTile component — renders a single SVG hexagon with dice stack overlay.
 * Phase 4 — Board visualization.
 */

import { hexCorners, hexKey } from "../hex/hexUtils.js";
import { Die } from "./Die.jsx";
import { DirectionPickerOverlay } from "./DirectionPickerOverlay.jsx";
import { FocalPointMarker } from "./FocalPointMarker.jsx";

/** Highlight-type to CSS variable name mapping. */
const HIGHLIGHT_FILL = {
    reachable:         "var(--color-hex-reachable)",
    selected:          "var(--color-hex-highlighted)",
    trajectory:        "var(--color-hex-trajectory)",
    "enemy-reachable": "var(--color-hex-enemy-reachable)",
};

/** Focal point marker circle radius as a fraction of hex size. */
const HEX_STROKE_WIDTH = 2.5;
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
 * @param {import("../game/gameState.js").Die[]} props.diceStack - Dice at this hex (bottom → top).
 * @param {"reachable"|"selected"|"trajectory"|"enemy-reachable"|null} props.highlight - Visual overlay type.
 * @param {boolean}  props.isSelected                      - Whether the player has selected this hex.
 * @param {Object.<string,{primary:string,tint:string}>} [props.playerColors]
 *   Map of owner ID → colour pair; controls die body colour and base-hex tint.
 * @param {boolean} [props.isActiveFocalPoint] - Whether this focal point is currently active (ignored for non-focal hexes).
 * @param {{
 *   enemyHexKey: string,
 *   validApproachKeys: Set<string>,
 *   selectedApproachKey: string|null,
 *   onApproachHover: function(string): void,
 * }|null} [props.directionPicker]
 *   When non-null, renders the Phase 12.4 approach-direction picker overlay on this hex.
 * @param {string}  [props.themeImageHref]                - Image URL stretched to fill the hex tile from the active theme. Used when no other state-driven fill applies.
 * @param {{
 *   attackStrength: number|null,
 *   focalGroup: string|null,
 *   focalActive: boolean,
 * }|null} [props.debugInfo]
 *   When non-null, renders debug overlay text on this hex (Phase 14.1).
 * @param {function(): void} [props.onClick]               - Click handler; cursor becomes pointer when provided.
 * @param {function(string|null): void} [props.onHover]    - Called with hexKey on mouse enter, null on leave.
 * @returns {JSX.Element}
 */
export function HexTile({ coords, centerX, centerY, size, fieldProperties = [], diceStack = [], highlight = null, isSelected = false, playerColors = {}, isActiveFocalPoint = false, directionPicker = null, themeImageHref = null, debugInfo = null, onClick, onHover }) {
    const corners = hexCorners(centerX, centerY, size);
    const points = corners.map(({ x, y }) => `${x},${y}`).join(" ");

    const startingProp = fieldProperties.find(p => p.type === "startingField");
    const isFocalPoint = fieldProperties.some(p => p.type === "focalPoint");

    // Always show texture if available, highlight overlays are drawn above.
    const hasTexture = !!themeImageHref;

    let fill = "var(--color-hex-default)";
    if (startingProp) fill = playerColors[startingProp.owner]?.tint ?? "var(--color-hex-starting)";
    if (isFocalPoint) fill = "var(--color-hex-focal)";
    if (isSelected)   fill = "var(--color-hex-selected)";
    // For highlight overlays, base fill is always transparent (texture shows), overlay is drawn above.
    const polygonFill = hasTexture ? "transparent" : fill;

    const clipId = `hex-clip-${hexKey(coords)}`;
    // Bounding box of the hex for the image placement.
    const imgX = centerX - size;
    const imgY = centerY - size;
    const imgSize = size * 2;

    return (
        <g
            data-hex={hexKey(coords)}
            data-highlight={highlight ?? undefined}
            className={onClick ? "cursor-pointer" : "cursor-default"}
            onClick={onClick ? () => onClick(hexKey(coords)) : undefined}
            onMouseEnter={onHover ? () => onHover(hexKey(coords)) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
        >
            {hasTexture && (
                <defs>
                    <clipPath id={clipId}>
                        <polygon points={points} />
                    </clipPath>
                </defs>
            )}
            <polygon
                points={points}
                fill={polygonFill}
                stroke="var(--color-hex-stroke)"
                strokeWidth={HEX_STROKE_WIDTH}
            />
            {hasTexture && (
                <image
                    href={themeImageHref}
                    x={imgX}
                    y={imgY}
                    width={imgSize}
                    height={imgSize}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${clipId})`}
                    className="pointer-events-none"
                />
            )}
            {hasTexture && (
                <polygon
                    points={points}
                    fill="none"
                    stroke="var(--color-hex-stroke)"
                    strokeWidth={HEX_STROKE_WIDTH}
                    className="pointer-events-none"
                />
            )}
            {/* Highlight overlay always above texture, 0.5 opacity */}
            {highlight && (
                <polygon
                    points={points}
                    fill={HIGHLIGHT_FILL[highlight]}
                    opacity={0.5}
                    className="pointer-events-none"
                />
            )}
            {isFocalPoint && isActiveFocalPoint && (
                <polygon
                    points={points}
                    fill="var(--color-focal-active)"
                    opacity={0.25}
                    className="pointer-events-none"
                />
            )}
            {isFocalPoint && (
                <FocalPointMarker
                    cx={centerX}
                    cy={centerY}
                    hexSize={size}
                    isActive={isActiveFocalPoint}
                />
            )}
            {diceStack.map((die, index) => {
                const isTop = index === diceStack.length - 1;
                const stackOffsetY = (diceStack.length - 1 - index) * (size * STACK_OFFSET_RATIO);
                const color = playerColors[die.owner]?.primary ?? "var(--color-die-default)";
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
            {directionPicker && (
                <DirectionPickerOverlay
                    cx={centerX}
                    cy={centerY}
                    size={size}
                    enemyHexKey={directionPicker.enemyHexKey}
                    validApproachKeys={directionPicker.validApproachKeys}
                    selectedApproachKey={directionPicker.selectedApproachKey}
                    onApproachHover={directionPicker.onApproachHover}
                />
            )}
            {debugInfo && (
                <>
                    <text
                        className="pointer-events-none select-none"
                        x={centerX}
                        y={centerY - size * 0.45}
                        textAnchor="middle"
                        fontSize={size * 0.22}
                        fill="var(--color-debug-coords)"
                    >
                        {`${coords.q},${coords.r},${coords.s}`}
                    </text>
                    {debugInfo.attackStrength !== null && (
                        <text
                            className="pointer-events-none select-none"
                            x={centerX}
                            y={centerY + size * 0.62}
                            textAnchor="middle"
                            fontSize={size * 0.24}
                            fill="var(--color-debug-attack)"
                        >
                            {`atk:${debugInfo.attackStrength}`}
                        </text>
                    )}
                    {debugInfo.focalGroup !== null && (
                        <text
                            className="pointer-events-none select-none"
                            x={centerX}
                            y={centerY + size * 0.5}
                            textAnchor="middle"
                            fontSize={size * 0.22}
                            fill={debugInfo.focalActive ? "var(--color-debug-focal-active)" : "var(--color-debug-focal-passive)"}
                        >
                            {`${debugInfo.focalGroup}${debugInfo.focalActive ? "(A)" : "(P)"}`}
                        </text>
                    )}
                </>
            )}
        </g>
    );
}
