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

    it('renders "Tutorial" disabled button', () => {
        renderMenu();
        const btn = screen.getByText('Tutorial').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('renders "Rules" button (enabled)', () => {
        renderMenu();
        const btn = screen.getByText('Rules').closest('button');
        expect(btn).not.toHaveAttribute('disabled');
    });

    it('renders "Statistics" disabled button', () => {
        renderMenu();
        const btn = screen.getByText('Statistics').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('renders "Leaderboard" disabled button', () => {
        renderMenu();
        const btn = screen.getByText('Leaderboard').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('renders "Achievements" disabled button', () => {
        renderMenu();
        const btn = screen.getByText('Achievements').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('renders "Settings" disabled button with submenu indicator', () => {
        renderMenu();
        const btn = screen.getByText('Settings').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('renders "Map Editor" disabled button', () => {
        renderMenu();
        const btn = screen.getByText('Map Editor').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('renders "Credits" disabled button', () => {
        renderMenu();
        const btn = screen.getByText('Credits').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });
});

describe('MainMenu — Start submenu', () => {
    it('Start submenu is initially hidden', () => {
        renderMenu();
        expect(screen.queryByText('Quick Start')).toBeNull();
    });

    it('clicking Start toggles submenu open', () => {
        renderMenu();
        const startButton = screen.getByText('Start').closest('button');
        fireEvent.click(startButton);
        expect(screen.getByText('Quick Start')).toBeDefined();
    });

    it('clicking Start twice toggles submenu closed', () => {
        renderMenu();
        const startButton = screen.getByText('Start').closest('button');
        fireEvent.click(startButton);
        fireEvent.click(startButton);
        expect(screen.queryByText('Quick Start')).toBeNull();
    });

    it('submenu contains "Quick Start" button', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        const btn = screen.getByText('Quick Start').closest('button');
        expect(btn).not.toHaveAttribute('disabled');
    });

    it('submenu contains "Start" button (enabled)', () => {
        renderMenu();
        fireEvent.click(screen.getAllByText('Start')[0].closest('button'));
        const buttons = screen.getAllByText('Start');
        // First is the parent button, second is the submenu item
        expect(buttons).toHaveLength(2);
    });

    it('submenu contains "Start vs Bot" disabled button', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        const btn = screen.getByText('Start vs Bot').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('submenu contains "Online" disabled button', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        const btn = screen.getByText('Online').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('submenu contains "Daily Challenge" disabled button', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        const btn = screen.getByText('Daily Challenge').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });

    it('submenu contains "Campaign" disabled button', () => {
        renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        const btn = screen.getByText('Campaign').closest('button');
        expect(btn).toHaveAttribute('disabled');
    });
});

describe('MainMenu — callback functions', () => {
    it('clicking "Quick Start" calls onDirectPlay', () => {
        const { props } = renderMenu();
        fireEvent.click(screen.getByText('Start').closest('button'));
        fireEvent.click(screen.getByText('Quick Start').closest('button'));
        expect(props.onDirectPlay).toHaveBeenCalledTimes(1);
    });

    it('clicking submenu "Start" calls onPlay', () => {
        const { props } = renderMenu();
        fireEvent.click(screen.getAllByText('Start')[0].closest('button'));
        const startButtons = screen.getAllByText('Start').map(el => el.closest('button'));
        fireEvent.click(startButtons[1]); // Second "Start" is the submenu item
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
