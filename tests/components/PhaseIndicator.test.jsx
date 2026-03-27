/**
 * Tests for the PhaseIndicator component (Phase 7.4).
 */

import { render, screen } from '@testing-library/react';
import { PhaseIndicator } from '../../src/components/PhaseIndicator.jsx';

describe('PhaseIndicator', () => {
    test('renders a status region with accessible label', () => {
        render(<PhaseIndicator phase="action" currentPlayer="red" />);
        expect(screen.getByRole('status', { name: /phase indicator/i })).toBeDefined();
    });

    test('displays the current player name', () => {
        render(<PhaseIndicator phase="action" currentPlayer="red" />);
        expect(screen.getByTestId('current-player').textContent).toBe('red');
    });

    test('displays the current player name for blue', () => {
        render(<PhaseIndicator phase="focal" currentPlayer="blue" />);
        expect(screen.getByTestId('current-player').textContent).toBe('blue');
    });

    test.each([
        ['focal',   'Focal Points'],
        ['action',  'Action'],
        ['combat',  'Combat'],
        ['victory', 'Victory'],
    ])('phase "%s" renders label "%s"', (phase, label) => {
        render(<PhaseIndicator phase={phase} currentPlayer="red" />);
        expect(screen.getByTestId('current-phase').textContent).toBe(label);
    });

    test('renders unknown phase as-is', () => {
        render(<PhaseIndicator phase="unknown-phase" currentPlayer="red" />);
        expect(screen.getByTestId('current-phase').textContent).toBe('unknown-phase');
    });

    test('renders unknown player without crashing', () => {
        render(<PhaseIndicator phase="action" currentPlayer="green" />);
        expect(screen.getByTestId('current-player').textContent).toBe('green');
    });
});
