/**
 * GameLoading component — brief summary screen before the game starts.
 * Phase 9.6
 *
 * Shows each player"s name, color, and coat of arms while createInitialState
 * runs and assets are prepared, then calls onDone.
 */

import { useEffect } from "react";
import { Logo } from "./Logo.jsx";
import { createInitialState } from "../game/gameState.js";
import { ANIMAL_OPTIONS, SHIELD_BY_PLAYER } from "../styles/themes/default.js";

/** How long to show the loading screen before entering the game. */
const LOADING_DURATION_MS = 1800;

/** Color display config per player ID — matches PlayerSetup. */
const PLAYER_COLOR = {
    red:  { bg: "bg-red-700",  label: "Red"  },
    blue: { bg: "bg-blue-700", label: "Blue" },
};

/**
 * @param {Object}  props
 * @param {import("./PlayerSetup.jsx").PlayerConfig[]} props.playerConfigs
 * @param {import("../game/boardDefinition.js").BoardDefinition} props.map
 * @param {(players: string[], boardFields: import("../hex/fieldProperties.js").HexField[]) => void} props.onDone
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900/60 text-white p-8">
            <Logo className="w-24 h-24 mb-6" />
            <p className="text-stone-400 text-sm uppercase tracking-widest mb-10">Get ready…</p>

            <div className="flex flex-col gap-6 w-full max-w-xs">
                {playerConfigs.map(config => {
                    const color = PLAYER_COLOR[config.id] ?? { bg: "bg-stone-600", label: config.id };
                    return (
                        <div key={config.id} className="flex items-center gap-4">
                            {/* Coat of arms: shield + animal */}
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                    src={SHIELD_BY_PLAYER[config.id] ?? SHIELD_BY_PLAYER.blue}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <img
                                    src={ANIMAL_OPTIONS.find(a => a.id === config.coatOfArms)?.href ?? ANIMAL_OPTIONS[0].href}
                                    alt={config.coatOfArms}
                                    className="absolute inset-0 w-full h-full object-contain p-1"
                                />
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