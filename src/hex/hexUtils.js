// Cube coordinate utilities for hex grid

// Returns the distance in steps between two hexes in cube coordinates.
// @param {Object} a - source hex {q, r, s}
// @param {Object} b - target hex {q, r, s}
export function cubeDistance(a, b) {
    return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
}

// The 6 cube directions
const CUBE_DIRECTIONS = [
    {q: 1, r: -1, s: 0},
    {q: 1, r: 0, s: -1},
    {q: 0, r: 1, s: -1},
    {q: -1, r: 1, s: 0},
    {q: -1, r: 0, s: 1},
    {q: 0, r: -1, s: 1},
];

// Returns the 6 neighboring hexes of a given hex in cube coordinates.
// @param {Object} hex - center hex {q, r, s}
export function getNeighbors({q, r, s}) {
    return CUBE_DIRECTIONS.map((d) => ({q: q + d.q, r: r + d.r, s: s + d.s}));
}

// Returns all hexes within a given range of a center hex (inclusive of center).
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

// Returns hexes along the straight line from `from` to `to` (inclusive).
// @param {Object} from - start hex {q, r, s}
// @param {Object} to - end hex {q, r, s}
export function getPath(from, to) {
    const dist = cubeDistance(from, to);
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
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);
    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds) rr = -rq - rs;
    else rs = -rq - rr;
    return {q: rq, r: rr, s: rs};
}

// Converts cube coordinates to offset coordinates (odd-r layout, pointy-top).
// @param {Object} hex - {q, r, s}
export function cubeToOffset({q, r}) {
    return {col: q + (r - (r & 1)) / 2, row: r};
}

// Converts offset coordinates (odd-r layout, pointy-top) to cube coordinates.
// @param {Object} offset - {col, row}
export function offsetToCube({col, row}) {
    const q = col - (row - (row & 1)) / 2;
    const r = row;
    return {q, r, s: -q - r};
}

// Converts a hex to a stable string key (e.g. "1,-2,1") for use in Maps and Sets.
// Two separate {q,r,s} objects with the same values would be treated as different
// keys by JavaScript, since object identity is used — stringifying them gives a
// value-based key that works correctly.
// @param {Object} hex - {q, r, s}
export function hexKey({q, r, s}) {
    return `${q},${r},${s}`;
}

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
export function hexCorners(cx, cy, size) {
    return Array.from({length: 6}, (_, i) => {
        const angle = (Math.PI / 180) * (60 * i - 30);
        return {
            x: cx + size * Math.cos(angle),
            y: cy + size * Math.sin(angle),
        };
    });
}
