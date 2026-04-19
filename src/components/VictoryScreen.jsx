/**
 * VictoryScreen component — full-screen overlay shown when the game ends.
 */

import { Logo } from "./Logo.jsx";
import { PlayerShield } from "./PlayerShield.jsx";
import { NAMED_PLAYER_COLORS } from "./Board.jsx";

/**
 * @param {Object}   props
 * @param {string}   props.winner        - Player ID of the winning player.
 * @param {import("./PlayerSetup.jsx").PlayerConfig[]} [props.playerConfigs] - Player configs for name/coat of arms.
 * @param {function} props.onNewGame     - Callback for "Nová hra".
 */
export function VictoryScreen({ winner, playerConfigs = [], score = 0, onNewGame }) {
    const palette = NAMED_PLAYER_COLORS[winner] ?? NAMED_PLAYER_COLORS.default;
    const cfg     = playerConfigs.find(c => c.id === winner);
    const name    = cfg?.name ?? winner;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Victory screen"
            className="fixed inset-0 flex flex-col items-center justify-center z-[200]"
            style={{ background: `radial-gradient(ellipse at center, ${palette.glow}22 0%, rgba(0,0,0,0.92) 70%)` }}
        >
            <Logo className="w-24 mb-6" />

            <div className="frame-panel victory-panel flex flex-col items-center gap-6 px-14 py-10 min-w-[320px]">

                {/* Crown SVG */}
                <svg aria-hidden="true" width="80" height="64" viewBox="0 0 80 64">
                    <filter id="vic-glow">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <g filter="url(#vic-glow)">
                        <polygon
                            points="4,56 16,20 40,40 64,20 76,56"
                            fill={palette.primary}
                            opacity="0.95"
                        />
                        <circle cx="4"  cy="18" r="5" fill={palette.glow} />
                        <circle cx="40" cy="14" r="6" fill={palette.glow} />
                        <circle cx="76" cy="18" r="5" fill={palette.glow} />
                        <rect x="4" y="56" width="72" height="8" rx="4" fill={palette.primary} />
                    </g>
                </svg>

                {/* Title */}
                <h1 className="text-4xl font-extrabold tracking-widest uppercase text-stone-100 m-0"
                    style={{ textShadow: `0 0 24px ${palette.glow}, 0 0 8px ${palette.glow}` }}
                >
                    Vítěz!
                </h1>

                {/* Shield + name */}
                <div className="flex flex-col items-center gap-3">
                    <PlayerShield
                        playerId={winner}
                        cfg={cfg}
                        score={score}
                        isActive={true}
                    />
                    <p
                        className="text-xl font-bold capitalize tracking-wide m-0"
                        style={{ color: palette.glow }}
                        data-testid="winner-label"
                    >
                        {name}
                    </p>
                </div>

                {/* Button */}
                <button
                    data-testid="new-game-btn"
                    onClick={onNewGame}
                    className="btn-frame px-10 py-4 text-lg font-bold tracking-widest text-stone-200 cursor-pointer mt-2"
                >
                    Nová hra
                </button>
            </div>
        </div>
    );
}
