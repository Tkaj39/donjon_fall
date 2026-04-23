/**
 * Tests for the VictoryScreen component (Phase 8.2).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { VictoryScreen } from '../../src/components/VictoryScreen.jsx';

function renderScreen(overrides = {}) {
    const defaults = {
        winner:    'red',
        onNewGame: () => {},
    };
    return render(<VictoryScreen {...defaults} {...overrides} />);
}

describe('VictoryScreen', () => {
    test('renders a dialog with accessible label', () => {
        renderScreen();
        expect(screen.getByRole('dialog', { name: /victory screen/i })).toBeDefined();
    });

    test('displays "Victory!" heading', () => {
        renderScreen();
        expect(screen.getByText('Vítěz!')).toBeDefined();
    });

    test('shows winner name in the winner label', () => {
        renderScreen({ winner: 'red' });
        expect(screen.getByTestId('winner-label').textContent).toMatch(/red/i);
    });

    test('shows correct winner for blue player', () => {
        renderScreen({ winner: 'blue' });
        expect(screen.getByTestId('winner-label').textContent).toMatch(/blue/i);
    });

    test('shows correct winner for unknown player ID', () => {
        renderScreen({ winner: 'green' });
        expect(screen.getByTestId('winner-label').textContent).toMatch(/green/i);
    });

    test('renders a New game button', () => {
        renderScreen();
        expect(screen.getByTestId('new-game-btn')).toBeDefined();
    });

    test('clicking New game calls onNewGame', () => {
        const onNewGame = vi.fn();
        renderScreen({ onNewGame });
        fireEvent.click(screen.getByTestId('new-game-btn'));
        expect(onNewGame).toHaveBeenCalledOnce();
    });

    test('has aria-modal="true"', () => {
        renderScreen();
        expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    });
});
