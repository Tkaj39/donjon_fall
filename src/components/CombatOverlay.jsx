/**
 * CombatOverlay component — modal panel shown when combat needs to be resolved.
 * Phase 5.4 — Combat overlay UI.
 *
 * Displays the attacker and defender"s attack strengths and lets the current
 * player choose between the available combat options (push / occupy).
 */

import { getAttackStrength } from "../game/gameState.js";

/** Human-readable labels for each combat option. */
const OPTION_LABELS = {
    push:   "Push",
    occupy: "Occupy",
};

/**
 * Overlay panel that appears during the "combat" phase.
 *
 * @param {Object}  props
 * @param {import("../game/gameState.js").GameState} props.state
 *   Full game state — used to derive attacker/defender strengths and hex refs.
 * @param {Array<"push"|"occupy">} props.options
 *   Available combat options (from `getAvailableCombatOptions`).
 * @param {function("push"|"occupy"): void} props.onChoose
 *   Callback invoked when the player picks an option.
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
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-panel-bg,#1e293b)] border-2 border-[var(--color-panel-border,#475569)] rounded-xl py-5 px-6 min-w-56 text-center text-[var(--color-panel-text,#f1f5f9)] z-[100] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
            <h2 className="m-0 mb-3 text-[1.1rem] font-bold">
                Combat
            </h2>

            <div className="flex justify-around mb-4">
                <div>
                    <div className="text-xs opacity-70">Attacker</div>
                    <div
                        data-testid="attacker-strength"
                        className="text-2xl font-bold"
                    >
                        {attackerStrength}
                    </div>
                </div>
                <div className="self-center opacity-50">vs</div>
                <div>
                    <div className="text-xs opacity-70">Defender</div>
                    <div
                        data-testid="defender-strength"
                        className="text-2xl font-bold"
                    >
                        {defenderStrength}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 justify-center">
                {options.map(option => (
                    <button
                        key={option}
                        onClick={() => onChoose(option)}
                        className="py-[0.4rem] px-4 rounded-[0.4rem] border border-[var(--color-panel-border,#475569)] bg-[var(--color-btn-bg,#334155)] text-inherit cursor-pointer font-semibold"
                    >
                        {OPTION_LABELS[option] ?? option}
                    </button>
                ))}
            </div>
        </div>
    );
}
