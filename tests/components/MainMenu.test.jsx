/**
 * Tests for the MainMenu component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainMenu } from '../../src/components/MainMenu.jsx';

// Mock dependencies
vi.mock('../../src/components/Logo.jsx', () => ({
    Logo: ({ className }) => <div data-testid="logo" className={className} />,
}));

vi.mock('../../src/components/RulesViewer.jsx', () => ({
    RulesViewer: ({ onClose }) => (
        <div data-testid="rules-viewer">
            <button onClick={onClose}>Close Rules</button>
        </div>
    ),
}));

/** Helper to render MainMenu with default callbacks. */
function renderMenu(overrides = {}) {
    const defaults = {
        onPlay: vi.fn(),
        onDirectPlay: vi.fn(),
    };
    const props = { ...defaults, ...overrides };
    return { ...render(<MainMenu {...props} />), props };
}

describe('MainMenu — basic rendering', () => {
    it('renders the Logo component', () => {
        renderMenu();
        expect(screen.getByTestId('logo')).toBeDefined();
    });

    it('renders sidebar navigation', () => {
        const { container } = renderMenu();
        const nav = container.querySelector('nav');
        expect(nav).toBeDefined();
    });

    it('renders version text in footer', () => {
        renderMenu();
        expect(screen.getByText(/v0.1.0/)).toBeDefined();
    });

    it('renders GitHub link in footer', () => {
        renderMenu();
        const link = screen.getByText('GitHub');
        expect(link).toBeDefined();
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', 'https://github.com/Tkaj39/donjon_fall');
    });
});

describe('MainMenu — menu items', () => {
    it('renders "Start" menu button', () => {
        renderMenu();
        expect(screen.getByText('Start')).toBeDefined();
    });

    it('renders "Continue" disabled button', () => {
        renderMenu();
        const btn = screen.getByText('Continue').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('renders "Tutorial" enabled button', () => {
        renderMenu();
        const btn = screen.getByText('Tutorial').closest('button');
        expect(btn).not.toHaveAttribute('disabled');
    });

    it('renders "Rules" button (enabled)', () => {
        renderMenu();
        const btn = screen.getByText('Rules').closest('button');
        expect(btn).not.toHaveAttribute('disabled');
    });

    it('renders "Settings" enabled button', () => {
        renderMenu();
        const btn = screen.getByText('Settings').closest('button');
        expect(btn).not.toHaveAttribute('disabled');
    });
});

describe('MainMenu — Start screen', () => {
    it('Start screen is initially hidden', () => {
        renderMenu();
        expect(screen.queryByText('Quick Start')).toBeNull();
    });

    it('clicking Start navigates to Start screen', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        expect(screen.getByText('Quick Start')).toBeDefined();
    });

    it('Start screen contains "Quick Start" enabled button', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        const btn = screen.getByText('Quick Start').closest('button');
        expect(btn).not.toHaveAttribute('disabled');
    });

    it('Start screen contains "Configure Game" enabled button', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        const btn = screen.getByText('Configure Game').closest('button');
        expect(btn).not.toHaveAttribute('disabled');
    });

    it('clicking Back returns to main menu', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        fireEvent.click(screen.getByText('Back').closest('button'));
        expect(screen.queryByText('Quick Start')).toBeNull();
        expect(screen.getByText('Continue')).toBeDefined();
    });
});

describe('MainMenu — callback functions', () => {
    it('clicking "Quick Start" calls onDirectPlay', () => {
        const { props } = renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        fireEvent.click(screen.getByText('Quick Start').closest('button'));
        expect(props.onDirectPlay).toHaveBeenCalledTimes(1);
    });

    it('clicking "Configure Game" calls onPlay', () => {
        const { props } = renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        fireEvent.click(screen.getByText('Configure Game').closest('button'));
        expect(props.onPlay).toHaveBeenCalledTimes(1);
    });
});

describe('MainMenu — RulesViewer integration', () => {
    it('RulesViewer is initially hidden', () => {
        renderMenu();
        expect(screen.queryByTestId('rules-viewer')).toBeNull();
    });

    it('clicking "Rules" shows RulesViewer', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Rules').closest('button'));
        expect(screen.getByTestId('rules-viewer')).toBeDefined();
    });

    it('closing RulesViewer hides it again', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Rules').closest('button'));
        fireEvent.click(screen.getByText('Close Rules'));
        expect(screen.queryByTestId('rules-viewer')).toBeNull();
    });
});

describe('MainMenu — canvas area', () => {
    it('renders main canvas area with placeholder text', () => {
        renderMenu();
        expect(screen.getByText('Donjon Fall')).toBeDefined();
        expect(screen.getByText('Select an option from the menu')).toBeDefined();
    });
});
