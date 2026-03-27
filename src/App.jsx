/**
 * App component — root application component.
 * Phase 11.3 — delegates entirely to the Game orchestrator.
 */

import { Game } from './components/Game.jsx';

/**
 * Root application component.
 *
 * @returns {JSX.Element}
 */
export function App() {
    return <Game />;
}

