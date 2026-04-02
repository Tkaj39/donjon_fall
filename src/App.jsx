/**
 * App component — root application component.
 * Phase 9.1 — top-level screen state machine.
 *
 * Screen flow:
 *   splash → mainMenu → mapSelection → playerSetup → gameLoading → game
 */

import { useState } from 'react';
import { Game } from './components/Game.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';
import { MainMenu } from './components/MainMenu.jsx';
import { MapSelection } from './components/MapSelection.jsx';

/**
 * @typedef {'splash'|'mainMenu'|'mapSelection'|'playerSetup'|'gameLoading'|'game'} Screen
 */

/**
 * Root application component — manages screen transitions.
 *
 * @returns {JSX.Element}
 */
export function App() {
    /** @type {[Screen, Function]} */
    const [screen, setScreen] = useState('splash');

    /** @type {[import('./game/boardDefinition.js').BoardDefinition|null, Function]} */
    const [selectedMap, setSelectedMap] = useState(null);

    const navigate = (/** @type {Screen} */ target) => setScreen(target);

    switch (screen) {
        case 'splash':
            return <SplashScreen onDone={() => navigate('mainMenu')} />;
        case 'mainMenu':
            return <MainMenu onPlay={() => navigate('mapSelection')} />;
        case 'mapSelection':
            return (
                <MapSelection
                    onSelect={(map) => { setSelectedMap(map); navigate('playerSetup'); }}
                    onBack={() => navigate('mainMenu')}
                />
            );
        case 'game':
            return <Game />;
        default:
            return <Game />;
    }
}