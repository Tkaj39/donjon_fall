/**
 * PhaseIndicator component — shows whose turn it is and the current game phase.
 * Phase 7.4 — Phase indicator.
 */

/** Human-readable label for each game phase. */
const PHASE_LABELS = {
    focal:   "Focal Points",
    action:  "Action",
    combat:  "Combat",
    victory: "Victory",
};

/** CSS colour for each known player ID. Fallback used for unknown IDs. */
const PLAYER_COLORS = {
    red:  "#ef4444",
    blue: "#3b82f6",
};

/** Fallback color for player IDs not in PLAYER_COLORS. */
const FALLBACK_COLOR = "#94a3b8";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Compact banner displaying the current player's turn and active game phase.
 *
 * @param {Object} props
 * @param {"focal"|"action"|"combat"|"victory"} props.phase         - Current game phase.
 * @param {string}                               props.currentPlayer - Active player ID.
 * @returns {JSX.Element}
 */
export function PhaseIndicator({ phase, currentPlayer }) {
    const playerColor = PLAYER_COLORS[currentPlayer] ?? FALLBACK_COLOR;
    const phaseLabel  = PHASE_LABELS[phase] ?? phase;

    return (
        <div
            role="status"
            aria-label="Phase indicator"
            className="flex items-center gap-[0.6rem] bg-[var(--color-panel-bg,#1e293b)] border-2 border-[var(--color-panel-border,#475569)] rounded-xl py-2 px-4 text-[var(--color-panel-text,#f1f5f9)] shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
            {/* Player colour dot */}
            <span
                aria-hidden="true"
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ background: playerColor }}
            />

            {/* Player name */}
            <span
                data-testid="current-player"
                className="font-bold capitalize text-[0.9rem]"
                style={{ color: playerColor }}
            >
                {currentPlayer}
            </span>

            {/* Separator */}
            <span className="opacity-[0.35] text-[0.85rem]">·</span>

            {/* Phase label */}
            <span
                data-testid="current-phase"
                className="text-[0.85rem] opacity-[0.85]"
            >
                {phaseLabel}
            </span>
        </div>
    );
}
