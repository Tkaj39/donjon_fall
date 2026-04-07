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
 * @param {function(): void} [props.onClick]               - Click handler; cursor becomes pointer when provided.
 * @returns {JSX.Element}
 */
export function HexTile({ coords, centerX, centerY, size, fieldProperties = [], diceStack = [], highlight = null, isSelected = false, playerColors = {}, isActiveFocalPoint = false, directionPicker = null, themeImageHref = null, onClick }) {
    const corners = hexCorners(centerX, centerY, size);
    const points = corners.map(({ x, y }) => `${x},${y}`).join(" ");

    const startingProp = fieldProperties.find(p => p.type === "startingField");
    const isFocalPoint = fieldProperties.some(p => p.type === "focalPoint");

    // Use image texture whenever available; override with colour only for highlights/selected.
    const hasTexture = themeImageHref && !highlight && !isSelected;

    let fill = "var(--color-hex-default)";
    if (startingProp) fill = playerColors[startingProp.owner]?.tint ?? "var(--color-hex-starting)";
    if (isFocalPoint) fill = "var(--color-hex-focal)";
    if (highlight)    fill = HIGHLIGHT_FILL[highlight] ?? fill;
    if (isSelected)   fill = "var(--color-hex-selected)";
    // When texture is active, polygon serves only as stroke border.
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
            style={{ cursor: onClick ? "pointer" : "default" }}
            onClick={onClick ? () => onClick(hexKey(coords)) : undefined}
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
                strokeWidth={1.5}
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
                    style={{ pointerEvents: "none" }}
                />
            )}
            {hasTexture && (
                <polygon
                    points={points}
                    fill="none"
                    stroke="var(--color-hex-stroke)"
                    strokeWidth={1.5}
                    style={{ pointerEvents: "none" }}
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
        </g>
    );
}
