/**
 * Tests for the FocalPointMarker component (Phase 4.3).
 */

import { render } from '@testing-library/react';
import { FocalPointMarker } from '../../src/components/FocalPointMarker.jsx';

function renderMarker(props) {
    return render(
        <svg>
            <FocalPointMarker cx={50} cy={50} hexSize={36} {...props} />
        </svg>
    );
}

describe('FocalPointMarker', () => {
    test('active marker renders a polygon (star)', () => {
        const { container } = renderMarker({ isActive: true });
        expect(container.querySelector('polygon')).not.toBeNull();
        expect(container.querySelector('circle')).toBeNull();
    });

    test('passive marker renders a circle', () => {
        const { container } = renderMarker({ isActive: false });
        expect(container.querySelector('circle')).not.toBeNull();
        expect(container.querySelector('polygon')).toBeNull();
    });

    test('active polygon has a non-empty points attribute', () => {
        const { container } = renderMarker({ isActive: true });
        const polygon = container.querySelector('polygon');
        expect(polygon.getAttribute('points').length).toBeGreaterThan(0);
    });

    test('passive circle radius scales with hexSize', () => {
        const { container: c1 } = renderMarker({ isActive: false, hexSize: 36 });
        const { container: c2 } = renderMarker({ isActive: false, hexSize: 72 });
        const r1 = parseFloat(c1.querySelector('circle').getAttribute('r'));
        const r2 = parseFloat(c2.querySelector('circle').getAttribute('r'));
        expect(r2).toBeCloseTo(r1 * 2, 5);
    });
});
