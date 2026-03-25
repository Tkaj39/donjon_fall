import { describe, it, expect } from 'vitest';
import { isOnBoard } from '../../src/hex/boardUtils';

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
