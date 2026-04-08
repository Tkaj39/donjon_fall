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
import { ANIMAL_OPTIONS, SHIELD_BY_PLAYER, GAME_ASSETS } from "../styles/themes/default.js";
import { preloadImages } from "../utils/preloadImages.js";
import Spinner from "./Spinner.jsx";

/** Minimum display duration after assets are loaded. */
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
 * @returns {React.JSX.Element}
 */
export function GameLoading({ playerConfigs, map, onDone }) {
    useEffect(() => {
        // Run createInitialState eagerly to catch any errors before the game screen mounts.
        const playerIds = playerConfigs.map(c => c.id);
        createInitialState(playerIds, map.fields);

        let cancelled = false;
        preloadImages(GAME_ASSETS).then(() => {
            if (cancelled) return;
            const timer = setTimeout(() => { if (!cancelled) onDone(playerIds, map.fields); }, LOADING_DURATION_MS);
            return () => clearTimeout(timer);
        });
        return () => { cancelled = true; };
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

    const shields = playerConfigs.map(config => {
        const color = PLAYER_COLOR[config.id] ?? { bg: "bg-stone-600", label: config.id };
        return (
            <div key={config.id} className="flex items-center gap-4">
                {/* Coat of arms: shield + animal */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
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
    })

    return (
        <>
            <Logo className="fixed top-16 left-1/2 -translate-x-1/2"/>
            <div className="flex items-center justify-around min-h-screen bg-stone-900/60 text-white p-8">
                {shields[0]}
                <div className="flex flex-col items-center gap-8">
                    <p className="text-stone-400 text-sm uppercase tracking-widest">Get ready…</p>
                    <Spinner />
                </div>
                {shields[1]}
            </div>
        </>
    );
}