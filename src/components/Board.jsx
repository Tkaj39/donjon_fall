/**
 * Board component — renders all 61 board hexes inside an SVG element.
 * Phase 4 — Board visualization.
 * Phase 12.6 — Die movement animation (MovingDie) and combat flash overlays.
 */

import { useEffect, useState } from "react";
import { BOARD_HEXES, BOARD_FIELDS } from "../hex/boardConstants.js";
import { hexCorners, hexFromKey, hexKey, hexToPixel } from "../hex/hexUtils.js";
import { getAttackStrength } from "../game/gameState.js";
import { Die } from "./Die.jsx";
import { HexTile } from "./HexTile.jsx";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

/** Circumradius in pixels for each hex tile. */
const HEX_SIZE = 40;

/** Hex size passed to HexTile and MovingDie (HEX_SIZE minus stroke allowance). */
const TILE_SIZE = HEX_SIZE - 1;

/** Padding multiplier for extra space around the board edge. */
const PADDING_RATIO = 1.2;

/**
 * Ordered colour palette for up to 6 players.
 * `primary` — die body colour; `tint` — base-hex background tint.
 */
const PLAYER_PALETTE = [
    { primary: "#dc2626", tint: "#fca5a5" }, // red
    { primary: "#2563eb", tint: "#93c5fd" }, // blue
    { primary: "#16a34a", tint: "#86efac" }, // green
    { primary: "#d97706", tint: "#fcd34d" }, // amber
    { primary: "#9333ea", tint: "#d8b4fe" }, // purple
    { primary: "#0891b2", tint: "#67e8f9" }, // cyan
];

/**
 * Named colour overrides — player IDs whose names match a colour get that colour
 * regardless of their position in the players array.
 */
const NAMED_PLAYER_COLORS = {
    red:    PLAYER_PALETTE[0],
    blue:   PLAYER_PALETTE[1],
    green:  PLAYER_PALETTE[2],
    amber:  PLAYER_PALETTE[3],
    purple: PLAYER_PALETTE[4],
    cyan:   PLAYER_PALETTE[5],
};

/**
 * Fallback playerColors derived from BOARD_FIELDS for empty-board dev rendering.
 * Owners are discovered by the order they first appear in BOARD_FIELDS properties.
 */
const DEFAULT_PLAYER_COLORS = (() => {
    const owners = [];
    for (const field of BOARD_FIELDS) {
        for (const prop of field.properties) {
            if (prop.type === "startingField" && !owners.includes(prop.owner)) {
                owners.push(prop.owner);
            }
        }
    }
    return Object.fromEntries(
        owners.map((id, i) => [id, NAMED_PLAYER_COLORS[id] ?? PLAYER_PALETTE[i] ?? PLAYER_PALETTE[0]]),
    );
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

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

/**
 * Duration in ms of the die-movement fly animation (Phase 12.6).
 * Exported so Game.jsx can delay the reducer dispatch by the same amount.
 */
export const MOVE_ANIMATION_MS = 260;

/** Vertical die-stack spacing as a fraction of hex size (mirrors HexTile). */
const STACK_OFFSET_RATIO = 0.22;

// ---------------------------------------------------------------------------
// Internal animated component
// ---------------------------------------------------------------------------

/**
 * Renders a die stack flying from one SVG coordinate to another using a
 * requestAnimationFrame loop (Phase 12.6).  Die positions are updated each
 * frame in SVG user units so the animation scales correctly when the board SVG
 * is responsive (width: 100% with a viewBox).
 *
 * @param {number}   props.fromX       - Source hex centre x in SVG user units.
 * @param {number}   props.fromY       - Source hex centre y in SVG user units.
 * @param {number}   props.toX         - Destination hex centre x in SVG user units.
 * @param {number}   props.toY         - Destination hex centre y in SVG user units.
 * @param {import("../game/gameState.js").Die[]} props.diceStack
 *   Dice to render in-flight (bottom → top order).
 * @param {number}   props.hexSize     - Circumradius in pixels for die rendering.
 * @param {Object.<string,{primary:string,tint:string}>} props.playerColors
 *   Owner ID → colour pair; controls die body colour.
 * @returns {JSX.Element}
 */
function MovingDie({ fromX, fromY, toX, toY, diceStack, hexSize, playerColors }) {
    const [cx, setCx] = useState(fromX);
    const [cy, setCy] = useState(fromY);

    useEffect(() => {
        const startTime = performance.now();
        let raf;

        /**
         * Advances the animation one frame using cubic ease-in-out interpolation.
         *
         * @returns {void}
         */
        function step() {
            const elapsed = performance.now() - startTime;
            const t       = Math.min(elapsed / MOVE_ANIMATION_MS, 1);
            // Cubic ease-in-out
            const ease    = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            setCx(fromX + (toX - fromX) * ease);
            setCy(fromY + (toY - fromY) * ease);
            if (t < 1) {
                raf = requestAnimationFrame(step);
            }
        }

        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [fromX, fromY, toX, toY]);

    return (
        <>
            {diceStack.map((die, index) => {
                const isTop       = index === diceStack.length - 1;
                const stackOffset = (diceStack.length - 1 - index) * (hexSize * STACK_OFFSET_RATIO);
                const color       = playerColors[die.owner]?.primary ?? "var(--color-die-default)";
                return (
                    <Die
                        key={index}
                        cx={cx}
                        cy={cy - stackOffset}
                        hexSize={hexSize}
                        value={die.value}
                        color={color}
                        isTop={isTop}
                    />
                );
            })}
        </>
    );
}

// ---------------------------------------------------------------------------
// Board component
// ---------------------------------------------------------------------------

/**
 * Renders all 61 board hexes inside an SVG element.
 *
 * @param {import("../game/gameState.js").GameState|null} props.state - Current game state; null renders an empty board.
 * @param {string|null}    props.selectedHex     - hexKey of the currently selected hex, or null.
 * @param {Object.<string,"reachable"|"selected"|"trajectory"|"enemy-reachable">} props.highlightedHexes
 *   Map of hexKey → highlight type for all hexes that should be visually marked.
 * @param {{
 *   enemyKey: string,
 *   approachDirs: Set<string>,
 *   selectedApproachKey: string|null,
 *   onApproachHover: function(string): void,
 * }|null} [props.pickerData]
 *   When non-null, renders the Phase 12.4 direction picker on the specified enemy hex.
 * @param {{ fromKey: string, toKey: string } | null} [props.pendingMove]
 *   When non-null, suppresses dice at `fromKey` and renders an animated MovingDie
 *   flying from `fromKey` to `toKey` (Phase 12.6).
 * @param {boolean} [props.debugMode] - When true, renders the Phase 14.1 debug overlay on every hex.
 * @param {function(string): void} [props.onHexClick] - Called with the hexKey when a hex is clicked.
 * @returns {JSX.Element}
 */
export function Board({ state = null, selectedHex = null, highlightedHexes = {}, pickerData = null, pendingMove = null, debugMode = false, onHexClick }) {
    const dice        = state?.dice ?? {};
    const focalPoints = state?.focalPoints ?? {};

    const players = state?.players ?? [];
    const playerColors = players.length > 0
        ? Object.fromEntries(players.map((id, i) => [id, NAMED_PLAYER_COLORS[id] ?? PLAYER_PALETTE[i] ?? PLAYER_PALETTE[0]]))
        : DEFAULT_PLAYER_COLORS;

    // ── Phase 12.6: pre-compute moving die pixel positions ──────────────────

    /**
     * Pixel coordinates and dice stack for the in-flight die animation.
     * Null when no move is pending.
     */
    const movingDieProps = (() => {
        if (!pendingMove) return null;
        const fromPx = hexToPixel(hexFromKey(pendingMove.fromKey), HEX_SIZE);
        const toPx   = hexToPixel(hexFromKey(pendingMove.toKey),   HEX_SIZE);
        return {
            fromX:     fromPx.x + OFFSET_X,
            fromY:     fromPx.y + OFFSET_Y,
            toX:       toPx.x   + OFFSET_X,
            toY:       toPx.y   + OFFSET_Y,
            diceStack: dice[pendingMove.fromKey] ?? [],
        };
    })();

    // ── Phase 12.6: combat flash hex data ───────────────────────────────────

    /**
     * Attacker/defender flash entries rendered as pulsing polygons on top of the
     * board while state.phase === "combat".
     */
    const combatFlashEntries = state?.phase === "combat" && state.combat
        ? [
            { hk: state.combat.attackerHex, fill: "rgba(239,68,68,0.4)",    delay: "0s"   },
            { hk: state.combat.defenderHex, fill: "rgba(251,191,36,0.35)", delay: "0.4s" },
        ]
        : [];

    return (
        <svg
            width="100%"
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="block mx-auto h-auto"
            style={{ maxWidth: SVG_WIDTH }}
        >
            {BOARD_HEXES.map(hex => {
                const key = hexKey(hex);
                const { x, y } = hexToPixel(hex, HEX_SIZE);

                // Suppress dice at the source hex while the die is in-flight (12.6).
                const diceStack = pendingMove?.fromKey === key ? [] : (dice[key] ?? []);

                const debugInfo = debugMode ? (() => {
                    const hasDice = (dice[key] ?? []).length > 0;
                    const fp = focalPoints[key] ?? null;
                    const fpProps = (FIELD_PROPS_BY_KEY[key] ?? []).find(p => p.type === "focalPoint");
                    return {
                        attackStrength: hasDice && state ? getAttackStrength(state, key) : null,
                        focalGroup:     fpProps?.group ?? (fp ? fp.group : null),
                        focalActive:    fp?.isActive ?? false,
                    };
                })() : null;

                return (
                    <HexTile
                        key={key}
                        coords={hex}
                        centerX={x + OFFSET_X}
                        centerY={y + OFFSET_Y}
                        size={TILE_SIZE}
                        fieldProperties={FIELD_PROPS_BY_KEY[key] ?? []}
                        diceStack={diceStack}
                        highlight={highlightedHexes[key] ?? null}
                        isSelected={selectedHex === key}
                        playerColors={playerColors}
                        isActiveFocalPoint={focalPoints[key]?.isActive ?? false}
                        debugInfo={debugInfo}
                        directionPicker={pickerData?.enemyKey === key ? {
                            enemyHexKey:       key,
                            validApproachKeys: pickerData.approachDirs,
                            selectedApproachKey: pickerData.selectedApproachKey,
                            onApproachHover:   pickerData.onApproachHover,
                        } : null}
                        onClick={onHexClick}
                    />
                );
            })}

            {/* ── Phase 12.6: in-flight die animation ─────────────────── */}
            {movingDieProps && (
                <MovingDie
                    fromX={movingDieProps.fromX}
                    fromY={movingDieProps.fromY}
                    toX={movingDieProps.toX}
                    toY={movingDieProps.toY}
                    diceStack={movingDieProps.diceStack}
                    hexSize={TILE_SIZE}
                    playerColors={playerColors}
                />
            )}

            {/* ── Phase 12.6: pulsing combat flash overlays ───────────── */}
            {combatFlashEntries.map(({ hk, fill, delay }) => {
                const { x, y } = hexToPixel(hexFromKey(hk), HEX_SIZE);
                const corners  = hexCorners(x + OFFSET_X, y + OFFSET_Y, TILE_SIZE);
                const points   = corners.map(({ x: cx, y: cy }) => `${cx},${cy}`).join(" ");
                return (
                    <polygon
                        key={hk}
                        points={points}
                        fill={fill}
                        stroke="none"
                        style={{
                            animation:     `combat-flash 0.8s ease-in-out ${delay} infinite`,
                            pointerEvents: "none",
                        }}
                    />
                );
            })}
        </svg>
    );
}