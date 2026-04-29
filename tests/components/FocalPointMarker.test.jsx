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
    test('active marker renders an image element', () => {
        const { container } = renderMarker({ isActive: true });
        expect(container.querySelector('image')).not.toBeNull();
    });

    test('passive marker renders an image element', () => {
        const { container } = renderMarker({ isActive: false });
        expect(container.querySelector('image')).not.toBeNull();
    });

    test('active marker has higher opacity than passive', () => {
        const { container: ca } = renderMarker({ isActive: true });
        const { container: cp } = renderMarker({ isActive: false });
        const activeOpacity  = parseFloat(ca.querySelector('image').getAttribute('opacity'));
        const passiveOpacity = parseFloat(cp.querySelector('image').getAttribute('opacity'));
        expect(activeOpacity).toBeGreaterThan(passiveOpacity);
    });

    test('marker size scales with hexSize', () => {
        const { container: c1 } = renderMarker({ isActive: true, hexSize: 36 });
        const { container: c2 } = renderMarker({ isActive: true, hexSize: 72 });
        const w1 = parseFloat(c1.querySelector('image').getAttribute('width'));
        const w2 = parseFloat(c2.querySelector('image').getAttribute('width'));
        expect(w2).toBeCloseTo(w1 * 2, 5);
    });
});