/**
 * ActionPanel component — action selector shown when a piece is selected.
 * Phase 8.1 — Action panel.
 *
 * Actions are listed in fixed order: Move tower (hidden if not a tower),
 * Move die, Reroll. The first applicable action is pre-selected automatically.
 * Disabled when the action is not in availableActions or actionTaken is true.
 */

import { ACTION_ORDER, ACTION_LABELS } from "./actionConstants.js";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Bottom action bar shown while a piece is selected during the action phase.
 *
 * @param {Object}   props
 * @param {string}   props.currentPlayer
 *   ID of the active player (used for styling).
 * @param {string[]} props.availableActions
 *   Actions that are currently legal, e.g. `["move-tower", "move-die", "reroll"]`.
 *   Only actions in this list can be selected; others render disabled.
 *   `"move-tower"` must be included to make that button visible at all.
 * @param {string|null} props.activeAction
 *   The currently selected action key, or null if none selected yet.
 * @param {function(string): void} props.onActionSelect
 *   Callback invoked with the action key when the player picks an action.
 * @returns {JSX.Element}
 */
export function ActionPanel({ currentPlayer, availableActions, activeAction, onActionSelect }) {
    const available = new Set(availableActions);

    // Show move-tower only when it is available (i.e. selected piece is a tower)
    const visibleActions = ACTION_ORDER.filter(
        (a) => (a !== "move-tower" || available.has("move-tower")) &&
               (a !== "collapse"   || available.has("collapse")),
    );

    return (
        <div
            role="toolbar"
            aria-label="Action panel"
            className="action-bar flex gap-3"
        >
            {visibleActions.map((actionKey) => {
                const isActive   = actionKey === activeAction;
                const isDisabled = !available.has(actionKey);

                return (
                    <button
                        key={actionKey}
                        data-testid={`action-btn-${actionKey}`}
                        disabled={isDisabled}
                        aria-pressed={isActive}
                        onClick={() => !isDisabled && onActionSelect(actionKey)}
                        className={`btn-frame px-6 py-7 text-sm font-semibold tracking-wide transition-all cursor-pointer
                            ${isDisabled  ? "text-stone-600 cursor-not-allowed opacity-50" : ""}
                            ${isActive    ? "text-stone-100" : !isDisabled ? "text-stone-300" : ""}
                        `}
                        style={{
                            filter: isActive
                                ? "drop-shadow(0 0 4px rgba(245,158,11,1)) drop-shadow(0 0 8px rgba(245,158,11,0.8)) brightness(0.75)"
                                : "none",
                            transition: "filter 0.15s",
                        }}
                    >
                        <span style={{
                            display: "inline-block",
                            transform: isActive ? "translateY(2px)" : "none",
                            transition: "transform 0.15s",
                        }}>
                            {ACTION_LABELS[actionKey]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
