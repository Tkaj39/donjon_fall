/**
 * MapSelection component — lets the player pick a map before the game starts.
 * Phase 9.4
 */

import { ALL_MAPS } from '../game/boardDefinition.js';

/**
 * Placeholder thumbnail shown until a real preview asset is available.
 *
 * @returns {JSX.Element}
 */
function MapThumbnail() {
    return (
        <div className="w-full h-28 bg-stone-700 rounded-md flex items-center justify-center text-stone-500 text-xs mb-3">
            MAP PREVIEW
        </div>
    );
}

/**
 * @param {Object}  props
 * @param {import('../game/boardDefinition.js').BoardDefinition} props.map
 * @param {() => void} props.onSelect
 * @returns {JSX.Element}
 */
function MapCard({ map, onSelect }) {
    const players =
        map.minPlayers === map.maxPlayers
            ? `${map.minPlayers} players`
            : `${map.minPlayers}–${map.maxPlayers} players`;

    return (
        <button
            onClick={onSelect}
            className="bg-stone-800 hover:bg-stone-700 border border-stone-600 hover:border-stone-400 rounded-xl p-4 text-left transition-colors w-full"
        >
            <MapThumbnail />
            <p className="text-white font-semibold text-base">{map.name}</p>
            <p className="text-stone-400 text-sm mt-1">{players}</p>
            <p className="text-stone-400 text-sm">First to {map.victoryPoints} VP</p>
        </button>
    );
}

/**
 * @param {{ onSelect: (map: import('../game/boardDefinition.js').BoardDefinition) => void, onBack: () => void }} props
 * @returns {JSX.Element}
 */
export function MapSelection({ onSelect, onBack }) {
    return (
        <div className="flex flex-col items-center min-h-screen bg-stone-900 text-white p-8">
            <div className="w-full max-w-lg">
                <button
                    onClick={onBack}
                    className="text-stone-400 hover:text-white text-sm mb-6 transition-colors"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-bold tracking-wide uppercase mb-6">Select Map</h2>

                <div className="flex flex-col gap-4">
                    {ALL_MAPS.map(map => (
                        <MapCard key={map.id} map={map} onSelect={() => onSelect(map)} />
                    ))}
                </div>
            </div>
        </div>
    );
}