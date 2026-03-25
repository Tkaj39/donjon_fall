/**
 * App component — root application component rendering the game board.
 * Phase 4 — Board visualization.
 */

import { Board } from './components/Board.jsx';

/**
 * Root application component.
 *
 * @returns {JSX.Element}
 */
export function App() {
    return (
        <div className="min-h-screen bg-(--color-bg) flex flex-col items-center py-8 gap-6">
            <h1 className="text-4xl font-bold text-(--color-title)">Donjon Fall</h1>
            <Board />
        </div>
    );
}

