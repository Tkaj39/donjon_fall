/**
 * ActionReplay — Phase 14.3 debug panel.
 * Collapsible panel that shows the recorded action log and lets the developer
 * step through the game history one action at a time.
 *
 * The panel is read-only with respect to the live game — replay just rebuilds
 * a local state snapshot from the initial state by re-running the pure reducer
 * over the recorded actions up to the chosen step.  The live game continues
 * in the background unaffected.
 */

import { useState, useMemo } from "react";
import { gameReducer } from "../game/gameReducer.js";

/**
 * Renders a short human-readable label for an action.
 *
 * @param {{ type: string, [key: string]: unknown }} action
 * @returns {string}
 */
function actionLabel(action) {
    switch (action.type) {
        case "ADVANCE_FOCAL_PHASE":
            return `Focal (die→${action.dieNewValue}, extra=${action.extraDieRoll})`;
        case "MOVE_DIE":
            return `Move die  ${action.fromHex} → ${action.toHex}`;
        case "MOVE_TOWER":
            return `Move tower ${action.fromHex} → ${action.toHex}`;
        case "JUMP":
            return `Jump  ${action.towerHex} → ${action.targetHex}`;
        case "COLLAPSE":
            return `Collapse @ ${action.hex}`;
        case "REROLL":
            return `Reroll @ ${action.hex}  → ${action.newValue}`;
        case "CHOOSE_COMBAT_OPTION":
            return `Combat: ${action.option}${action.rerollValue != null ? ` (reroll=${action.rerollValue})` : ""}`;
        case "CONFIRM_ACTION":
            return "Confirm action";
        case "END_TURN":
            return "End turn";
        default:
            return action.type;
    }
}

/**
 * Collapsible action-replay panel for debugging.
 *
 * @param {{
 *   actions: Array<{ type: string, [key: string]: unknown }>,
 *   initialState: import("../game/gameState.js").GameState,
 * }} props
 * @returns {JSX.Element}
 */
export function ActionReplay({ actions, initialState }) {
    const [collapsed, setCollapsed] = useState(true);

    /**
     * The step index currently previewed.  -1 means "initial state" (before any
     * action).  null means replay is inactive and no step is highlighted.
     */
    const [replayStep, setReplayStep] = useState(null);

    /** Rebuild the game state up to and including step `replayStep`. */
    const replayState = useMemo(() => {
        if (replayStep === null || replayStep < 0) return null;
        let s = initialState;
        for (let i = 0; i <= replayStep; i++) {
            s = gameReducer(s, actions[i]);
        }
        return s;
    }, [replayStep, actions, initialState]);

    /**
     * Toggles the preview for the given action index.
     * Clicking an already-active step deactivates the preview.
     *
     * @param {number} idx - Index of the action in the recorded list.
     * @returns {void}
     */
    function handleStepClick(idx) {
        setReplayStep(prev => (prev === idx ? null : idx));
    }

    /**
     * Moves the replay cursor by `delta` steps (+1 forward, -1 backward).
     * Clamps at the list boundaries.
     *
     * @param {number} delta - Direction and magnitude of the step change.
     * @returns {void}
     */
    function handleStepChange(delta) {
        setReplayStep(prev => {
            if (prev === null) return delta > 0 ? 0 : actions.length - 1;
            const next = prev + delta;
            if (next < 0 || next >= actions.length) return prev;
            return next;
        });
    }

    /**
     * Clears the active replay step and hides the state snapshot.
     *
     * @returns {void}
     */
    function handleClose() {
        setReplayStep(null);
    }

    return (
        <div className="w-full font-mono text-[0.72rem] bg-(--color-inspector-bg) border border-(--color-inspector-border) rounded overflow-hidden">
            <button
                onClick={() => setCollapsed(prev => !prev)}
                className="w-full flex items-center justify-between bg-(--color-inspector-header-bg) text-(--color-inspector-header-text) px-3 py-1 cursor-pointer border-none text-left"
            >
                <span className="font-semibold">Action Replay ({actions.length} actions)</span>
                <span>{collapsed ? "▶ expand" : "▼ collapse"}</span>
            </button>

            {!collapsed && (
                <div className="p-2 flex flex-col gap-2">
                    {/* Step controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => handleStepChange(-1)}
                            disabled={replayStep === null || replayStep <= 0}
                            className="bg-(--color-inspector-header-bg) text-(--color-inspector-header-text) border border-(--color-inspector-border) rounded px-2 py-[0.1rem] cursor-pointer disabled:opacity-40"
                        >
                            ← Prev
                        </button>
                        <button
                            onClick={() => handleStepChange(1)}
                            disabled={replayStep === null ? actions.length === 0 : replayStep >= actions.length - 1}
                            className="bg-(--color-inspector-header-bg) text-(--color-inspector-header-text) border border-(--color-inspector-border) rounded px-2 py-[0.1rem] cursor-pointer disabled:opacity-40"
                        >
                            Next →
                        </button>
                        {replayStep !== null && (
                            <>
                                <span className="text-(--color-inspector-text) px-1">
                                    Step {replayStep + 1} / {actions.length}
                                </span>
                                <button
                                    onClick={handleClose}
                                    className="bg-(--color-inspector-header-bg) text-(--color-inspector-header-text) border border-(--color-inspector-border) rounded px-2 py-[0.1rem] cursor-pointer ml-auto"
                                >
                                    ✕ Close replay
                                </button>
                            </>
                        )}
                    </div>

                    {/* Action log */}
                    <ol className="m-0 p-0 list-none max-h-48 overflow-y-auto flex flex-col gap-[0.15rem]">
                        {actions.length === 0 && (
                            <li className="text-(--color-inspector-text) opacity-50 px-1">No actions recorded yet.</li>
                        )}
                        {actions.map((action, idx) => (
                            <li key={idx}>
                                <button
                                    onClick={() => handleStepClick(idx)}
                                    className={[
                                        "w-full text-left px-2 py-[0.1rem] rounded border cursor-pointer",
                                        replayStep === idx
                                            ? "bg-yellow-400/20 border-yellow-400/60 text-yellow-200"
                                            : "bg-transparent border-transparent text-(--color-inspector-text) hover:bg-white/5",
                                    ].join(" ")}
                                >
                                    <span className="opacity-50 mr-1 select-none">{idx + 1}.</span>
                                    {actionLabel(action)}
                                </button>
                            </li>
                        ))}
                    </ol>

                    {/* Replay state snapshot */}
                    {replayState !== null && (
                        <div>
                            <div className="text-(--color-inspector-text) opacity-70 mb-1 px-1">
                                State after step {replayStep + 1}:
                            </div>
                            <pre className="m-0 p-2 text-(--color-inspector-text) bg-black/30 rounded overflow-auto max-h-60 whitespace-pre-wrap break-all border border-(--color-inspector-border)">
                                {JSON.stringify(replayState, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}