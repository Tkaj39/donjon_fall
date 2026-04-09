/**
 * Tests for the DirectionPickerOverlay component (Phase 12.4).
 *
 * The component renders inside SVG and uses SVG coordinate transforms for
 * mousemove handling. jsdom does not implement getScreenCTM / createSVGPoint, so
 * hover-detection tests are skipped; structure and rendering tests are covered.
 */

import { render } from '@testing-library/react';
import { DirectionPickerOverlay } from '../../src/components/DirectionPickerOverlay.jsx';

/** Enemy hex at origin; two valid approach hexes in adjacent directions. */
const ENEMY_HEX   = '0,0,0';
const APPROACH_A  = '1,-1,0';  // direction "1,-1,0"  → angle -60°
const APPROACH_B  = '1,0,-1';  // direction "1,0,-1"  → angle   0°

function renderOverlay(overrides = {}) {
    const defaults = {
        cx:                 50,
        cy:                 50,
        size:               36,
        enemyHexKey:        ENEMY_HEX,
        validApproachKeys:  new Set([APPROACH_A, APPROACH_B]),
        selectedApproachKey: null,
        onApproachHover:    () => {},
    };
    return render(
        <svg>
            <DirectionPickerOverlay {...defaults} {...overrides} />
        </svg>
    );
}

describe('DirectionPickerOverlay — structure', () => {
    test('renders a <g> wrapper', () => {
        const { container } = renderOverlay();
        expect(container.querySelector('g')).not.toBeNull();
    });

    test('renders a transparent polygon for mousemove capture', () => {
        const { container } = renderOverlay();
        const poly = container.querySelector('polygon[fill="transparent"]');
        expect(poly).not.toBeNull();
    });

    test('renders one pie-segment <path> per valid approach key', () => {
        const { container } = renderOverlay();
        // All paths except the polygon are pie segments (pointer-events: none)
        const paths = container.querySelectorAll('path');
        expect(paths).toHaveLength(2);
    });

    test('renders correct count when three approach keys provided', () => {
        const APPROACH_C = '-1,1,0'; // direction "-1,1,0" → angle 120°
        const { container } = renderOverlay({
            validApproachKeys: new Set([APPROACH_A, APPROACH_B, APPROACH_C]),
        });
        expect(container.querySelectorAll('path')).toHaveLength(3);
    });

    test('each path has pointer-events-none class', () => {
        const { container } = renderOverlay();
        const paths = [...container.querySelectorAll('path')];
        expect(paths.every(p => p.classList.contains('pointer-events-none'))).toBe(true);
    });
});

describe('DirectionPickerOverlay — selected highlighting', () => {
    test('selected approach path has a different fill than unselected', () => {
        const { container } = renderOverlay({ selectedApproachKey: APPROACH_A });
        const paths = [...container.querySelectorAll('path')];
        const fills = paths.map(p => p.getAttribute('fill'));
        // At least two distinct fill values: one selected, one not
        const uniqueFills = new Set(fills);
        expect(uniqueFills.size).toBe(2);
    });

    test('no path is highlighted when selectedApproachKey is null', () => {
        const { container } = renderOverlay({ selectedApproachKey: null });
        const paths = [...container.querySelectorAll('path')];
        const fills = paths.map(p => p.getAttribute('fill'));
        // All fills should be the same (unselected) value
        const uniqueFills = new Set(fills);
        expect(uniqueFills.size).toBe(1);
    });
});

describe('DirectionPickerOverlay — polygon points', () => {
    test('transparent polygon has non-empty points attribute', () => {
        const { container } = renderOverlay();
        const poly = container.querySelector('polygon[fill="transparent"]');
        expect(poly.getAttribute('points').length).toBeGreaterThan(0);
    });

    test('polygon point count corresponds to hex corners (6 corners → 6 pairs)', () => {
        const { container } = renderOverlay();
        const poly = container.querySelector('polygon[fill="transparent"]');
        const pairs = poly.getAttribute('points').trim().split(/\s+/);
        expect(pairs).toHaveLength(6);
    });
});