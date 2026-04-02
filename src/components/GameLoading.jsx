/**
 * GameLoading component — brief summary screen before the game starts.
 * Phase 9.6
 *
 * Shows each player's name, color, and coat of arms while createInitialState
 * runs and assets are prepared, then calls onDone.
 */

import { useEffect } from 'react';
import { createInitialState } from '../game/gameState.js';

/** How long to show the loading screen before entering the game. */
const LOADING_DURATION_MS = 1800;

/** Color display config per player ID — matches PlayerSetup. */
const PLAYER_COLOR = {
    red:  { bg: 'bg-red-700',  label: 'Red'  },
    blue: { bg: 'bg-blue-700', label: 'Blue' },
};

/**
 * @param {Object}  props
 * @param {import('./PlayerSetup.jsx').PlayerConfig[]} props.playerConfigs
 * @param {import('../game/boardDefinition.js').BoardDefinition} props.map
 * @param {(players: string[], boardFields: import('../hex/fieldProperties.js').HexField[]) => void} props.onDone
 * @returns {JSX.Element}
 */
export function GameLoading({ playerConfigs, map, onDone }) {
    useEffect(() => {
        // Run createInitialState eagerly to catch any errors before the game screen mounts.
        const playerIds = playerConfigs.map(c => c.id);
        createInitialState(playerIds, map.fields);

        const timer = setTimeout(() => onDone(playerIds, map.fields), LOADING_DURATION_MS);
        return () => clearTimeout(timer);
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-white p-8">
            <p className="text-stone-400 text-sm uppercase tracking-widest mb-10">Get ready…</p>

            <div className="flex flex-col gap-6 w-full max-w-xs">
                {playerConfigs.map(config => {
                    const color = PLAYER_COLOR[config.id] ?? { bg: 'bg-stone-600', label: config.id };
                    return (
                        <div key={config.id} className="flex items-center gap-4">
                            {/* Color + coat of arms placeholder */}
                            <div className={`w-14 h-14 rounded-xl ${color.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {/* Placeholder — replace with coat of arms asset */}
                                {config.coatOfArms.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-semibold text-lg leading-tight">{config.name}</p>
                                <p className="text-stone-400 text-sm">{color.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}