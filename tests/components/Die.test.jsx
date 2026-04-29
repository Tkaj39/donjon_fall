/**
 * Tests for the Die component (Phase 4.2).
 */

import { render } from '@testing-library/react';
import { Die } from '../../src/components/Die.jsx';

/** Wrap Die in an SVG so jsdom handles SVG namespaces correctly. */
function renderDie(props) {
    return render(
        <svg>
            <Die cx={50} cy={50} hexSize={36} color="#dc2626" {...props} />
        </svg>
    );
}

describe('Die', () => {
    test.each([
        [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6],
    ])('face value %i renders %i pip circle(s)', (value, pipCount) => {
        const { container } = renderDie({ value });
        // All circles inside the <g> are pips (the die body is a <rect>)
        const circles = container.querySelectorAll('circle');
        expect(circles).toHaveLength(pipCount);
    });

    test('isTop=true renders no gradient overlay rect', () => {
        const { container } = renderDie({ value: 3, isTop: true });
        // Top die has only one rect (the die body); no gradient dimming overlay.
        expect(container.querySelectorAll('rect')).toHaveLength(1);
    });

    test('isTop=false renders a gradient overlay rect for dimming', () => {
        const { container } = renderDie({ value: 3, isTop: false });
        // Non-top die has two rects: die body + gradient dimming overlay.
        expect(container.querySelectorAll('rect')).toHaveLength(2);
    });

    test('renders a rect for the die body', () => {
        const { container } = renderDie({ value: 4 });
        expect(container.querySelector('rect')).not.toBeNull();
    });

    test('rect fill matches the color prop', () => {
        const { container } = renderDie({ value: 1, color: '#2563eb' });
        const rect = container.querySelector('rect');
        expect(rect).toHaveAttribute('fill', '#2563eb');
    });
});
