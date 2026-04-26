/**
 * VictoryScreen component — full-screen overlay shown when the game ends.
 */

import { Logo } from "./Logo.jsx";
import { PlayerShield } from "./PlayerShield.jsx";
import { NAMED_PLAYER_COLORS } from "./Board.jsx";
import picFocalActive from "../assets/pictogram/pictogram-focal-inactive.svg";

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

            <div className="frame-panel victory-panel flex flex-col items-center gap-6 px-8 sm:px-14 py-10 w-[90vw] sm:w-auto sm:min-w-[320px] max-w-sm sm:max-w-none">

                {/* Focal-active pictogram, white with player glow */}
                <img
                    src={picFocalActive}
                    aria-hidden="true"
                    width={80}
                    height={80}
                    style={{
                        filter: `brightness(0) invert(1) drop-shadow(0 0 10px ${palette.glow}) drop-shadow(0 0 20px ${palette.glow})`,
                    }}
                />

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest uppercase text-stone-100 m-0"
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
