/**
 * CombatOverlay component — modal panel shown when combat needs to be resolved.
 * Phase 5.4 — Combat overlay UI.
 */

import { getAttackStrength } from "../game/gameState.js";
import picPush from "../assets/pictogram/pictogram-push.svg";
import picJump from "../assets/pictogram/pictogram-jump.svg";

const OPTION_LABELS = {
    push:   "Push",
    occupy: "Occupy",
};

const OPTION_ICONS = {
    push:   picPush,
    occupy: picJump,
};

/**
 * @param {Object}  props
 * @param {import("../game/gameState.js").GameState} props.state
 * @param {Array<"push"|"occupy">} props.options
 * @param {function("push"|"occupy"): void} props.onChoose
 * @returns {JSX.Element}
 */
export function CombatOverlay({ state, options, onChoose }) {
    const { attackerHex, defenderHex } = state.combat;
    const attackerStrength = getAttackStrength(state, attackerHex);
    const defenderStrength = getAttackStrength(state, defenderHex);

    return (
        <div
            role="dialog"
            aria-label="Combat resolution"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
        >
            <div className="frame-panel flex flex-col items-center gap-5 px-10 py-7 min-w-64 text-stone-200">
                <h2 className="text-2xl font-bold tracking-widest uppercase text-stone-300">
                    Combat
                </h2>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs uppercase tracking-widest text-stone-500">Attacker</span>
                        <span data-testid="attacker-strength" className="text-4xl font-bold text-stone-200">
                            {attackerStrength}
                        </span>
                    </div>

                    <span className="text-stone-600 text-lg">vs</span>

                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs uppercase tracking-widest text-stone-500">Defender</span>
                        <span data-testid="defender-strength" className="text-4xl font-bold text-stone-200">
                            {defenderStrength}
                        </span>
                    </div>
                </div>

                <div className="flex gap-3 w-full">
                    {options.map(option => (
                        <button
                            key={option}
                            onClick={() => onChoose(option)}
                            aria-label={OPTION_LABELS[option]}
                            className="btn-frame flex-1 py-4 flex flex-col items-center gap-2 text-stone-300 cursor-pointer"
                        >
                            <img
                                src={OPTION_ICONS[option]}
                                alt={OPTION_LABELS[option]}
                                style={{ width: 32, height: 32, filter: "brightness(0) invert(1)", opacity: 0.85 }}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
