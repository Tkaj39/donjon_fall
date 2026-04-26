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
    dimmed:            "var(--color-hex-dimmed)",
};

/** Focal point marker circle radius as a fraction of hex size. */
const HEX_STROKE_WIDTH = 1;
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
export function HexTile({ coords, centerX, centerY, size, fieldProperties = [], diceStack = [], highlight = null, isSelected = false, playerColors = {}, isActiveFocalPoint = false, directionPicker = null, themeImageHref = null, themeImageVariant = null, debugInfo = null, onClick, onHover }) {
    const corners = hexCorners(centerX, centerY, size);
    const points = corners.map(({ x, y }) => `${x},${y}`).join(" ");

    const startingProp = fieldProperties.find(p => p.type === "startingField");
    const isFocalPoint = fieldProperties.some(p => p.type === "focalPoint");

    // Always show texture if available, highlight overlays are drawn above.
    const hasTexture = !!themeImageHref;

    let fill = "var(--color-hex-default)";
    if (startingProp) fill = playerColors[startingProp.owner]?.tint ?? playerColors.default?.tint ?? "#d1d5db";
    if (isFocalPoint) fill = "var(--color-hex-focal)";
    // For highlight/selected overlays, base fill is transparent so texture shows; overlays are drawn above.
    const polygonFill = hasTexture ? "transparent" : fill;

    const clipId      = `hex-clip-${hexKey(coords)}`;
    const gradId      = `starter-grad-${hexKey(coords)}`;
    const glowId      = `hex-glow-${hexKey(coords)}`;
    const focalGlowId = `focal-glow-${hexKey(coords)}`;
    const isNeutral   = !startingProp && !isFocalPoint;
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
                    {startingProp && (() => {
                        const dark = playerColors[startingProp.owner]?.primary ?? playerColors.default?.primary ?? "#6b7280";
                        const erode = Math.round(size * 0.25);
                        const blur  = size * 0.35;
                        return (
                            <filter id={gradId} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
                                <feMorphology in="SourceAlpha" operator="erode" radius={erode} result="shrunken"/>
                                <feGaussianBlur in="shrunken" stdDeviation={blur} result="core"/>
                                <feComposite in="SourceAlpha" in2="core" operator="out" result="edge"/>
                                <feFlood floodColor={dark} result="color"/>
                                <feComposite in="color" in2="edge" operator="in"/>
                            </filter>
                        );
                    })()}
                    <filter id={glowId} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
                        <feMorphology in="SourceAlpha" operator="erode" radius={Math.round(size * 0.05)} result="shrunken"/>
                        <feGaussianBlur in="shrunken" stdDeviation={size * 0.05} result="core"/>
                        <feComposite in="SourceAlpha" in2="core" operator="out" result="edge"/>
                        <feFlood floodColor="#746940" result="color"/>
                        <feComposite in="color" in2="edge" operator="in"/>
                    </filter>
                    {isFocalPoint && isActiveFocalPoint && (
                        <filter id={focalGlowId} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
                            <feMorphology in="SourceAlpha" operator="erode" radius={Math.round(size * 0.05)} result="shrunken"/>
                            <feGaussianBlur in="shrunken" stdDeviation={size * 0.05} result="core"/>
                            <feComposite in="SourceAlpha" in2="core" operator="out" result="edge"/>
                            <feFlood floodColor="var(--color-focal-active)" result="color"/>
                            <feComposite in="color" in2="edge" operator="in"/>
                        </filter>
                    )}
                </defs>
            )}
            <polygon
                points={points}
                fill={polygonFill}
                stroke="var(--color-hex-stroke)"
                strokeWidth={HEX_STROKE_WIDTH}
            />
            {hasTexture && themeImageVariant !== null ? (
                // Atlas crop: full 936px image scaled to 4×imgSize, offset to show selected tile
                <image
                    href={themeImageHref}
                    x={imgX - (themeImageVariant % 4) * imgSize}
                    y={imgY - Math.floor(themeImageVariant / 4) * imgSize}
                    width={imgSize * 4}
                    height={imgSize * 4}
                    clipPath={`url(#${clipId})`}
                    className="pointer-events-none"
                />
            ) : hasTexture && (
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
            {/* Sepia edge glow — all hex types */}
            {hasTexture && (
                <polygon
                    points={points}
                    fill="#928550"
                    filter={`url(#${glowId})`}
                    className="pointer-events-none"
                    style={{ mixBlendMode: "screen" }}
                />
            )}
            {/* Starting field — player colour multiply above sepia glow */}
            {startingProp && (() => {
                const dark = playerColors[startingProp.owner]?.primary ?? playerColors.default?.primary ?? "#6b7280";
                return (
                    <polygon
                        points={points}
                        fill={dark}
                        filter={`url(#${gradId})`}
                        className="pointer-events-none"
                        style={{ mixBlendMode: "multiply" }}
                    />
                );
            })()}
            {/* Thin dark inner stroke — sharpens hex edge above texture */}
            <polygon
                points={points}
                fill="none"
                stroke="rgba(0,0,0,0.75)"
                strokeWidth={0.5}
                className="pointer-events-none"
            />
            {/* Selected overlay — above texture */}
            {isSelected && (
                <polygon
                    points={points}
                    fill="var(--color-hex-selected)"
                    opacity={0.45}
                    className="pointer-events-none"
                />
            )}
            {/* Highlight overlay (non-dimmed) above texture, below dice */}
            {highlight && highlight !== "dimmed" && (
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
                    filter={`url(#${focalGlowId})`}
                    className="pointer-events-none"
                    style={{ mixBlendMode: "screen" }}
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
                const color = playerColors[die.owner]?.primary ?? playerColors.default?.primary ?? "#6b7280";
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
            {/* Dimmed overlay above dice — covers dice on unreachable hexes */}
            {highlight === "dimmed" && (
                <polygon
                    points={points}
                    fill={HIGHLIGHT_FILL.dimmed}
                    opacity={0.55}
                    className="pointer-events-none"
                />
            )}
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
