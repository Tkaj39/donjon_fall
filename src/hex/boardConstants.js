/**
 * Board constants — pre-computed hex sets, focal point keys, and board fields.
 * Phase 1 — Central source of truth for all geometry constants used across the codebase.
 */

import { hexKey } from "./hexUtils.js";

/** Radius of the large-hexagon board; total hexes = 1 + 6 + 12 + 18 + 24 = 61. */
const BOARD_RADIUS = 4;

/**
 * Focal point property descriptors keyed by hex key.
 * All three hexes share the same group ID — they form one focal point group.
 */
const FOCAL_POINT_PROPS = {
    ["-2,0,2"]: { type: "focalPoint", active: false, group: "main" },
    ["0,0,0"]:  { type: "focalPoint", active: true,  group: "main" },
    ["2,0,-2"]: { type: "focalPoint", active: false, group: "main" },
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generates all cube-coordinate hexes that form the board.
 * Iterates over all q values in [-BOARD_RADIUS, BOARD_RADIUS], then clamps
 * r to the valid range so that s = -q-r stays within the same radius bound.
 *
 * @returns {{q: number, r: number, s: number}[]}
 */
function buildBoardHexes() {
    const hexes = [];
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
        const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
        const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
        for (let r = r1; r <= r2; r++) {
            const s = -q - r;
            hexes.push({q, r, s});
        }
    }
    return hexes;
}

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

/** All 61 cube-coordinate hex objects that make up the board. */
export const BOARD_HEXES = buildBoardHexes();

/**
 * Set of stringified hex keys (e.g. "0,0,0") for all 61 board hexes.
 * Used for O(1) membership checks — isOnBoard() in boardUtils.js looks up a hex here instead
 * of scanning the BOARD_HEXES array, which matters when validating every step
 * of a move path or every neighbor during rendering.
 *
 * @type {Set<string>}
 */
export const BOARD_HEX_SET = new Set(BOARD_HEXES.map(hexKey));

/**
 * Focal point hex coordinate objects: left, center, right in the middle row.
 * Center = (0,0,0), left = (-2,0,2), right = (2,0,-2) — evenly spaced across
 * the 9-hex middle row.
 *
 * @type {{q: number, r: number, s: number}[]}
 */
export const FOCAL_POINT_HEXES = [
    {q: -2, r: 0, s: 2},  // left
    {q: 0, r: 0, s: 0},   // center
    {q: 2, r: 0, s: -2},  // right
];

/** Hex keys for all three focal point hexes. @type {string[]} */
export const FOCAL_POINT_KEYS = FOCAL_POINT_HEXES.map(hexKey);

/** Hex key of the center focal point. @type {string} */
export const FOCAL_CENTER_KEY = hexKey({q: 0, r: 0, s: 0});

/** Hex key of the left focal point. @type {string} */
export const FOCAL_LEFT_KEY = hexKey({q: -2, r: 0, s: 2});

/** Hex key of the right focal point. @type {string} */
export const FOCAL_RIGHT_KEY = hexKey({q: 2, r: 0, s: -2});

/**
 * All hex objects in the red base row (r = -BOARD_RADIUS, top of board).
 * @type {{q: number, r: number, s: number}[]}
 */
export const RED_BASE_HEXES = BOARD_HEXES.filter(h => h.r === -BOARD_RADIUS);

/**
 * All hex objects in the blue base row (r = +BOARD_RADIUS, bottom of board).
 * @type {{q: number, r: number, s: number}[]}
 */
export const BLUE_BASE_HEXES = BOARD_HEXES.filter(h => h.r === BOARD_RADIUS);

/**
 * All 61 board fields as HexField objects: `{ coords, properties[] }`.
 * Each field carries zero or more properties (startingField, focalPoint).
 *
 * @type {Array<{coords: {q:number,r:number,s:number}, properties: object[]}>}
 */
export const BOARD_FIELDS = BOARD_HEXES.map(coords => {
    const properties = [];
    const key = hexKey(coords);

    if (coords.r === -BOARD_RADIUS) properties.push({ type: "startingField", owner: "red" });
    if (coords.r === BOARD_RADIUS)  properties.push({ type: "startingField", owner: "blue" });
    if (FOCAL_POINT_PROPS[key])     properties.push(FOCAL_POINT_PROPS[key]);

    return { coords, properties };
});