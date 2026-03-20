import { hexKey } from "./hexUtils";

// The board is a large hexagon of radius 4 centered at (0,0,0)
// Total hexes: 1 + 6 + 12 + 18 + 24 = 61
const BOARD_RADIUS = 4;

// Generates all cube-coordinate hexes that form the board.
// Iterates over all q values in [-BOARD_RADIUS, BOARD_RADIUS], then clamps
// r to the valid range so that s = -q-r stays within the same radius bound.
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

export const BOARD_HEXES = buildBoardHexes();

// A Set of stringified hex keys (e.g. "0,0,0") for all 61 board hexes.
// Used for O(1) membership checks — isOnBoard() looks up a hex here instead
// of scanning the BOARD_HEXES array, which matters when validating every step
// of a move path or every neighbor during rendering.
export const BOARD_HEX_SET = new Set(BOARD_HEXES.map(hexKey));

export function isOnBoard(hex) {
    return BOARD_HEX_SET.has(hexKey(hex));
}

// Focal points: left, center, right in the middle row
// Center = (0,0,0), left = (-2,0,2), right = (2,0,-2)
// (evenly spaced across the 9-hex middle row)
export const FOCAL_POINT_HEXES = [
    {q: -2, r: 0, s: 2},  // left
    {q: 0, r: 0, s: 0},   // center
    {q: 2, r: 0, s: -2},  // right
];

export const FOCAL_POINT_KEYS = FOCAL_POINT_HEXES.map(hexKey);
export const FOCAL_CENTER_KEY = hexKey({q: 0, r: 0, s: 0});
export const FOCAL_LEFT_KEY = hexKey({q: -2, r: 0, s: 2});
export const FOCAL_RIGHT_KEY = hexKey({q: 2, r: 0, s: -2});

// Base rows: red occupies the top row (r = -BOARD_RADIUS),
// blue occupies the bottom row (r = +BOARD_RADIUS).
export const RED_BASE_HEXES = BOARD_HEXES.filter(h => h.r === -BOARD_RADIUS);
export const BLUE_BASE_HEXES = BOARD_HEXES.filter(h => h.r === BOARD_RADIUS);

// Focal point property descriptors keyed by hex key.
const FOCAL_POINT_PROPS = {
    [FOCAL_LEFT_KEY]:   { type: 'focalPoint', active: false, group: 'left' },
    [FOCAL_CENTER_KEY]: { type: 'focalPoint', active: true,  group: 'center' },
    [FOCAL_RIGHT_KEY]:  { type: 'focalPoint', active: false, group: 'right' },
};

// All 61 board fields as HexField objects: { coords, properties[] }.
// Each field carries zero or more properties (startingField, focalPoint).
export const BOARD_FIELDS = BOARD_HEXES.map(coords => {
    const properties = [];
    const key = hexKey(coords);

    if (coords.r === -BOARD_RADIUS) properties.push({ type: 'startingField', owner: 'red' });
    if (coords.r === BOARD_RADIUS)  properties.push({ type: 'startingField', owner: 'blue' });
    if (FOCAL_POINT_PROPS[key])     properties.push(FOCAL_POINT_PROPS[key]);

    return { coords, properties };
});
