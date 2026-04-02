/**
 * PlayerSetup component — collects name and coat of arms for each player.
 * Phase 9.5
 *
 * One slot is shown per distinct `startingField` owner in the selected map.
 * Color is derived from the owner ID and cannot be changed.
 */

import { useState } from "react";

/**
 * @typedef {Object} PlayerConfig
 * @property {string} id         - Player ID matching the startingField owner (e.g. "red", "blue").
 * @property {string} name       - Display name entered by the player.
 * @property {string} coatOfArms - Selected coat of arms key.
 */

// ---------------------------------------------------------------------------
// Coat of arms options — placeholder labels; designer will replace with assets
// ---------------------------------------------------------------------------

const COATS_OF_ARMS = [
    { id: "tower",  label: "Tower"  },
    { id: "eagle",  label: "Eagle"  },
    { id: "lion",   label: "Lion"   },
    { id: "shield", label: "Shield" },
    { id: "star",   label: "Star"   },
    { id: "cross",  label: "Cross"  },
];

// ---------------------------------------------------------------------------
// Color display config per player ID
// ---------------------------------------------------------------------------

const PLAYER_COLOR = {
    red:  { bg: "bg-red-700",  label: "Red"  },
    blue: { bg: "bg-blue-700", label: "Blue" },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Placeholder coat of arms tile — replace inner content with actual asset.
 *
 * @param {{ id: string, label: string, selected: boolean, onSelect: () => void }} props
 * @returns {JSX.Element}
 */
function CoatOfArmsTile({ id, label, selected, onSelect }) {
    return (
        <button
            onClick={onSelect}
            className={[
                "w-14 h-14 rounded-lg border-2 flex items-center justify-center text-xs font-semibold transition-colors",
                selected
                    ? "border-white bg-stone-500 text-white"
                    : "border-stone-600 bg-stone-800 text-stone-400 hover:border-stone-400",
            ].join(" ")}
            aria-label={label}
            aria-pressed={selected}
        >
            {/* Placeholder — replace with <img> once assets are ready */}
            {label.slice(0, 2)}
        </button>
    );
}

/**
 * One player configuration slot.
 *
 * @param {{ playerId: string, config: PlayerConfig, onChange: (patch: Partial<PlayerConfig>) => void }} props
 * @returns {JSX.Element}
 */
function PlayerSlot({ playerId, config, onChange }) {
    const color = PLAYER_COLOR[playerId] ?? { bg: "bg-stone-600", label: playerId };

    return (
        <div className="bg-stone-800 border border-stone-600 rounded-xl p-5">
            {/* Color swatch + label */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-5 h-5 rounded-full ${color.bg}`} />
                <span className="text-stone-300 text-sm font-semibold uppercase tracking-wide">
                    {color.label}
                </span>
            </div>

            {/* Name input */}
            <label className="block text-stone-400 text-xs mb-1">Player name</label>
            <input
                type="text"
                value={config.name}
                onChange={e => onChange({ name: e.target.value })}
                maxLength={24}
                placeholder="Enter name…"
                className="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-stone-400 mb-4"
            />

            {/* Coat of arms picker */}
            <label className="block text-stone-400 text-xs mb-2">Coat of arms</label>
            <div className="flex flex-wrap gap-2">
                {COATS_OF_ARMS.map(coa => (
                    <CoatOfArmsTile
                        key={coa.id}
                        id={coa.id}
                        label={coa.label}
                        selected={config.coatOfArms === coa.id}
                        onSelect={() => onChange({ coatOfArms: coa.id })}
                    />
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Derives the ordered list of distinct player IDs from the map"s startingField owners.
 *
 * @param {import("../game/boardDefinition.js").BoardDefinition} map
 * @returns {string[]}
 */
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

/**
 * @param {{
 *   map: import("../game/boardDefinition.js").BoardDefinition,
 *   onConfirm: (players: PlayerConfig[]) => void,
 *   onBack: () => void,
 * }} props
 * @returns {JSX.Element}
 */
export function PlayerSetup({ map, onConfirm, onBack }) {
    const playerIds = derivePlayerIds(map);

    const [configs, setConfigs] = useState(
        /** @type {PlayerConfig[]} */ (
            playerIds.map(id => ({ id, name: "', coatOfArms: COATS_OF_ARMS[0].id }))
        ),
    );

    /**
     * Applies a partial update to the player config at the given index.
     *
     * @param {number} index - Index in the configs array to update.
     * @param {Partial<PlayerConfig>} patch - Fields to merge into the existing config.
     * @returns {void}
     */
    function updateConfig(index, patch) {
        setConfigs(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    }

    const allNamed = configs.every(c => c.name.trim().length > 0);

    return (
        <div className="flex flex-col items-center min-h-screen bg-stone-900 text-white p-8">
            <div className="w-full max-w-lg">
                <button
                    onClick={onBack}
                    className="text-stone-400 hover:text-white text-sm mb-6 transition-colors"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-bold tracking-wide uppercase mb-6">Player Setup</h2>

                <div className="flex flex-col gap-4 mb-8">
                    {configs.map((config, i) => (
                        <PlayerSlot
                            key={config.id}
                            playerId={config.id}
                            config={config}
                            onChange={patch => updateConfig(i, patch)}
                        />
                    ))}
                </div>

                <button
                    onClick={() => onConfirm(configs)}
                    disabled={!allNamed}
                    className="w-full bg-red-700 hover:bg-red-600 disabled:bg-stone-700 disabled:text-stone-500 text-white font-semibold py-3 rounded-lg tracking-wide uppercase transition-colors"
                >
                    Confirm
                </button>
            </div>
        </div>
    );
}
