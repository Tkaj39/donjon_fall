/**
 * Tests for the PlayerShield component.
 */

import { render, screen } from '@testing-library/react';
import { PlayerShield } from '../../src/components/PlayerShield.jsx';

function renderShield(overrides = {}) {
    const defaults = {
        playerId: 'red',
        cfg:      { name: 'Alice', coatOfArms: 'bear' },
        score:    0,
        isActive: false,
    };
    return render(<PlayerShield {...defaults} {...overrides} />);
}

describe('PlayerShield — name display', () => {
    test('shows cfg.name when provided', () => {
        renderShield({ cfg: { name: 'Alice' } });
        expect(screen.getByText('Alice')).toBeDefined();
    });

    test('falls back to playerId when cfg.name is absent', () => {
        renderShield({ playerId: 'blue', cfg: {} });
        expect(screen.getByText('blue')).toBeDefined();
    });

    test('falls back to playerId when cfg is undefined', () => {
        renderShield({ playerId: 'red', cfg: undefined });
        expect(screen.getByText('red')).toBeDefined();
    });
});

describe('PlayerShield — score badge', () => {
    test('displays the score value', () => {
        renderShield({ score: 3 });
        expect(screen.getByText('3')).toBeDefined();
    });

    test('displays score of 0', () => {
        renderShield({ score: 0 });
        expect(screen.getByText('0')).toBeDefined();
    });

    test('displays score of 5', () => {
        renderShield({ score: 5 });
        expect(screen.getByText('5')).toBeDefined();
    });
});

describe('PlayerShield — active state', () => {
    test('active badge has amber background class', () => {
        const { container } = renderShield({ isActive: true });
        const badge = container.querySelector('span');
        expect(badge.className).toMatch(/bg-amber-400/);
    });

    test('inactive badge does not have amber background class', () => {
        const { container } = renderShield({ isActive: false });
        const badge = container.querySelector('span');
        expect(badge.className).not.toMatch(/bg-amber-400/);
    });
});

describe('PlayerShield — images', () => {
    test('renders two img elements (shield + animal)', () => {
        const { container } = renderShield();
        expect(container.querySelectorAll('img')).toHaveLength(2);
    });

    test('animal img alt matches coatOfArms id', () => {
        renderShield({ cfg: { name: 'Alice', coatOfArms: 'wolf' } });
        expect(screen.getByAltText('wolf')).toBeDefined();
    });

    test('unknown coatOfArms still renders img with the original alt text', () => {
        // The component uses cfg.coatOfArms as the alt; the src falls back to
        // the first animal's href, but the alt stays as the provided value.
        renderShield({ cfg: { name: 'Alice', coatOfArms: 'dragon' } });
        expect(screen.getByAltText('dragon')).toBeDefined();
    });
});