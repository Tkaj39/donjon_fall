import {ANIMAL_OPTIONS, SHIELD_BY_PLAYER} from "../styles/themes/default.js";

const PLAYER_GLOW_COLOR = {
    red:  "var(--color-player-red)",
    blue: "var(--color-player-blue)",
};

/**
 * Renders a player's shield with coat of arms, score badge, and name.
 *
 * @param {string}                              props.playerId    - Player ID (e.g. "red", "blue"); drives shield image and glow colour.
 * @param {{ name?: string, coatOfArms?: string }} [props.cfg]     - Optional player config from setup screen.
 * @param {number}                             props.score       - Current victory-point score.
 * @param {boolean}                            props.isActive    - Whether this player is the current active player.
 * @returns {JSX.Element}
 */
export function PlayerShield({playerId, cfg, score, isActive}) {
    const shieldHref = SHIELD_BY_PLAYER[playerId] ?? SHIELD_BY_PLAYER.blue;
    const animalHref = ANIMAL_OPTIONS.find(a => a.id === cfg?.coatOfArms)?.href ?? ANIMAL_OPTIONS[0].href;
    const glowColor = PLAYER_GLOW_COLOR[playerId];

    return (
        <div className="flex flex-col items-center gap-1 shrink-0">
            <div
                className="relative w-28 h-28 rounded-full transition-all duration-300"
                style={isActive && glowColor ? {filter: `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 24px ${glowColor})`} : {filter: "grayscale(80%) brightness(50%)"}}
            >
                <img src={shieldHref} alt="" className="w-full h-full object-contain"/>
                <img src={animalHref} alt={cfg?.coatOfArms ?? ""}
                     className="absolute inset-0 w-full h-full object-contain p-1"/>
                <span className={[
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold leading-none px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-amber-400 text-stone-900" : "bg-stone-700 text-stone-200",
                ].join(" ")}>
                    {score}
                </span>
            </div>
            <p className="text-xs font-semibold text-stone-100 text-center leading-tight max-w-28 truncate">
                {cfg?.name || playerId}
            </p>
        </div>
    );
}