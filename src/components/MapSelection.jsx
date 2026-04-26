/**
 * MapSelection component — lets the player pick a map before the game starts.
 * Phase 9.4
 */

import { ALL_MAPS } from "../game/boardDefinition.js";
import { MenuSidebar } from "./MainMenu.jsx";
import mapStartImg from "../assets/map-start.png";

/**
 * @param {{ map: import("../game/boardDefinition.js").BoardDefinition, onSelect: () => void }} props
 */
function MapCard({ map, onSelect }) {
    const players =
        map.minPlayers === map.maxPlayers
            ? `${map.minPlayers} hráči`
            : `${map.minPlayers}–${map.maxPlayers} hráči`;

    return (
        <div className="frame-panel flex flex-col">
            {/* Image with gradient overlay and title */}
            <div className="relative mx-4 mt-4 overflow-hidden" style={{clipPath: "polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 18px)"}}>
                <img src={mapStartImg} alt={map.name} className="w-full h-44 object-cover" />
                <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(10,6,3,0.92) 0%, rgba(10,6,3,0.3) 50%, transparent 100%)" }}
                />
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                    <h3 className="text-xl font-bold tracking-widest uppercase text-stone-100">{map.name}</h3>
                </div>
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between px-8 py-4">
                <div className="flex gap-4 text-stone-400 text-sm">
                    <span>{players}</span>
                    <span className="text-stone-600">·</span>
                    <span>První na <span className="text-amber-400 font-semibold">{map.victoryPoints} VP</span></span>
                </div>
                <button
                    onClick={onSelect}
                    className="btn-frame-sm px-6 py-2 text-sm font-semibold tracking-wide text-stone-200 cursor-pointer"
                >
                    Vybrat
                </button>
            </div>
        </div>
    );
}

/**
 * @param {{ onSelect: (map: import("../game/boardDefinition.js").BoardDefinition) => void, onBack: () => void }} props
 */
export function MapSelection({ onSelect, onBack }) {
    const cards = ALL_MAPS.map(map => (
        <MapCard key={map.id} map={map} onSelect={() => onSelect(map)} />
    ));

    return (
        <>
            {/* ── Mobile layout ───────────────────────────────── */}
            <div className="lg:hidden min-h-dvh flex flex-col text-white">
                <header className="flex justify-start p-4 shrink-0">
                    <button
                        onClick={onBack}
                        className="btn-frame-sm px-3 py-2 text-xs font-semibold tracking-widest text-stone-300 cursor-pointer"
                    >
                        ← Zpět
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-4 pb-8">
                    <h2 className="text-xl font-bold tracking-widest uppercase text-stone-300 text-center mb-4">
                        Výběr mapy
                    </h2>
                    <div className="flex flex-col gap-4">
                        {cards}
                    </div>
                </div>
            </div>

            {/* ── Desktop layout ───────────────────────────────── */}
            <div className="hidden lg:flex min-h-screen text-white">
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
                    <div className="w-full max-w-lg flex flex-col gap-5">
                        {cards}
                    </div>
                </main>
            </div>
        </>
    );
}
