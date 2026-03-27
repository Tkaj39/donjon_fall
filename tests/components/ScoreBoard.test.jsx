/**
 * Tests for the ScoreBoard component (Phase 7.3).
 */

import { render, screen } from '@testing-library/react';
import { ScoreBoard } from '../../src/components/ScoreBoard.jsx';

const PLAYERS = ['red', 'blue'];
const SCORES  = { red: 3, blue: 1 };

describe('ScoreBoard', () => {
    test('renders a region with accessible label', () => {
        render(<ScoreBoard players={PLAYERS} scores={SCORES} />);
        expect(screen.getByRole('region', { name: /score board/i })).toBeDefined();
    });

    test('renders a score entry for each player', () => {
        render(<ScoreBoard players={PLAYERS} scores={SCORES} />);
        expect(screen.getByTestId('score-red')).toBeDefined();
        expect(screen.getByTestId('score-blue')).toBeDefined();
    });

    test('displays correct VP value for each player', () => {
        render(<ScoreBoard players={PLAYERS} scores={SCORES} />);
        expect(screen.getByTestId('score-value-red').textContent).toBe('3');
        expect(screen.getByTestId('score-value-blue').textContent).toBe('1');
    });

    test('displays 0 when player has no score entry', () => {
        render(<ScoreBoard players={['red']} scores={{}} />);
        expect(screen.getByTestId('score-value-red').textContent).toBe('0');
    });

    test('renders players in given order', () => {
        const { container } = render(<ScoreBoard players={['blue', 'red']} scores={SCORES} />);
        const entries = container.querySelectorAll('[data-testid^="score-value-"]');
        expect(entries[0].textContent).toBe('1');  // blue first
        expect(entries[1].textContent).toBe('3');  // red second
    });

    test('handles more than two players', () => {
        const players = ['red', 'blue', 'green'];
        const scores  = { red: 2, blue: 4, green: 0 };
        render(<ScoreBoard players={players} scores={scores} />);
        expect(screen.getByTestId('score-value-red').textContent).toBe('2');
        expect(screen.getByTestId('score-value-blue').textContent).toBe('4');
        expect(screen.getByTestId('score-value-green').textContent).toBe('0');
    });

    test('shows player ID label for each player', () => {
        render(<ScoreBoard players={PLAYERS} scores={SCORES} />);
        expect(screen.getByText('red')).toBeDefined();
        expect(screen.getByText('blue')).toBeDefined();
    });
});
