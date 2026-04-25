import {ANIMAL_OPTIONS, SHIELD_BY_PLAYER} from "../styles/themes/default.js";
import {NAMED_PLAYER_COLORS} from "./Board.jsx";

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
    const glowColor = NAMED_PLAYER_COLORS[playerId]?.glow;

    const glowStyle = isActive && glowColor
        ? {filter: `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 5px ${glowColor})`}
        : {filter: "grayscale(80%) brightness(50%)"};

    return (
        <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative transition-all duration-300" style={glowStyle}>
                {/* Main shield */}
                <div className="relative z-10 w-28 h-28 rounded-full">
                    <img src={shieldHref} alt="" className="w-full h-full object-contain"/>
                    <img src={animalHref} alt={cfg?.coatOfArms ?? ""}
                         className="absolute inset-0 w-full h-full object-contain p-1"/>
                </div>

                {/* Score shield — larger, partially behind main shield */}
                <div className={`absolute ${playerId === "red" ? "-left-6" : "-right-6"} top-1/2 -translate-y-1/2 w-16 h-16 z-0`}>
                    <img src={shieldHref} alt="" className="w-full h-full object-contain"/>
                    <span
                        className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-stone-100/70 score-text-shadow"
                    >
                        {score}
                    </span>
                </div>
            </div>
            <p className="text-xs font-semibold text-stone-100 text-center leading-tight max-w-28 truncate">
                {cfg?.name || playerId}
            </p>
        </div>
    );
}