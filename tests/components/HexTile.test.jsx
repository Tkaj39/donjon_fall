/**
 * Tests for the HexTile component (Phase 4.1 – 4.3).
 */

import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { HexTile } from '../../src/components/HexTile.jsx';

const COORDS = { q: 0, r: 0, s: 0 };
const HEX_KEY = '0,0,0';

function renderTile(props = {}) {
    return render(
        <svg>
            <HexTile
                coords={COORDS}
                centerX={50}
                centerY={50}
                size={36}
                {...props}
            />
        </svg>
    );
}

describe('HexTile', () => {
    test('renders a polygon for the hex body', () => {
        const { container } = renderTile();
        expect(container.querySelector('polygon')).not.toBeNull();
    });

    test('renders one Die per die in diceStack', () => {
        const diceStack = [
            { owner: 'red', value: 3 },
            { owner: 'blue', value: 5 },
        ];
        const { container } = renderTile({ diceStack });
        // Each Die renders one <rect>
        expect(container.querySelectorAll('rect')).toHaveLength(2);
    });

    test('top die rendered at full opacity, bottom die dimmed', () => {
        const diceStack = [
            { owner: 'red',  value: 2 }, // index 0 → bottom → dimmed
            { owner: 'blue', value: 4 }, // index 1 → top    → full
        ];
        const { container } = renderTile({ diceStack });
        const groups = [...container.querySelectorAll('g[opacity]')];
        const opacities = groups.map(g => g.getAttribute('opacity'));
        expect(opacities).toContain('1');
        expect(opacities).toContain('0.55');
    });

    test('renders FocalPointMarker for focal point hex', () => {
        const fieldProperties = [{ type: 'focalPoint', active: true, group: 'main' }];
        const { container } = renderTile({ fieldProperties, isActiveFocalPoint: true });
        // Active marker = <polygon> (star); the hex body polygon is already counted — check both
        const polygons = container.querySelectorAll('polygon');
        // One polygon for the hex, one for the star marker
        expect(polygons.length).toBeGreaterThanOrEqual(2);
    });

    test('no FocalPointMarker for regular hex', () => {
        const { container } = renderTile({ fieldProperties: [] });
        // Only the hex body polygon — no extra marker polygon
        const polygons = container.querySelectorAll('polygon');
        expect(polygons).toHaveLength(1);
    });

    test('calls onClick with hexKey when hex is clicked', () => {
        const onClick = vi.fn();
        const { container } = renderTile({ onClick });
        const outerG = container.querySelector('g');
        fireEvent.click(outerG);
        expect(onClick).toHaveBeenCalledOnce();
        expect(onClick).toHaveBeenCalledWith(HEX_KEY);
    });

    test('does not crash without onClick', () => {
        const { container } = renderTile();
        const outerG = container.querySelector('g');
        expect(() => fireEvent.click(outerG)).not.toThrow();
    });

    test('cursor is pointer when onClick provided', () => {
        const { container } = renderTile({ onClick: vi.fn() });
        expect(container.querySelector('g').style.cursor).toBe('pointer');
    });

    test('cursor is default when onClick not provided', () => {
        const { container } = renderTile();
        expect(container.querySelector('g').style.cursor).toBe('default');
    });

    test('playerColors.primary used for die fill', () => {
        const playerColors = { red: { primary: '#ff0000', tint: '#fca5a5' } };
        const diceStack = [{ owner: 'red', value: 1 }];
        const { container } = renderTile({ diceStack, playerColors });
        const rect = container.querySelector('rect');
        expect(rect).toHaveAttribute('fill', '#ff0000');
    });
});
