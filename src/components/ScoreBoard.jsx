/**
 * ScoreBoard component — displays current victory point totals for all players.
 * Phase 7.3 — Score display.
 * Phase 12.6 — Score-pop animation when a player gains a point.
 */

import { useEffect, useMemo, useRef } from "react";

/**
 * Returns the CSS variable for a player"s label colour, falling back to the
 * generic player-fallback variable for unknown IDs.
 *
 * @param {string} playerId
 * @returns {string}
 */
function playerLabelColor(playerId) {
    return `var(--color-player-${playerId}, var(--color-player-fallback))`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Panel showing the victory point total for each player.
 * Plays a brief scale-pop animation (Phase 12.6) on the VP number when a
 * player"s score increases.
 *
 * @param {Object}                 props
 * @param {string[]}               props.players - Ordered list of player IDs.
 * @param {{ [playerId]: number }} props.scores  - Current VP totals keyed by player ID.
 * @returns {JSX.Element}
 */
export function ScoreBoard({ players, scores }) {
    /**
     * Previous score snapshot — null on first render so no animation fires
     * on mount.
     */
    const prevRef = useRef(null);

    /**
     * Set of player IDs whose score increased since the last render.
     * Computed before prevRef is updated so the comparison uses the old value.
     */
    const animatedSet = useMemo(() => {
        if (prevRef.current === null) return new Set();
        return new Set(
            players.filter(id => (scores[id] ?? 0) > (prevRef.current[id] ?? 0))
        );
    }, [players, scores]);

    useEffect(() => {
        prevRef.current = { ...scores };
    }, [scores]);

    return (
        <div
            role="region"
            aria-label="Score board"
            className="flex gap-4 bg-[var(--color-panel-bg,#1e293b)] border-2 border-[var(--color-panel-border,#475569)] rounded-xl py-[0.6rem] px-4 text-[var(--color-panel-text,#f1f5f9)] shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
            {players.map((playerId) => (
                <div
                    key={playerId}
                    data-testid={`score-${playerId}`}
                    className="flex flex-col items-center min-w-14"
                >
                    <span
                        className="text-[0.7rem] font-semibold uppercase tracking-[0.05em]"
                        style={{ color: playerLabelColor(playerId) }}
                    >
                        {playerId}
                    </span>
                    <span
                        key={`${playerId}-${scores[playerId] ?? 0}`}
                        data-testid={`score-value-${playerId}`}
                        className="text-[1.8rem] font-bold leading-[1.1] inline-block"
                        style={{ animation: animatedSet.has(playerId) ? "score-pop 0.45s ease-out" : "none" }}
                    >
                        {scores[playerId] ?? 0}
                    </span>
                    <span className="text-[0.65rem] opacity-50">VP</span>
                </div>
            ))}
        </div>
    );
}
