import { describe, it, expect } from 'vitest';
import {
    hexesDistance,
    getNeighbors,
    hexesInRange,
    getPath,
    hexKey,
    hexFromKey,
    hexToPixel,
    hexCorners,
} from '../../src/hex/hexUtils';

describe('cubeDistance', () => {
    it('same hex → 0', () => {
        expect(hexesDistance({q: 0, r: 0, s: 0}, {q: 0, r: 0, s: 0})).toBe(0);
    });

    it('adjacent hex → 1', () => {
        expect(hexesDistance({q: 0, r: 0, s: 0}, {q: 1, r: -1, s: 0})).toBe(1);
    });

    it('multi-step → correct value', () => {
        expect(hexesDistance({q: 0, r: 0, s: 0}, {q: 3, r: -1, s: -2})).toBe(3);
        expect(hexesDistance({q: -2, r: 1, s: 1}, {q: 2, r: -3, s: 1})).toBe(4);
    });
});

describe('getNeighbors', () => {
    it('returns exactly 6 neighbors', () => {
        expect(getNeighbors({q: 0, r: 0, s: 0})).toHaveLength(6);
    });

    it('all neighbors are 1 step away', () => {
        const center = {q: 0, r: 0, s: 0};
        getNeighbors(center).forEach(n => {
            expect(hexesDistance(center, n)).toBe(1);
        });
    });

    it('neighbor coords are correct (spot-check)', () => {
        const neighbors = getNeighbors({q: 0, r: 0, s: 0});
        expect(neighbors).toContainEqual({q: 1, r: -1, s: 0});
        expect(neighbors).toContainEqual({q: -1, r: 0, s: 1});
    });
});

describe('hexesInRange', () => {
    it('range 0 → just the center hex', () => {
        const result = hexesInRange({q: 0, r: 0, s: 0}, 0);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({q: 0, r: 0, s: 0});
    });

    it('range 1 → 7 hexes', () => {
        expect(hexesInRange({q: 0, r: 0, s: 0}, 1)).toHaveLength(7);
    });

    it('range 2 → 19 hexes', () => {
        expect(hexesInRange({q: 0, r: 0, s: 0}, 2)).toHaveLength(19);
    });

    it('all returned hexes are within the requested range', () => {
        const center = {q: 1, r: -1, s: 0};
        const range = 3;
        hexesInRange(center, range).forEach(h => {
            expect(hexesDistance(center, h)).toBeLessThanOrEqual(range);
        });
    });
});

describe('getPath', () => {
    it('same hex → [hex]', () => {
        const hex = {q: 1, r: -1, s: 0};
        expect(getPath(hex, hex)).toEqual([hex]);
    });

    it('adjacent hexes → 2 hexes', () => {
        const a = {q: 0, r: 0, s: 0};
        const b = {q: 1, r: -1, s: 0};
        expect(getPath(a, b)).toHaveLength(2);
    });

    it('straight line of known length → correct intermediate hexes', () => {
        const from = {q: 0, r: 0, s: 0};
        const to = {q: 3, r: 0, s: -3};
        const path = getPath(from, to);
        expect(path).toHaveLength(4);
        expect(hexesDistance(path[0], from)).toBe(0);
        expect(hexesDistance(path[1], {q: 1, r: 0, s: -1})).toBe(0);
        expect(hexesDistance(path[2], {q: 2, r: 0, s: -2})).toBe(0);
        expect(hexesDistance(path[3], {q: 3, r: 0, s: -3})).toBe(0);
    });

    it('all hexes in path are within distance 1 of each other', () => {
        const path = getPath({q: -2, r: 1, s: 1}, {q: 2, r: -3, s: 1});
        for (let i = 1; i < path.length; i++) {
            expect(hexesDistance(path[i - 1], path[i])).toBe(1);
        }
    });
});

describe('hexKey', () => {
    it('returns correct string format "q,r,s"', () => {
        expect(hexKey({q: 1, r: -2, s: 1})).toBe('1,-2,1');
        expect(hexKey({q: 0, r: 0, s: 0})).toBe('0,0,0');
    });

    it('two objects with same coords produce same key', () => {
        expect(hexKey({q: 3, r: -1, s: -2})).toBe(hexKey({q: 3, r: -1, s: -2}));
    });
});

describe('hexFromKey', () => {
    it('round-trips with hexKey', () => {
        const hex = {q: 2, r: -3, s: 1};
        expect(hexFromKey(hexKey(hex))).toEqual(hex);
    });

    it('returns correct {q, r, s} object', () => {
        expect(hexFromKey('1,-2,1')).toEqual({q: 1, r: -2, s: 1});
    });
});

describe('hexToPixel', () => {
    it('center hex {q:0, r:0} → {x:0, y:0}', () => {
        expect(hexToPixel({q: 0, r: 0}, 30)).toEqual({x: 0, y: 0});
    });

    it('non-center hex returns correct formula output', () => {
        const size = 30;
        const hex = {q: 1, r: 0};
        const result = hexToPixel(hex, size);
        expect(result.x).toBeCloseTo(size * Math.sqrt(3));
        expect(result.y).toBeCloseTo(0);
    });
});

describe('hexCorners', () => {
    it('returns exactly 6 corners', () => {
        expect(hexCorners(0, 0, 30)).toHaveLength(6);
    });

    it('each corner is size distance from center (within float tolerance)', () => {
        const size = 30;
        hexCorners(0, 0, size).forEach(corner => {
            const dist = Math.sqrt(corner.x ** 2 + corner.y ** 2);
            expect(dist).toBeCloseTo(size, 5);
        });
    });
});
