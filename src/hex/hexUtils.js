/**
 * Cube coordinate utilities for the hex grid.
 * Phase 1 — Hex geometry helpers used across the entire codebase.
 */

/** The 6 cube directions for a hex grid. */
const CUBE_DIRECTIONS = [
    {q: 1, r: -1, s: 0},
    {q: 1, r: 0, s: -1},
    {q: 0, r: 1, s: -1},
    {q: -1, r: 1, s: 0},
    {q: -1, r: 0, s: 1},
    {q: 0, r: -1, s: 1},
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Rounds floating-point cube coordinates to the nearest valid hex.
 * getPath produces fractional cube coords by linearly interpolating between two
 * integer hex coords at evenly-spaced t values. For example, interpolating from
 * {q:0,r:0,s:0} to {q:3,r:-1,s:-2} at t=1/3 yields {q:1.0,r:-0.33,s:-0.67} —
 * not a real hex, but geometrically on the straight-line path between the two.
 * cubeRound snaps each such point to the nearest integer hex while preserving
 * the q+r+s=0 constraint, giving the hexes that make up the path.
 * @param {{q: number, r: number, s: number}} hex - fractional cube coordinates
 * @returns {{q: number, r: number, s: number}}
 */
function cubeRound({q, r, s}) {
    let roundedQ = Math.round(q);
    let roundedR = Math.round(r);
    let roundedS = Math.round(s);
    const errorQ = Math.abs(roundedQ - q);
    const errorR = Math.abs(roundedR - r);
    const errorS = Math.abs(roundedS - s);
    if (errorQ > errorR && errorQ > errorS) {
        roundedQ = -roundedR - roundedS;
    } else if (errorR > errorS) {
        roundedR = -roundedQ - roundedS;
    } else {
        roundedS = -roundedQ - roundedR;
    }
    return {q: roundedQ, r: roundedR, s: roundedS};
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Returns the distance in steps between two hexes in cube coordinates. Has no board awareness.
 * @param {{q: number, r: number, s: number}} first
 * @param {{q: number, r: number, s: number}} second
 * @returns {number}
 */
export function hexesDistance(first, second) {
    return Math.max(
        Math.abs(first.q - second.q),
        Math.abs(first.r - second.r),
        Math.abs(first.s - second.s)
    );
}

/**
 * Returns the 6 neighboring hexes of a given hex in cube coordinates. Has no board awareness, may return hexes outside the board.
 * @param {{q: number, r: number, s: number}} hex - center hex
 * @returns {{q: number, r: number, s: number}[]}
 */
export function getNeighbors({q, r, s}) {
    return CUBE_DIRECTIONS.map((direction) => ({q: q + direction.q, r: r + direction.r, s: s + direction.s}));
}

/**
 * Returns all hexes within a given range of a center hex (inclusive of center). Has no board awareness, may return hexes outside the board.
 * @param {{q: number, r: number, s: number}} hex - center hex
 * @param {number} range - number of steps outward
 * @returns {{q: number, r: number, s: number}[]}
 */
export function hexesInRange(hex, range) {
    const results = [];
    for (let dq = -range; dq <= range; dq++) {
        for (let dr = Math.max(-range, -dq - range); dr <= Math.min(range, -dq + range); dr++) {
            const ds = -dq - dr;
            results.push({q: hex.q + dq, r: hex.r + dr, s: hex.s + ds});
        }
    }
    return results;
}

/**
 * Returns hexes along the straight line from `from` to `to` (inclusive). Has no board awareness, may return hexes outside the board.
 * @param {{q: number, r: number, s: number}} from - start hex
 * @param {{q: number, r: number, s: number}} to - end hex
 * @returns {{q: number, r: number, s: number}[]}
 */
export function getPath(from, to) {
    const dist = hexesDistance(from, to);
    if (dist === 0) return [from];
    const results = [];

    for (let i = 0; i <= dist; i++) {
        const t = i / dist;
        results.push(cubeRound({
            q: from.q + (to.q - from.q) * t,
            r: from.r + (to.r - from.r) * t,
            s: from.s + (to.s - from.s) * t,
        }));
    }
    return results;
}

/**
 * Converts a hex to a stable string key (e.g. "1,-2,1") for use in Maps and Sets.
 * Two separate {q,r,s} objects with the same values would be treated as different keys by JavaScript, since object
 * identity is used — serializing them gives a value-based key that works correctly.
 * @param {{q: number, r: number, s: number}} hex
 * @returns {string}
 */
export function hexKey({q, r, s}) {
    return `${q},${r},${s}`;
}

/**
 * Parses a hex key string (e.g. "1,-2,1") back into a cube coordinate object.
 * @param {string} key - a string produced by hexKey()
 * @returns {{q: number, r: number, s: number}}
 */
export function hexFromKey(key) {
    const [q, r, s] = key.split(",").map(Number);
    return {q, r, s};
}

/**
 * Converts hex cube coords to SVG pixel position (pointy-top).
 * @param {{q: number, r: number, s: number}} hex
 * @param {number} size - hex circumradius in pixels
 * @returns {{x: number, y: number}}
 */
export function hexToPixel({q, r}, size) {
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * (3 / 2) * r;
    return {x, y};
}

/**
 * Returns the 6 corner points of a pointy-top hexagon centered at (centerX, centerY).
 * @param {number} centerX - center x pixel coordinate
 * @param {number} centerY - center y pixel coordinate
 * @param {number} size - hex circumradius in pixels
 * @returns {{x: number, y: number}[]}
 */
export function hexCorners(centerX, centerY, size) {
    return Array.from({length: 6}, (_, i) => {
        const angle = (Math.PI / 180) * (60 * i - 30);
        return {
            x: centerX + size * Math.cos(angle),
            y: centerY + size * Math.sin(angle),
        };
    });
}
