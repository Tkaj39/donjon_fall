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
import { CombatOverlay } from "./CombatOverlay.jsx";
import { Die } from "./Die.jsx";
import { DirectionPickerOverlay } from "./DirectionPickerOverlay.jsx";
import { FocalPointMarker } from "./FocalPointMarker.jsx";
import { Logo } from "./Logo.jsx";
import { PlayerShield } from "./PlayerShield.jsx";
import { Spinner } from "./Spinner.jsx";
import { TutorialScene } from "./TutorialScene.jsx";
import { VictoryScreen } from "./VictoryScreen.jsx";
import { NAMED_PLAYER_COLORS } from "./Board.jsx";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** CSS custom properties defined in index.css :root, grouped by usage. */
const CSS_VAR_GROUPS = [
    {
        group: "Hex pole",
        vars: [
            { name: "--color-hex-default",         label: "default",         usage: "výchozí výplň prázdného pole" },
            { name: "--color-hex-focal",            label: "focal",           usage: "výplň ohniskového pole" },
            { name: "--color-hex-selected",         label: "selected",        usage: "výplň vybraného pole (isSelected)" },
            { name: "--color-hex-stroke",           label: "stroke",          usage: "obrys každého hexu" },
        ],
    },
    {
        group: "Hex zvýraznění (highlights)",
        vars: [
            { name: "--color-hex-reachable",        label: "reachable",       usage: "pole kam lze přesunout kostku" },
            { name: "--color-hex-highlighted",      label: "highlighted",     usage: "selected overlay (typ 'selected')" },
            { name: "--color-hex-trajectory",       label: "trajectory",      usage: "políčka na cestě přesunu" },
            { name: "--color-hex-enemy-reachable",  label: "enemy-reachable", usage: "pole dosažitelná soupeřem" },
        ],
    },
    {
        group: "Ohniska (focal points)",
        vars: [
            { name: "--color-focal-active",         label: "active",          usage: "FocalPointMarker výplň + aktivní-ohnisko overlay na HexTile" },
            { name: "--color-focal-active-stroke",  label: "active-stroke",   usage: "obrys aktivního i pasivního markeru" },
            { name: "--color-focal-passive",        label: "passive",         usage: "výplň pasivního ohniska" },
        ],
    },
    {
        group: "Ostatní",
        vars: [
            { name: "--color-title",                label: "title",           usage: "původně pro nadpis aplikace", unused: true },
        ],
    },
];

/** Player palette — derived from NAMED_PLAYER_COLORS (Board.jsx). */
const PLAYER_PALETTE = Object.entries(NAMED_PLAYER_COLORS).map(([id, c]) => ({ id, ...c }));

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
const MOCK_COMBAT_STATE = {
    combat: { attackerHex: "0,0", defenderHex: "1,0" },
    dice: { "0,0": [{ owner: "red", value: 5 }], "1,0": [{ owner: "blue", value: 3 }] },
};

export function StyleGuide({ onBack }) {
    const [showVictory, setShowVictory] = useState(false);
    const [showCombat, setShowCombat] = useState(false);
    const [showGameMenu, setShowGameMenu] = useState(false);
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);

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
                <div className="flex flex-col gap-6">
                    {CSS_VAR_GROUPS.map(({ group, vars }) => (
                        <div key={group}>
                            <p className="text-xs uppercase tracking-widest text-amber-500/70 mb-2">{group}</p>
                            <div className="flex flex-col gap-2">
                                {vars.map(({ name, label, usage, unused }) => (
                                    <div key={name} className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            <div
                                                className="w-8 h-8 rounded-md border border-stone-600"
                                                style={{ background: `var(${name})` }}
                                            />
                                            {unused && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[0.6rem] font-bold flex items-center justify-center leading-none">!</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`text-xs font-mono ${unused ? "text-stone-500 line-through" : "text-stone-300"}`}>{name}</span>
                                            <span className="text-[0.7rem] text-stone-500 leading-tight">{usage}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── 2. Player Palette ─────────────────────────────────────────── */}
            <Section title="2. Player Palette">
                <div className="flex gap-6 mb-3 text-xs text-stone-400">
                    <span><span className="inline-block w-3 h-3 rounded-sm bg-red-600 mr-1 align-middle" />primary — barva těla kostky (Die, MovingDie)</span>
                    <span><span className="inline-block w-3 h-3 rounded-sm bg-red-300 mr-1 align-middle" />tint — tint startovního pole (HexTile)</span>
                    <span><span className="inline-block w-3 h-3 rounded-sm bg-red-400 mr-1 align-middle" />glow — záře aktivního štítu, barva tooltipů (PlayerShield, Game)</span>
                </div>
                <div className="flex flex-wrap gap-4">
                    {PLAYER_PALETTE.map(({ id, primary, tint, glow }) => (
                        <div key={id} className="flex flex-col items-center gap-1">
                            <div className="flex gap-1">
                                <div className="w-10 h-10 rounded-md border border-stone-600" style={{ background: primary }} title={`primary: ${primary}`} />
                                <div className="w-10 h-10 rounded-md border border-stone-600" style={{ background: tint }}    title={`tint: ${tint}`} />
                                <div className="w-10 h-10 rounded-md border border-stone-600" style={{ background: glow }}    title={`glow: ${glow}`} />
                            </div>
                            <span className="text-xs text-stone-300 capitalize">{id}</span>
                            <span className="text-[0.6rem] text-stone-500">{primary}</span>
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

            {/* ── 9. Combat Overlay ────────────────────────────────────────── */}
            <Section title="9. Combat Overlay">
                <p className="text-sm text-stone-400 mb-3">
                    frame-panel + btn-frame styling. Click to show live overlay.
                </p>
                <button
                    onClick={() => setShowCombat(true)}
                    className="py-2 px-5 rounded-lg bg-stone-700 text-stone-200 font-semibold cursor-pointer border border-stone-600"
                >
                    Show Combat Overlay
                </button>
                {showCombat && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        <CombatOverlay
                            state={MOCK_COMBAT_STATE}
                            options={["push", "occupy"]}
                            onChoose={() => setShowCombat(false)}
                        />
                    </div>
                )}
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

            {/* ── 18. btn-frame & frame-panel ───────────────────────────────── */}
            <Section title="18. btn-frame & frame-panel">
                <p className="text-sm text-stone-400 mb-4">
                    Rusty metal border-image applied to buttons and panel containers.
                </p>
                <div className="flex flex-wrap gap-4 items-start mb-6">
                    <button className="btn-frame px-8 py-4 text-lg font-semibold tracking-wide text-stone-300 cursor-pointer">
                        btn-frame
                    </button>
                    <button className="btn-frame px-6 py-3 text-base font-semibold text-stone-300 cursor-pointer">
                        btn-frame střední
                    </button>
                    <button className="btn-frame-sm px-5 py-2 text-sm font-semibold text-stone-300 cursor-pointer">
                        btn-frame-sm
                    </button>
                    <button className="btn-frame-sm px-3 py-1 text-xs font-semibold text-stone-300 cursor-pointer">
                        btn-frame-sm tiny
                    </button>
                </div>
                <div className="frame-panel flex flex-col gap-3 w-64 px-8 py-6">
                    <p className="text-stone-300 font-bold text-center tracking-widest uppercase text-sm">frame-panel</p>
                    <p className="text-stone-500 text-xs text-center">Used for modals and overlays</p>
                </div>
            </Section>

            {/* ── 19. PlayerShield ──────────────────────────────────────────── */}
            <Section title="19. PlayerShield">
                <p className="text-sm text-stone-400 mb-4">
                    Active (glow) vs inactive (grayscale). Score shield partially behind main shield.
                </p>
                <div className="flex gap-12 items-center bg-stone-800 rounded-lg p-6">
                    <div className="flex flex-col items-center gap-2">
                        <PlayerShield playerId="red" cfg={{ name: "Červený", coatOfArms: "dragon" }} score={3} isActive={true} />
                        <span className="text-xs text-stone-500">Active</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <PlayerShield playerId="blue" cfg={{ name: "Modrý", coatOfArms: "wolf" }} score={1} isActive={false} />
                        <span className="text-xs text-stone-500">Inactive</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <PlayerShield playerId="red" cfg={{ name: "Red" }} score={0} isActive={false} />
                        <span className="text-xs text-stone-500">No coat of arms</span>
                    </div>
                </div>
            </Section>

            {/* ── 20. TutorialScene ─────────────────────────────────────────── */}
            <Section title="20. TutorialScene (Mini Hex Map)">
                <p className="text-sm text-stone-400 mb-4">
                    SVG mini board used in Tutorial steps. Supports frames, highlights, arrows, dice notes.
                </p>
                <div className="w-80 bg-stone-800 rounded-lg p-3">
                    <TutorialScene
                        frames={[
                            {
                                label: "Ukázkový útok",
                                hexes: [
                                    {q:-2,r:0},{q:-1,r:0},{q:0,r:0},{q:1,r:0},{q:2,r:0},
                                    {q:-1,r:1},{q:0,r:1},{q:1,r:1},
                                    {q:-1,r:-1},{q:0,r:-1},{q:1,r:-1},
                                ],
                                dice: [
                                    { q: -1, r: 0, owner: "red",  value: 4 },
                                    { q:  1, r: 0, owner: "blue", value: 2, note: "↻ ≤2" },
                                ],
                                highlights: [
                                    { q: -1, r: 0, type: "selected" },
                                    { q:  0, r: 0, type: "trajectory" },
                                    { q:  1, r: 0, type: "target" },
                                ],
                                arrows: [{ fromQ: -1, fromR: 0, toQ: 1, toR: 0 }],
                            },
                        ]}
                    />
                </div>
            </Section>

            {/* ── 21. Scrollbar ─────────────────────────────────────────────── */}
            <Section title="21. Scrollbar (.scrollbar-stone)">
                <p className="text-sm text-stone-400 mb-4">
                    Custom scrollbar used in RulesViewer and any overflow container.
                </p>
                <div className="overflow-y-auto scrollbar-stone h-32 w-64 bg-stone-800 rounded-lg p-4 text-stone-400 text-sm">
                    {Array.from({ length: 12 }, (_, i) => (
                        <p key={i} className="mb-1">Řádek {i + 1} — scrollovatelný obsah</p>
                    ))}
                </div>
            </Section>

            {/* ── 22. Game pause menu & settings overlay ────────────────────── */}
            <Section title="22. Game Pause Menu & Settings Overlay">
                <p className="text-sm text-stone-400 mb-4">
                    Hamburger menu (pauza) and in-game settings modal. Both darken the background.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowGameMenu(true)}
                        className="py-2 px-5 rounded-lg bg-stone-700 text-stone-200 font-semibold cursor-pointer border border-stone-600"
                    >
                        Show Pause Menu
                    </button>
                    <button
                        onClick={() => setShowSettingsOverlay(true)}
                        className="py-2 px-5 rounded-lg bg-stone-700 text-stone-200 font-semibold cursor-pointer border border-stone-600"
                    >
                        Show Settings Overlay
                    </button>
                </div>
                {showGameMenu && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowGameMenu(false)}>
                        <div className="frame-panel flex flex-col items-stretch min-w-[240px] py-6 px-2 gap-1" onClick={e => e.stopPropagation()}>
                            <h2 className="text-center text-lg font-bold tracking-widest uppercase text-stone-300 mb-3 px-6">Pauza</h2>
                            <button className="btn-frame px-6 py-3 text-base font-semibold tracking-wide text-stone-300 cursor-pointer">Nový start</button>
                            <button className="btn-frame px-6 py-3 text-base font-semibold tracking-wide text-stone-300 cursor-pointer">Nastavení</button>
                            <button className="btn-frame px-6 py-3 text-base font-semibold tracking-wide text-stone-300 cursor-pointer">Opustit hru</button>
                            <button onClick={() => setShowGameMenu(false)} className="mt-2 px-6 py-2 text-sm text-stone-500 hover:text-stone-300 transition-colors cursor-pointer">Zpět do hry</button>
                        </div>
                    </div>
                )}
                {showSettingsOverlay && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSettingsOverlay(false)}>
                        <div className="frame-panel flex flex-col gap-5 w-80 px-10 py-8" onClick={e => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold tracking-widest text-stone-300 uppercase text-center">Nastavení</h2>
                            <div className="flex items-center justify-between border-b border-stone-700 pb-4">
                                <span className="text-stone-300 tracking-wide">Zvuk</span>
                                <div className="w-14 h-7 rounded-full bg-stone-400 relative"><span className="absolute top-1 left-8 w-5 h-5 rounded-full bg-white" /></div>
                            </div>
                            <div className="flex items-center justify-between border-b border-stone-700 pb-4">
                                <span className="text-stone-300 tracking-wide">Animace</span>
                                <div className="w-14 h-7 rounded-full bg-stone-700 relative"><span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white" /></div>
                            </div>
                            <button onClick={() => setShowSettingsOverlay(false)} className="btn-frame px-6 py-3 text-base font-semibold tracking-wide text-stone-300 cursor-pointer mt-2">Zpět do hry</button>
                        </div>
                    </div>
                )}
            </Section>
        </div>
    );
}
