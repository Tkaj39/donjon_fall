// Cube coordinate utilities for hex grid

// The 6 cube directions
const CUBE_DIRECTIONS = [
    {q: 1, r: -1, s: 0},
    {q: 1, r: 0, s: -1},
    {q: 0, r: 1, s: -1},
    {q: -1, r: 1, s: 0},
    {q: -1, r: 0, s: 1},
    {q: 0, r: -1, s: 1},
];

// Returns the distance in steps between two hexes in cube coordinates. Has no board awareness
// @param {Object} first - a hex {q, r, s}
// @param {Object} second - another hex {q, r, s}
export function hexesDistance(first, second) {
    return Math.max(
        Math.abs(first.q - second.q),
        Math.abs(first.r - second.r),
        Math.abs(first.s - second.s)
    );
}

// Returns the 6 neighboring hexes of a given hex in cube coordinates. Has no board awareness, may return hexes outside
// the board.
// @param {Object} - center hex {q, r, s}
export function getNeighbors({q, r, s}) {
    return CUBE_DIRECTIONS.map((direction) => ({q: q + direction.q, r: r + direction.r, s: s + direction.s}));
}

// Returns all hexes within a given range of a center hex (inclusive of center). Has no board awareness, may return
// hexes outside the board.
// @param {Object} hex - center hex {q, r, s}
// @param {number} range - number of steps outward
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

// Returns hexes along the straight line from `from` to `to` (inclusive). Has no board awareness, may return hexes
// outside the board.
// @param {Object} from - start hex {q, r, s}
// @param {Object} to - end hex {q, r, s}
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

// Rounds floating-point cube coordinates to the nearest valid hex.
// getPath produces fractional cube coords by linearly interpolating between two
// integer hex coords at evenly-spaced t values. For example, interpolating from
// {q:0,r:0,s:0} to {q:3,r:-1,s:-2} at t=1/3 yields {q:1.0,r:-0.33,s:-0.67} —
// not a real hex, but geometrically on the straight-line path between the two.
// cubeRound snaps each such point to the nearest integer hex while preserving
// the q+r+s=0 constraint, giving the hexes that make up the path.
// @param {Object} hex - fractional cube coordinates {q, r, s}
function cubeRound({q, r, s}) {
    let rounded_q = Math.round(q);
    let rounded_r = Math.round(r);
    let rounded_s = Math.round(s);
    const error_q = Math.abs(rounded_q - q); // rounding error
    const error_r = Math.abs(rounded_r - r); // rounding error
    const error_s = Math.abs(rounded_s - s); // rounding error
    if (error_q > error_r && error_q > error_s) {
        rounded_q = -rounded_r - rounded_s;
    } else if (error_r > error_s) {
        rounded_r = -rounded_q - rounded_s;
    } else {
        rounded_s = -rounded_q - rounded_r;
    }
    return {q: rounded_q, r: rounded_r, s: rounded_s};
}

// Converts a hex to a stable string key (e.g. "1,-2,1") for use in Maps and Sets.
// Two separate {q,r,s} objects with the same values would be treated as different keys by JavaScript, since object
// identity is used — serializing them gives a value-based key that works correctly.
// @param {Object} hex - {q, r, s}
export function hexKey({q, r, s}) {
    return `${q},${r},${s}`;
}

// Parses a hex key string (e.g. "1,-2,1") back into a cube coordinate object.
// @param {string} key - a string produced by hexKey()
export function hexFromKey(key) {
    const [q, r, s] = key.split(',').map(Number);
    return {q, r, s};
}

// Convert hex cube coords to SVG pixel position (pointy-top)
export function hexToPixel({q, r}, size) {
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * (3 / 2) * r;
    return {x, y};
}

// Returns the 6 corner points of a pointy-top hexagon centered at (cx, cy)
// @param {number} center_x - center x pixel coordinate
// @param {number} center_y - center y pixel coordinate
// @param {number} size - hex size (circumradius, i.e. center to corner distance) in pixels
export function hexCorners(center_x, center_y, size) {
    return Array.from({length: 6}, (_, i) => {
        const angle = (Math.PI / 180) * (60 * i - 30);
        return {
            x: center_x + size * Math.cos(angle),
            y: center_y + size * Math.sin(angle),
        };
    });
}
