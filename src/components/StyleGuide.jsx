/**
 * StyleGuide component — developer helper page showcasing all visual elements.
 * Displays colours, CSS variables, player palette, component demos, and assets.
 */

import { useState } from "react";
import { hexCorners } from "../hex/hexUtils.js";
import {
    SHIELD_BY_PLAYER,
    ANIMAL_OPTIONS,
    GAME_ASSETS,
    appBackground,
} from "../styles/themes/default.js";
import { ActionPanel } from "./ActionPanel.jsx";
import { Die } from "./Die.jsx";
import { DirectionPickerOverlay } from "./DirectionPickerOverlay.jsx";
import { FocalPointMarker } from "./FocalPointMarker.jsx";
import { Logo } from "./Logo.jsx";
import { Spinner } from "./Spinner.jsx";
import { VictoryScreen } from "./VictoryScreen.jsx";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** CSS custom properties defined in index.css :root. */
const CSS_VARS = [
    { name: "--color-hex-default",         label: "Hex default" },
    { name: "--color-hex-starting",        label: "Hex starting" },
    { name: "--color-hex-focal",           label: "Hex focal" },
    { name: "--color-hex-selected",        label: "Hex selected" },
    { name: "--color-hex-stroke",          label: "Hex stroke" },
    { name: "--color-hex-reachable",       label: "Reachable" },
    { name: "--color-hex-highlighted",     label: "Highlighted" },
    { name: "--color-hex-trajectory",      label: "Trajectory" },
    { name: "--color-hex-enemy-reachable", label: "Enemy reachable" },
    { name: "--color-focal-active",        label: "Focal active" },
    { name: "--color-focal-active-stroke", label: "Focal active stroke" },
    { name: "--color-focal-passive",       label: "Focal passive" },
    { name: "--color-die-default",         label: "Die default" },
    { name: "--color-player-red",          label: "Player red" },
    { name: "--color-player-blue",         label: "Player blue" },
    { name: "--color-player-fallback",     label: "Player fallback" },
    { name: "--color-title",               label: "Title" },
];

/** Player palette (same as Board.jsx). */
const PLAYER_PALETTE = [
    { id: "red",    primary: "#dc2626", tint: "#fca5a5" },
    { id: "blue",   primary: "#2563eb", tint: "#93c5fd" },
    { id: "green",  primary: "#16a34a", tint: "#86efac" },
    { id: "amber",  primary: "#d97706", tint: "#fcd34d" },
    { id: "purple", primary: "#9333ea", tint: "#d8b4fe" },
    { id: "cyan",   primary: "#0891b2", tint: "#67e8f9" },
];

/** Hex size for demos. */
const HEX = 40;

/** Battlefield asset labels. */
const BATTLEFIELD_LABELS = ["grass", "grass-dense", "focus", "starter-red", "starter-blue"];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Renders a section heading.
 *
 * @param {{ title: string }} props
 * @returns {JSX.Element}
 */
function Section({ title, children }) {
    return (
        <section className="mb-10">
            <h2 className="text-xl font-bold text-amber-300 border-b border-amber-300/30 pb-1 mb-4">
                {title}
            </h2>
            {children}
        </section>
    );
}

/**
 * Renders an SVG hex polygon at given centre.
 *
 * @param {number} cx
 * @param {number} cy
 * @param {number} size
 * @param {string} fill
 * @param {string} [stroke]
 * @returns {JSX.Element}
 */
function HexShape({ cx, cy, size, fill, stroke = "var(--color-hex-stroke)" }) {
    const corners = hexCorners(cx, cy, size);
    const points = corners.map(({ x, y }) => `${x},${y}`).join(" ");
    return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={1.5} />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Development helper page — visual style guide showcasing all project components,
 * colours, assets, and animations.
 *
 * @param {{ onBack: function(): void }} props
 * @returns {JSX.Element}
 */
export function StyleGuide({ onBack }) {
    const [showVictory, setShowVictory] = useState(false);

    return (
        <div className="min-h-screen bg-stone-900 text-stone-100 p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-extrabold text-amber-400">
                    Style Guide — Donjon Fall
                </h1>
                <button
                    onClick={onBack}
                    className="py-2 px-5 rounded-lg bg-stone-700 text-stone-200 font-semibold cursor-pointer border border-stone-600"
                >
                    ← Back
                </button>
            </div>

            {/* ── 1. CSS Variables ──────────────────────────────────────────── */}
            <Section title="1. CSS Variables (:root)">
                <div className="flex flex-wrap gap-3">
                    {CSS_VARS.map(({ name, label }) => (
                        <div key={name} className="flex flex-col items-center gap-1">
                            <div
                                className="w-12 h-12 rounded-md border border-stone-600"
                                style={{ background: `var(${name})` }}
                            />
                            <span className="text-[0.65rem] text-stone-400 text-center max-w-16 leading-tight">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── 2. Player Palette ─────────────────────────────────────────── */}
            <Section title="2. Player Palette">
                <div className="flex flex-wrap gap-4">
                    {PLAYER_PALETTE.map(({ id, primary, tint }) => (
                        <div key={id} className="flex flex-col items-center gap-1">
                            <div className="flex gap-1">
                                <div
                                    className="w-10 h-10 rounded-md border border-stone-600"
                                    style={{ background: primary }}
                                    title={`${id} primary: ${primary}`}
                                />
                                <div
                                    className="w-10 h-10 rounded-md border border-stone-600"
                                    style={{ background: tint }}
                                    title={`${id} tint: ${tint}`}
                                />
                            </div>
                            <span className="text-xs text-stone-300 capitalize">{id}</span>
                            <span className="text-[0.6rem] text-stone-500">{primary} / {tint}</span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── 3. Die Component ──────────────────────────────────────────── */}
            <Section title="3. Die Component">
                <p className="text-sm text-stone-400 mb-3">
                    All 6 values × red & blue, plus dimmed (non-top) variant.
                </p>
                <svg width={620} height={120} className="bg-stone-800 rounded-lg">
                    {[1, 2, 3, 4, 5, 6].map((value, i) => (
                        <Die
                            key={`red-${value}`}
                            cx={50 + i * 95}
                            cy={35}
                            hexSize={HEX}
                            value={value}
                            color="#dc2626"
                            isTop={true}
                        />
                    ))}
                    {[1, 2, 3, 4, 5, 6].map((value, i) => (
                        <Die
                            key={`blue-${value}`}
                            cx={50 + i * 95}
                            cy={90}
                            hexSize={HEX}
                            value={value}
                            color="#2563eb"
                            isTop={i > 2}
                        />
                    ))}
                </svg>
            </Section>

            {/* ── 4. HexTile Fills ─────────────────────────────────────────── */}
            <Section title="4. Hex Tile Fills">
                <p className="text-sm text-stone-400 mb-3">
                    Default, starting-red, starting-blue, focal, selected, reachable,
                    trajectory, enemy-reachable.
                </p>
                <svg width={720} height={110} className="bg-stone-800 rounded-lg">
                    {[
                        { fill: "var(--color-hex-default)",        label: "Default" },
                        { fill: "#fca5a5",                          label: "Starting (R)" },
                        { fill: "#93c5fd",                          label: "Starting (B)" },
                        { fill: "var(--color-hex-focal)",          label: "Focal" },
                        { fill: "var(--color-hex-selected)",       label: "Selected" },
                        { fill: "var(--color-hex-reachable)",      label: "Reachable" },
                        { fill: "var(--color-hex-trajectory)",     label: "Trajectory" },
                        { fill: "var(--color-hex-enemy-reachable)",label: "Enemy reach" },
                    ].map(({ fill, label }, i) => {
                        const cx = 50 + i * 85;
                        const cy = 48;
                        return (
                            <g key={label}>
                                <HexShape cx={cx} cy={cy} size={36} fill={fill} />
                                <text x={cx} y={cy + 48} textAnchor="middle" fontSize={10} fill="#a8a29e">
                                    {label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </Section>

            {/* ── 5. Focal Point Markers ────────────────────────────────────── */}
            <Section title="5. Focal Point Markers">
                <svg width={200} height={100} className="bg-stone-800 rounded-lg">
                    <HexShape cx={55} cy={45} size={36} fill="var(--color-hex-focal)" />
                    <FocalPointMarker cx={55} cy={45} hexSize={36} isActive={true} />
                    <text x={55} y={90} textAnchor="middle" fontSize={10} fill="#a8a29e">Active</text>

                    <HexShape cx={145} cy={45} size={36} fill="var(--color-hex-focal)" />
                    <FocalPointMarker cx={145} cy={45} hexSize={36} isActive={false} />
                    <text x={145} y={90} textAnchor="middle" fontSize={10} fill="#a8a29e">Passive</text>
                </svg>
            </Section>

            {/* ── 6. Dice Stack ─────────────────────────────────────────────── */}
            <Section title="6. Dice Stack (Tower)">
                <p className="text-sm text-stone-400 mb-3">
                    Single die, friendly tower (2), mixed tower (3 — red top, blue bottom).
                </p>
                <svg width={350} height={130} className="bg-stone-800 rounded-lg">
                    {/* Single die */}
                    <HexShape cx={60} cy={70} size={38} fill="var(--color-hex-default)" />
                    <Die cx={60} cy={70} hexSize={38} value={4} color="#dc2626" isTop={true} />
                    <text x={60} y={120} textAnchor="middle" fontSize={10} fill="#a8a29e">Single</text>

                    {/* Friendly tower */}
                    <HexShape cx={170} cy={70} size={38} fill="var(--color-hex-default)" />
                    <Die cx={170} cy={78} hexSize={38} value={3} color="#2563eb" isTop={false} />
                    <Die cx={170} cy={62} hexSize={38} value={5} color="#2563eb" isTop={true} />
                    <text x={170} y={120} textAnchor="middle" fontSize={10} fill="#a8a29e">Friendly</text>

                    {/* Mixed tower */}
                    <HexShape cx={280} cy={70} size={38} fill="var(--color-hex-default)" />
                    <Die cx={280} cy={86} hexSize={38} value={2} color="#2563eb" isTop={false} />
                    <Die cx={280} cy={70} hexSize={38} value={4} color="#dc2626" isTop={false} />
                    <Die cx={280} cy={54} hexSize={38} value={6} color="#dc2626" isTop={true} />
                    <text x={280} y={120} textAnchor="middle" fontSize={10} fill="#a8a29e">Mixed</text>
                </svg>
            </Section>

            {/* ── 7. Direction Picker ───────────────────────────────────────── */}
            <Section title="7. Direction Picker Overlay">
                <svg width={140} height={120} className="bg-stone-800 rounded-lg">
                    <HexShape cx={70} cy={55} size={44} fill="var(--color-hex-default)" />
                    <DirectionPickerOverlay
                        cx={70}
                        cy={55}
                        size={44}
                        enemyHexKey="0,0,0"
                        validApproachKeys={new Set(["1,-1,0", "1,0,-1", "0,1,-1"])}
                        selectedApproachKey="1,0,-1"
                        onApproachHover={() => {}}
                    />
                </svg>
            </Section>

            {/* ── 8. Action Panel ───────────────────────────────────────────── */}
            <Section title="8. Action Panel">
                <p className="text-sm text-stone-400 mb-3">
                    Active, enabled, and disabled button states.
                </p>
                <div className="flex flex-col gap-3">
                    <div>
                        <span className="text-xs text-stone-500 mb-1 block">All actions, "Move die" active:</span>
                        <ActionPanel
                            currentPlayer="red"
                            availableActions={["move-tower", "move-die", "reroll", "collapse"]}
                            activeAction="move-die"
                            onActionSelect={() => {}}
                        />
                    </div>
                    <div>
                        <span className="text-xs text-stone-500 mb-1 block">Only move-die & reroll available:</span>
                        <ActionPanel
                            currentPlayer="blue"
                            availableActions={["move-die", "reroll"]}
                            activeAction="reroll"
                            onActionSelect={() => {}}
                        />
                    </div>
                </div>
            </Section>

            {/* ── 9. Combat Overlay (static mock) ──────────────────────────── */}
            <Section title="9. Combat Overlay (static mock)">
                <div className="relative w-80 h-44 bg-stone-800 rounded-lg">
                    <div
                        role="dialog"
                        aria-label="Combat resolution"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1e293b] border-2 border-[#475569] rounded-xl py-5 px-6 min-w-56 text-center text-[#f1f5f9] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                    >
                        <h2 className="m-0 mb-3 text-[1.1rem] font-bold">Combat</h2>
                        <div className="flex justify-around mb-4">
                            <div>
                                <div className="text-xs opacity-70">Attacker</div>
                                <div className="text-2xl font-bold">5</div>
                            </div>
                            <div className="self-center opacity-50">vs</div>
                            <div>
                                <div className="text-xs opacity-70">Defender</div>
                                <div className="text-2xl font-bold">3</div>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button className="py-[0.4rem] px-4 rounded-[0.4rem] border border-[#475569] bg-[#334155] text-[#f1f5f9] cursor-pointer font-semibold">
                                Push
                            </button>
                            <button className="py-[0.4rem] px-4 rounded-[0.4rem] border border-[#475569] bg-[#334155] text-[#f1f5f9] cursor-pointer font-semibold">
                                Occupy
                            </button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── 10. Victory Screen ────────────────────────────────────────── */}
            <Section title="10. Victory Screen">
                <button
                    onClick={() => setShowVictory(true)}
                    className="py-2 px-5 rounded-lg bg-amber-600 text-white font-semibold cursor-pointer border-0"
                >
                    Show Victory Overlay (red)
                </button>
                {showVictory && (
                    <VictoryScreen winner="red" onNewGame={() => setShowVictory(false)} />
                )}
            </Section>

            {/* ── 11. Logo ──────────────────────────────────────────────────── */}
            <Section title="11. Logo">
                <div className="flex items-end gap-6">
                    <div className="flex flex-col items-center gap-1">
                        <Logo className="w-24 h-24" />
                        <span className="text-xs text-stone-500">w-24</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Logo className="w-16 h-16" />
                        <span className="text-xs text-stone-500">w-16</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Logo className="w-10 h-10" />
                        <span className="text-xs text-stone-500">w-10</span>
                    </div>
                </div>
            </Section>

            {/* ── 12. Spinner ───────────────────────────────────────────────── */}
            <Section title="12. Spinner">
                <div className="flex items-center gap-4">
                    <Spinner />
                    <span className="text-sm text-stone-400">128×128 spinning border</span>
                </div>
            </Section>

            {/* ── 13. Shields ───────────────────────────────────────────────── */}
            <Section title="13. Shields (Coat of Arms)">
                <div className="flex flex-wrap gap-4">
                    {Object.entries(SHIELD_BY_PLAYER).map(([id, href]) => (
                        <div key={id} className="flex flex-col items-center gap-1">
                            <img src={href} alt={id} className="w-16 h-16 object-contain" />
                            <span className="text-xs text-stone-400 capitalize">{id}</span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── 14. Animals ───────────────────────────────────────────────── */}
            <Section title="14. Animals (Gamer Symbols)">
                <div className="flex flex-wrap gap-4">
                    {ANIMAL_OPTIONS.map(({ id, label, href }) => (
                        <div key={id} className="flex flex-col items-center gap-1">
                            <img src={href} alt={label} className="w-16 h-16 object-contain" />
                            <span className="text-xs text-stone-400">{label}</span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── 15. Battlefield Textures ──────────────────────────────────── */}
            <Section title="15. Battlefield Textures">
                <div className="flex flex-wrap gap-4">
                    {GAME_ASSETS.map((href, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <img src={href} alt={BATTLEFIELD_LABELS[i]} className="w-20 h-20 object-cover rounded-md border border-stone-600" />
                            <span className="text-xs text-stone-400">{BATTLEFIELD_LABELS[i]}</span>
                        </div>
                    ))}
                    <div className="flex flex-col items-center gap-1">
                        <img src={appBackground} alt="App background" className="w-20 h-20 object-cover rounded-md border border-stone-600" />
                        <span className="text-xs text-stone-400">appBackground</span>
                    </div>
                </div>
            </Section>

            {/* ── 16. Animations ────────────────────────────────────────────── */}
            <Section title="16. Animations">
                <div className="flex gap-8 items-start">
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="w-16 h-16 rounded-md bg-red-500"
                            style={{ animation: "combat-flash 1.2s ease-in-out infinite" }}
                        />
                        <span className="text-xs text-stone-400">combat-flash</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="text-3xl font-bold text-amber-400"
                            style={{ animation: "score-pop 0.6s ease-out infinite" }}
                        >
                            +1
                        </div>
                        <span className="text-xs text-stone-400">score-pop</span>
                    </div>
                </div>
            </Section>

            {/* ── 17. Typography ────────────────────────────────────────────── */}
            <Section title="17. Typography & Misc">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold" style={{ color: "var(--color-title)" }}>
                        Title (--color-title)
                    </h1>
                    <h2 className="text-xl font-bold text-stone-100">Heading 2</h2>
                    <h3 className="text-lg font-semibold text-stone-200">Heading 3</h3>
                    <p className="text-base text-stone-300">Body text — The quick brown fox jumps over the lazy dog.</p>
                    <p className="text-sm text-stone-400">Small text — secondary information</p>
                    <p className="text-xs text-stone-500">Extra small — captions, labels</p>
                </div>
            </Section>
        </div>
    );
}
