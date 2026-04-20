/**
 * PlayerSetup component — collects name and coat of arms for each player.
 * Phase 9.5
 */

import { useState } from "react";
import { ANIMAL_OPTIONS, SHIELD_BY_PLAYER } from "../styles/themes/default.js";
import { NAMED_PLAYER_COLORS } from "./Board.jsx";
import { MenuSidebar } from "./MainMenu.jsx";

/**
 * @typedef {Object} PlayerConfig
 * @property {string} id         - Player ID matching the startingField owner (e.g. "red", "blue").
 * @property {string} name       - Display name entered by the player.
 * @property {string} coatOfArms - Selected coat of arms key.
 */

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CoatOfArmsTile({ id, label, animalHref, shieldHref, selected, onSelect }) {
    return (
        <button
            onClick={onSelect}
            aria-label={label}
            aria-pressed={selected}
            className="relative w-14 cursor-pointer transition-all"
            style={{
                filter: selected
                    ? "drop-shadow(0 0 6px rgba(251,191,36,0.9)) drop-shadow(0 0 12px rgba(251,191,36,0.5))"
                    : "none",
                opacity: selected ? 1 : 0.55,
            }}
        >
            <img src={shieldHref} alt="" className="w-full h-full object-contain" />
            <img src={animalHref} alt={label} className="absolute inset-0 w-full h-full object-contain p-1" />
        </button>
    );
}

function PlayerSlot({ playerId, config, onChange }) {
    const palette = NAMED_PLAYER_COLORS[playerId] ?? NAMED_PLAYER_COLORS.default;
    const shieldHref = SHIELD_BY_PLAYER[playerId] ?? SHIELD_BY_PLAYER.blue;
    const playerLabel = playerId.charAt(0).toUpperCase() + playerId.slice(1);

    return (
        <div className="frame-panel p-6 flex flex-col gap-4">
            {/* Shield + inline name input */}
            <div className="flex items-center gap-3">
                <img src={shieldHref} alt={playerLabel} className="w-8 h-auto object-contain shrink-0" />
                <input
                    type="text"
                    value={config.name}
                    onChange={e => onChange({ name: e.target.value })}
                    maxLength={24}
                    placeholder="Zadej jméno…"
                    className="grow bg-stone-900/80 border border-stone-600 focus:border-amber-600 focus:outline-none rounded px-3 py-2 text-stone-100 text-sm tracking-wide transition-colors"
                />
            </div>

            {/* Coat of arms picker */}
            <div>
                <label className="block text-stone-500 text-xs uppercase tracking-widest mb-2 text-center">Choice of coats of arms</label>
                <div className="flex justify-between px-4">
                    {ANIMAL_OPTIONS.map(animal => (
                        <CoatOfArmsTile
                            key={animal.id}
                            id={animal.id}
                            label={animal.label}
                            animalHref={animal.href}
                            shieldHref={shieldHref}
                            selected={config.coatOfArms === animal.id}
                            onSelect={() => onChange({ coatOfArms: animal.id })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function derivePlayerIds(map) {
    const seen = new Set();
    const ids = [];
    for (const field of map.fields) {
        for (const prop of field.properties) {
            if (prop.type === "startingField" && !seen.has(prop.owner)) {
                seen.add(prop.owner);
                ids.push(prop.owner);
            }
        }
    }
    return ids;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * @param {{
 *   map: import("../game/boardDefinition.js").BoardDefinition,
 *   onConfirm: (players: PlayerConfig[]) => void,
 *   onBack: () => void,
 * }} props
 */
export function PlayerSetup({ map, onConfirm, onBack }) {
    const playerIds = derivePlayerIds(map);

    const [configs, setConfigs] = useState(
        /** @type {PlayerConfig[]} */ (
            playerIds.map(id => ({
                id,
                name: id.charAt(0).toUpperCase() + id.slice(1),
                coatOfArms: ANIMAL_OPTIONS[0].id,
            }))
        ),
    );

    function updateConfig(index, patch) {
        setConfigs(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    }

    const allNamed = configs.every(c => c.name.trim().length > 0);

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
                    Nastavení hráčů
                </p>
            </MenuSidebar>

            <main className="flex flex-col items-center justify-center grow p-8">
                <div className="w-full max-w-lg flex flex-col gap-5">
                    <h2 className="text-2xl font-bold tracking-widest uppercase text-stone-300 text-center">
                        Hráči
                    </h2>

                    {configs.map((config, i) => (
                        <PlayerSlot
                            key={config.id}
                            playerId={config.id}
                            config={config}
                            onChange={patch => updateConfig(i, patch)}
                        />
                    ))}

                    <button
                        onClick={() => onConfirm(configs)}
                        disabled={!allNamed}
                        className={`btn-frame w-full py-4 text-lg font-bold tracking-widest text-stone-200 cursor-pointer ${!allNamed ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                        Spustit hru
                    </button>
                </div>
            </main>
        </div>
    );
}
