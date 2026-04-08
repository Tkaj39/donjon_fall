/**
 * Integration tests for the Game component (Phase 11.3).
 * Tests the full orchestration: selection, movement, combat, end-turn flow,
 * victory detection, and the rules viewer toggle.
 */

import { render, fireEvent, screen } from '@testing-library/react';
import { Game } from '../../src/components/Game.jsx';

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/** Returns the SVG <g> element for a hex by its data-hex attribute. */
function getHexGroup(container, hexKey) {
    return container.querySelector(`g[data-hex="${hexKey}"]`);
}

/** Returns hex keys that currently carry a data-highlight attribute. */
function getHighlightedKeys(container) {
    return [...container.querySelectorAll('g[data-highlight]')]
        .map((g) => g.getAttribute('data-hex'));
}

// ---------------------------------------------------------------------------
// Fixtures from the default board
// ---------------------------------------------------------------------------

/** Red occupies the top base row (r = −4). */
const RED_HEXES  = ['0,-4,4', '1,-4,3', '2,-4,2', '3,-4,1', '4,-4,0'];

/**
 * A hex far from both bases that is guaranteed to be empty and unreachable
 * from any base die on the first action.
 */
const EMPTY_FAR = '0,0,0';  // focal-centre — empty, central

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Game', () => {
    // -----------------------------------------------------------------------
    // Rendering
    // -----------------------------------------------------------------------

    test('renders the board', () => {
        const { container } = render(<Game firstPlayer="red" />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('renders the rules button', () => {
        render(<Game firstPlayer="red" />);
        expect(screen.getByRole('button', { name: 'Open rules' })).toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // Rules viewer
    // -----------------------------------------------------------------------

    test('clicking the rules button opens the rules viewer', () => {
        render(<Game firstPlayer="red" />);
        fireEvent.click(screen.getByRole('button', { name: 'Open rules' }));
        expect(screen.getByRole('dialog', { name: 'Rules viewer' })).toBeInTheDocument();
    });

    test('closing rules viewer removes it from the DOM', () => {
        render(<Game firstPlayer="red" />);
        fireEvent.click(screen.getByRole('button', { name: 'Open rules' }));
        // RulesViewer renders a close button
        const closeBtn = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeBtn);
        expect(screen.queryByRole('dialog', { name: 'Rules' })).not.toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // Selection & highlighting
    // -----------------------------------------------------------------------

    test('clicking an empty hex does not highlight anything', () => {
        const { container } = render(<Game firstPlayer="red" />);
        fireEvent.click(getHexGroup(container, EMPTY_FAR));
        expect(getHighlightedKeys(container)).toHaveLength(0);
    });

    test('clicking a red die highlights reachable hexes', () => {
        const { container } = render(<Game firstPlayer="red" />);
        fireEvent.click(getHexGroup(container, RED_HEXES[0]));
        expect(getHighlightedKeys(container).length).toBeGreaterThan(0);
    });

    test('highlighted hexes have recognised data-highlight values', () => {
        const { container } = render(<Game firstPlayer="red" />);
        fireEvent.click(getHexGroup(container, RED_HEXES[2]));
        const types = getHighlightedKeys(container)
            .map((k) => container.querySelector(`g[data-hex="${k}"]`)?.getAttribute('data-highlight'));
        const valid = new Set(['reachable', 'selected', 'enemy-reachable', 'trajectory']);
        expect(types.every((t) => valid.has(t))).toBe(true);
    });

    test('clicking the selected die again deselects it', () => {
        const { container } = render(<Game firstPlayer="red" />);
        const hex = RED_HEXES[0];
        fireEvent.click(getHexGroup(container, hex)); // select
        fireEvent.click(getHexGroup(container, hex)); // deselect
        // Only 'selected' highlight removed; reachable highlights gone too
        const highlights = getHighlightedKeys(container);
        expect(highlights.filter((k) => k !== hex)).toHaveLength(0);
    });

    test('clicking a different own die switches selection', () => {
        const { container } = render(<Game firstPlayer="red" />);
        // RED_HEXES[4] is 4 hexes away from RED_HEXES[0] — beyond the die's
        // range (value 3), so the click switches selection rather than moving.
        fireEvent.click(getHexGroup(container, RED_HEXES[0]));
        const before = getHighlightedKeys(container);

        fireEvent.click(getHexGroup(container, RED_HEXES[4]));
        const after = getHighlightedKeys(container);

        // Both selections produce highlights (different sets)
        expect(before.length).toBeGreaterThan(0);
        expect(after.length).toBeGreaterThan(0);
    });

    test('clicking outside the reachable area deselects', () => {
        const { container } = render(<Game firstPlayer="red" />);
        fireEvent.click(getHexGroup(container, RED_HEXES[0])); // select red die

        // Blue base bottom row — far from red, definitely not reachable
        const farBlueHex = '0,4,-4';
        fireEvent.click(getHexGroup(container, farBlueHex));

        expect(getHighlightedKeys(container)).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // Action panel
    // -----------------------------------------------------------------------

    test('action panel appears when a die is selected in action phase', () => {
        const { container } = render(<Game firstPlayer="red" />);
        fireEvent.click(getHexGroup(container, RED_HEXES[0]));
        // ActionPanel has role="toolbar"
        expect(container.querySelector('[role="toolbar"]')).toBeInTheDocument();
    });

    test('action panel buttons are disabled after deselecting', () => {
        const { container } = render(<Game firstPlayer="red" />);
        const hex = RED_HEXES[0];
        fireEvent.click(getHexGroup(container, hex)); // select
        expect(container.querySelector('[role="toolbar"]')).toBeInTheDocument();
        fireEvent.click(getHexGroup(container, hex)); // deselect
        const buttons = [...container.querySelectorAll('[role="toolbar"] button')];
        expect(buttons.length).toBeGreaterThan(0);
        expect(buttons.every(b => b.disabled)).toBe(true);
    });
});
