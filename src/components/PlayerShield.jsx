import {ANIMAL_OPTIONS, SHIELD_BY_PLAYER} from "../styles/themes/default.js";

/**
 * Renders a player's shield with coat of arms, score badge, and name.
 *
 * @param {{
 *   playerId: string,
 *   cfg?: { name?: string, coatOfArms?: string },
 *   score: number,
 *   isActive: boolean,
 * }} props
 * @returns {JSX.Element}
 */
export function PlayerShield({playerId, cfg, score, isActive}) {
    const shieldHref = SHIELD_BY_PLAYER[playerId] ?? SHIELD_BY_PLAYER.blue;
    const animalHref = ANIMAL_OPTIONS.find(a => a.id === cfg?.coatOfArms)?.href ?? ANIMAL_OPTIONS[0].href;

    return (
        <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative w-28 h-28">
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