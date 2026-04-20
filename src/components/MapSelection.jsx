/**
 * MapSelection component — lets the player pick a map before the game starts.
 * Phase 9.4
 */

import { ALL_MAPS } from "../game/boardDefinition.js";
import { MenuSidebar } from "./MainMenu.jsx";

/**
 * Placeholder thumbnail shown until a real preview asset is available.
 */
function MapThumbnail() {
    return (
        <div className="w-full h-28 bg-stone-900/60 rounded flex items-center justify-center text-stone-600 text-xs mb-3 border border-stone-700">
            MAP PREVIEW
        </div>
    );
}

/**
 * @param {{ map: import("../game/boardDefinition.js").BoardDefinition, onSelect: () => void }} props
 */
function MapCard({ map, onSelect }) {
    const players =
        map.minPlayers === map.maxPlayers
            ? `${map.minPlayers} hráči`
            : `${map.minPlayers}–${map.maxPlayers} hráči`;

    return (
        <div className="frame-panel p-5 flex flex-col gap-3">
            <MapThumbnail />
            <p className="text-stone-200 font-semibold text-base tracking-wide">{map.name}</p>
            <p className="text-stone-400 text-sm">{players} · První na {map.victoryPoints} VP</p>
            <button
                onClick={onSelect}
                className="btn-frame-sm self-end px-6 py-2 text-sm font-semibold tracking-wide text-stone-200 cursor-pointer"
            >
                Vybrat
            </button>
        </div>
    );
}

/**
 * @param {{ onSelect: (map: import("../game/boardDefinition.js").BoardDefinition) => void, onBack: () => void }} props
 */
export function MapSelection({ onSelect, onBack }) {
    return (
        <div className="flex min-h-screen text-white">
            <MenuSidebar footer={
                <button
                    onClick={onBack}
                    className="btn-frame w-full py-4 text-xl font-semibold tracking-wide text-stone-300 cursor-pointer text-center"
                >
                    Zpět
                </button>
            }>
                <p className="text-stone-500 text-xs uppercase tracking-widest text-center pt-2">
                    Výběr mapy
                </p>
            </MenuSidebar>

            <main className="flex flex-col items-center justify-center grow p-8">
                <div className="w-full max-w-lg">
                    <h2 className="text-2xl font-bold tracking-widest uppercase text-stone-300 mb-6 text-center">
                        Vyberte mapu
                    </h2>
                    <div className="flex flex-col gap-4">
                        {ALL_MAPS.map(map => (
                            <MapCard key={map.id} map={map} onSelect={() => onSelect(map)} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
