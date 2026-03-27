/**
 * Tests for the ActionPanel component (Phase 8.1).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ActionPanel } from '../../src/components/ActionPanel.jsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel(overrides = {}) {
    const defaults = {
        currentPlayer:    'red',
        availableActions: ['move-die', 'reroll'],
        activeAction:     null,
        onActionSelect:   () => {},
    };
    return render(<ActionPanel {...defaults} {...overrides} />);
}

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

describe('ActionPanel — visibility', () => {
    test('renders a toolbar with accessible label', () => {
        renderPanel();
        expect(screen.getByRole('toolbar', { name: /action panel/i })).toBeDefined();
    });

    test('always shows Move die and Reroll buttons', () => {
        renderPanel({ availableActions: ['move-die', 'reroll'] });
        expect(screen.getByTestId('action-btn-move-die')).toBeDefined();
        expect(screen.getByTestId('action-btn-reroll')).toBeDefined();
    });

    test('hides Move tower when not in availableActions', () => {
        renderPanel({ availableActions: ['move-die', 'reroll'] });
        expect(screen.queryByTestId('action-btn-move-tower')).toBeNull();
    });

    test('shows Move tower when it is in availableActions', () => {
        renderPanel({ availableActions: ['move-tower', 'move-die', 'reroll'] });
        expect(screen.getByTestId('action-btn-move-tower')).toBeDefined();
    });

    test('Move tower appears before Move die', () => {
        renderPanel({ availableActions: ['move-tower', 'move-die', 'reroll'] });
        const buttons = screen.getAllByRole('button');
        const labels = buttons.map((b) => b.textContent);
        expect(labels.indexOf('Move tower')).toBeLessThan(labels.indexOf('Move die'));
    });

    test('Move die appears before Reroll', () => {
        renderPanel({ availableActions: ['move-die', 'reroll'] });
        const buttons = screen.getAllByRole('button');
        const labels = buttons.map((b) => b.textContent);
        expect(labels.indexOf('Move die')).toBeLessThan(labels.indexOf('Reroll'));
    });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('ActionPanel — disabled state', () => {
    test('button is disabled when action not in availableActions', () => {
        renderPanel({ availableActions: ['move-die'] });
        expect(screen.getByTestId('action-btn-reroll')).toBeDisabled();
    });

    test('button is enabled when action is in availableActions', () => {
        renderPanel({ availableActions: ['move-die', 'reroll'] });
        expect(screen.getByTestId('action-btn-move-die')).not.toBeDisabled();
        expect(screen.getByTestId('action-btn-reroll')).not.toBeDisabled();
    });
});

// ---------------------------------------------------------------------------
// Active / aria-pressed
// ---------------------------------------------------------------------------

describe('ActionPanel — active action', () => {
    test('active action button has aria-pressed=true', () => {
        renderPanel({ availableActions: ['move-die', 'reroll'], activeAction: 'move-die' });
        expect(screen.getByTestId('action-btn-move-die').getAttribute('aria-pressed')).toBe('true');
    });

    test('non-active buttons have aria-pressed=false', () => {
        renderPanel({ availableActions: ['move-die', 'reroll'], activeAction: 'move-die' });
        expect(screen.getByTestId('action-btn-reroll').getAttribute('aria-pressed')).toBe('false');
    });

    test('no button pressed when activeAction is null', () => {
        renderPanel({ availableActions: ['move-die', 'reroll'], activeAction: null });
        const pressed = screen.getAllByRole('button').filter(
            (b) => b.getAttribute('aria-pressed') === 'true',
        );
        expect(pressed).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

describe('ActionPanel — interaction', () => {
    test('clicking an enabled button calls onActionSelect with its key', () => {
        const onActionSelect = vi.fn();
        renderPanel({ availableActions: ['move-die', 'reroll'], onActionSelect });
        fireEvent.click(screen.getByTestId('action-btn-reroll'));
        expect(onActionSelect).toHaveBeenCalledWith('reroll');
    });

    test('clicking a disabled button does not call onActionSelect', () => {
        const onActionSelect = vi.fn();
        renderPanel({ availableActions: ['move-die'], onActionSelect });
        fireEvent.click(screen.getByTestId('action-btn-reroll'));
        expect(onActionSelect).not.toHaveBeenCalled();
    });

    test('clicking the active action calls onActionSelect again', () => {
        const onActionSelect = vi.fn();
        renderPanel({
            availableActions: ['move-die', 'reroll'],
            activeAction:     'move-die',
            onActionSelect,
        });
        fireEvent.click(screen.getByTestId('action-btn-move-die'));
        expect(onActionSelect).toHaveBeenCalledWith('move-die');
    });
});
