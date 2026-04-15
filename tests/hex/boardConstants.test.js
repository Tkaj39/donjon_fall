import { describe, it, expect } from 'vitest';
import {
    BOARD_HEXES,
    BOARD_FIELDS,
    FOCAL_POINT_HEXES,
} from '../../src/hex/boardConstants';

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

describe('FOCAL_POINT_HEXES', () => {
    it('has exactly 3 entries', () => {
        expect(FOCAL_POINT_HEXES).toHaveLength(3);
    });

    it('all have r === 0 (middle row)', () => {
        FOCAL_POINT_HEXES.forEach(({r}) => {
            expect(r).toBe(0);
        });
    });

    it('all satisfy q + r + s === 0', () => {
        FOCAL_POINT_HEXES.forEach(({q, r, s}) => {
            expect(q + r + s).toBe(0);
        });
    });

    it('all are present in BOARD_HEXES', () => {
        const boardSet = new Set(BOARD_HEXES.map(({q, r, s}) => `${q},${r},${s}`));
        FOCAL_POINT_HEXES.forEach(({q, r, s}) => {
            expect(boardSet.has(`${q},${r},${s}`)).toBe(true);
        });
    });
});

describe('BOARD_FIELDS focal points', () => {
    const focalFields = BOARD_FIELDS.filter(f => f.properties.some(p => p.type === 'focalPoint'));

    it('has exactly 3 focal point fields', () => {
        expect(focalFields).toHaveLength(3);
    });

    it('exactly one focal point is active at game start', () => {
        const activeCount = focalFields.filter(f => f.properties.some(p => p.type === 'focalPoint' && p.active)).length;
        expect(activeCount).toBe(1);
    });
});
