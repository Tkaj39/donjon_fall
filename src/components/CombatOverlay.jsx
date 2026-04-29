/**
 * CombatOverlay component — modal panel shown when combat needs to be resolved.
 * Phase 5.4 — Combat overlay UI.
 */

import { getAttackStrength, getController } from "../game/gameState.js";
import { NAMED_PLAYER_COLORS } from "./Board.jsx";
import picAttack from "../assets/pictogram/pictogram-attack.svg";
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
    const { attackerHex, defenderHex, attackStrengthOverride } = state.combat;
    const attackerStrength = attackStrengthOverride ?? getAttackStrength(state, attackerHex);
    const defenderStrength = getAttackStrength(state, defenderHex);
    const attackerColor = NAMED_PLAYER_COLORS[getController(state, attackerHex)]?.primary ?? "#e2e8f0";
    const defenderColor = NAMED_PLAYER_COLORS[getController(state, defenderHex)]?.primary ?? "#e2e8f0";

    return (
        <div
            role="dialog"
            aria-label="Combat resolution"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
        >
            <div className="frame-panel flex flex-col items-center gap-5 px-6 sm:px-10 py-7 min-w-[min(256px,90vw)] text-stone-200">
                <div className="flex items-center gap-3">
                    <img src={picAttack} alt="" style={{ width: 28, height: 28, filter: "brightness(0) invert(1)", opacity: 0.75, transform: "scaleX(-1)" }} />
                    <h2 className="text-2xl font-bold tracking-widest uppercase text-stone-300">Combat</h2>
                    <img src={picAttack} alt="" style={{ width: 28, height: 28, filter: "brightness(0) invert(1)", opacity: 0.75 }} />
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs uppercase tracking-widest text-stone-500">Attacker</span>
                        <span data-testid="attacker-strength" className="text-4xl font-bold" style={{ color: attackerColor }}>
                            {attackerStrength}
                        </span>
                    </div>

                    <span className="text-stone-600 text-4xl mt-5">›</span>

                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs uppercase tracking-widest text-stone-500">Defender</span>
                        <span data-testid="defender-strength" className="text-4xl font-bold" style={{ color: defenderColor }}>
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
