import { describe, it, expect } from 'vitest';
import {
    BOARD_HEXES,
    isOnBoard,
    FOCAL_POINT_HEXES,
    FOCAL_POINT_KEYS,
    FOCAL_CENTER_KEY,
    FOCAL_LEFT_KEY,
    FOCAL_RIGHT_KEY,
} from './boardConstants';

describe('BOARD_HEXES', () => {
    it('has exactly 61 entries', () => {
        expect(BOARD_HEXES).toHaveLength(61);
    });

    it('all satisfy q + r + s === 0', () => {
        BOARD_HEXES.forEach(({q, r, s}) => {
            expect(q + r + s).toBe(0);
        });
    });

    it('all are within radius 4', () => {
        BOARD_HEXES.forEach(({q, r, s}) => {
            expect(Math.max(Math.abs(q), Math.abs(r), Math.abs(s))).toBeLessThanOrEqual(4);
        });
    });
});

describe('isOnBoard', () => {
    it('center hex → true', () => {
        expect(isOnBoard({q: 0, r: 0, s: 0})).toBe(true);
    });

    it('corner hex → true', () => {
        expect(isOnBoard({q: 4, r: -4, s: 0})).toBe(true);
    });

    it('out-of-bounds hex → false', () => {
        expect(isOnBoard({q: 5, r: 0, s: -5})).toBe(false);
    });
});

describe('FOCAL_POINT_HEXES', () => {
    it('has exactly 3 entries', () => {
        expect(FOCAL_POINT_HEXES).toHaveLength(3);
    });

    it('all 3 are on the board', () => {
        FOCAL_POINT_HEXES.forEach(hex => {
            expect(isOnBoard(hex)).toBe(true);
        });
    });

    it('all have r === 0 (middle row)', () => {
        FOCAL_POINT_HEXES.forEach(({r}) => {
            expect(r).toBe(0);
        });
    });

    it('left at q=-2, center at q=0, right at q=2', () => {
        const qs = FOCAL_POINT_HEXES.map(h => h.q).sort((a, b) => a - b);
        expect(qs).toEqual([-2, 0, 2]);
    });
});

describe('focal point key constants', () => {
    it('FOCAL_CENTER_KEY === "0,0,0"', () => {
        expect(FOCAL_CENTER_KEY).toBe('0,0,0');
    });

    it('FOCAL_LEFT_KEY === "-2,0,2"', () => {
        expect(FOCAL_LEFT_KEY).toBe('-2,0,2');
    });

    it('FOCAL_RIGHT_KEY === "2,0,-2"', () => {
        expect(FOCAL_RIGHT_KEY).toBe('2,0,-2');
    });

    it('all 3 are in FOCAL_POINT_KEYS', () => {
        expect(FOCAL_POINT_KEYS).toContain(FOCAL_CENTER_KEY);
        expect(FOCAL_POINT_KEYS).toContain(FOCAL_LEFT_KEY);
        expect(FOCAL_POINT_KEYS).toContain(FOCAL_RIGHT_KEY);
    });
});
