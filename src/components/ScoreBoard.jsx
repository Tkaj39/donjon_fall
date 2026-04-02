/**
 * ScoreBoard component — displays current victory point totals for all players.
 * Phase 7.3 — Score display.
 * Phase 12.6 — Score-pop animation when a player gains a point.
 */

import { useEffect, useMemo, useRef } from 'react';

/**
 * Returns the CSS variable for a player's label colour, falling back to the
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
 * player's score increases.
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
            style={{
                display:       'flex',
                gap:           '1rem',
                background:    'var(--color-panel-bg, #1e293b)',
                border:        '2px solid var(--color-panel-border, #475569)',
                borderRadius:  '0.75rem',
                padding:       '0.6rem 1rem',
                color:         'var(--color-panel-text, #f1f5f9)',
                boxShadow:     '0 4px 16px rgba(0,0,0,0.4)',
            }}
        >
            {players.map((playerId) => (
                <div
                    key={playerId}
                    data-testid={`score-${playerId}`}
                    style={{
                        display:    'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth:   '3.5rem',
                    }}
                >
                    <span
                        style={{
                            fontSize:    '0.7rem',
                            fontWeight:  600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color:       playerLabelColor(playerId),
                        }}
                    >
                        {playerId}
                    </span>
                    <span
                        key={`${playerId}-${scores[playerId] ?? 0}`}
                        data-testid={`score-value-${playerId}`}
                        style={{
                            fontSize:  '1.8rem',
                            fontWeight: 700,
                            lineHeight: 1.1,
                            display:   'inline-block',
                            animation: animatedSet.has(playerId)
                                ? 'score-pop 0.45s ease-out'
                                : 'none',
                        }}
                    >
                        {scores[playerId] ?? 0}
                    </span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>VP</span>
                </div>
            ))}
        </div>
    );
}
