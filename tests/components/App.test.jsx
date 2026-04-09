/**
 * Integration tests for the App component (Phase 4.4).
 * Tests click-driven selection and movement highlight overlay.
 */

import { render, fireEvent, within } from '@testing-library/react';
import { Game } from '../../src/components/Game.jsx';

/** Red base hex keys — red occupies the top row (r = -4). */
const RED_HEXES = ['0,-4,4', '1,-4,3', '2,-4,2', '3,-4,1', '4,-4,0'];

/** A known empty hex in the middle of the board (focal center — no die). */
const EMPTY_CENTER = '0,0,0';

function getHexGroup(container, hexKey) {
    return container.querySelector(`g[data-hex="${hexKey}"]`);
}

function getHighlightedKeys(container) {
    return [...container.querySelectorAll('g[data-highlight]')]
        .map(g => g.getAttribute('data-hex'));
}

describe('App', () => {
    test('renders the board', () => {
        const { container } = render(<Game firstPlayer="red" />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('clicking an empty hex does nothing', () => {
        const { container } = render(<Game firstPlayer="red" />);
        const g = getHexGroup(container, EMPTY_CENTER);
        fireEvent.click(g);
        expect(getHighlightedKeys(container)).toHaveLength(0);
    });

    test('clicking a red die highlights reachable hexes', () => {
        const { container } = render(<Game firstPlayer="red" />);
        const redHex = RED_HEXES[0];
        fireEvent.click(getHexGroup(container, redHex));
        expect(getHighlightedKeys(container).length).toBeGreaterThan(0);
    });

    test('clicking the same red die again deselects (no highlights)', () => {
        const { container } = render(<Game firstPlayer="red" />);
        const redHex = RED_HEXES[0];
        fireEvent.click(getHexGroup(container, redHex)); // select
        fireEvent.click(getHexGroup(container, redHex)); // deselect
        expect(getHighlightedKeys(container)).toHaveLength(0);
    });

    test('clicking a different own die switches selection', () => {
        const { container } = render(<Game firstPlayer="red" />);
        const first = RED_HEXES[0];
        // RED_HEXES[4] is 4 hexes away — beyond the die's range (value 3) so the
        // click switches selection rather than dispatching a move.
        const second = RED_HEXES[4];
        fireEvent.click(getHexGroup(container, first));  // select first
        fireEvent.click(getHexGroup(container, second)); // switch to second
        // Second die is now selected — clicking it again should deselect (no highlights)
        expect(getHighlightedKeys(container).length).toBeGreaterThan(0);
        fireEvent.click(getHexGroup(container, second)); // deselect
        expect(getHighlightedKeys(container)).toHaveLength(0);
    });

    test('reachable hexes have data-highlight attribute', () => {
        const { container } = render(<Game firstPlayer="red" />);
        fireEvent.click(getHexGroup(container, RED_HEXES[2]));
        const highlighted = container.querySelectorAll('g[data-highlight]');
        const types = [...highlighted].map(g => g.getAttribute('data-highlight'));
        // Should contain 'reachable' and/or 'enemy-reachable' (or 'selected' for the chosen hex)
        const validTypes = new Set(['reachable', 'enemy-reachable', 'trajectory', 'selected']);
        expect(types.every(t => validTypes.has(t))).toBe(true);
    });

    test('clicking away from reachable area deselects', () => {
        const { container } = render(<Game firstPlayer="red" />);
        fireEvent.click(getHexGroup(container, RED_HEXES[0])); // select
        // Click a hex outside the reachable area — a blue hex is definitely not reachable from red base
        const blueHex = '0,4,-4';
        fireEvent.click(getHexGroup(container, blueHex));
        // After clicking a blue die (enemy), selection should clear
        expect(getHighlightedKeys(container)).toHaveLength(0);
    });
});
