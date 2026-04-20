/**
 * MainMenu component — primary navigation hub with sidebar layout.
 * Phase 9.3
 *
 * Layout: left sidebar (menu items) + right canvas (placeholder).
 * Items without implemented functionality are rendered as disabled buttons.
 */

import { useState } from "react";
import { Logo } from "./Logo.jsx";
import { RulesViewer } from "./RulesViewer.jsx";
import { SettingsPanel } from "./SettingsPanel.jsx";
import { Tutorial } from "./Tutorial.jsx";

/** Application version shown in the sidebar footer. */
const APP_VERSION = "v0.1.0";

/**
 * @typedef {"main"|"start"|"settings"} Screen
 */

/* ── MenuSidebar sub-component ────────────────────────────────────────────── */

/**
 * Shared sidebar used across all menu screens. Logo size and footer are defined here once.
 *
 * @param {{ children: React.ReactNode, footer?: React.ReactNode }} props
 */
export function MenuSidebar({ children, footer }) {
    return (
        <nav className="flex flex-col w-72 shrink-0 bg-black/70 border-r-4 border-double border-stone-500">
            <div className="flex justify-center pt-6 pb-4">
                <Logo className="w-46 h-20" />
            </div>
            <div className="flex flex-col gap-4 px-3 overflow-y-auto grow">
                {children}
            </div>
            {footer && (
                <div className="flex flex-col px-3 pb-3 gap-3 border-t border-stone-700 pt-3">
                    {footer}
                </div>
            )}
        </nav>
    );
}

/* ── MenuButton sub-component ─────────────────────────────────────────────── */

/**
 * Single menu button rendered inside the sidebar.
 *
 * @param {{
 *   label: string,
 *   onClick?: () => void,
 *   disabled?: boolean,
 *   hasSubmenu?: boolean,
 *   isOpen?: boolean
 * }} props
 * @returns {React.JSX.Element}
 */
function MenuButton({ label, onClick, disabled = false, hasSubmenu = false, isOpen = false }) {
    /** Base classes shared by all states. */
    const base = "btn-frame w-full text-center px-6 py-6 text-3xl font-semibold tracking-wide transition-colors flex items-center justify-center";

    /** Enabled interactive style. */
    const enabled = "hover:bg-stone-700 text-stone-400 cursor-pointer";

    /** Disabled (greyed-out) style for unimplemented features. */
    const disabledStyle = "text-stone-600 cursor-not-allowed";

    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`${base} ${disabled ? disabledStyle : enabled}`}
        >
            <span>{label}</span>
        </button>
    );
}

// ---------------------------------------------------------------------------
// MainMenu — Exported Component
// ---------------------------------------------------------------------------

/**
 * @param {{ onPlay: () => void, onDirectPlay: () => void }} props
 * @returns {React.JSX.Element}
 */
/** @param {{ onPlay: () => void, onDirectPlay: () => void }} props */
export function MainMenu({ onPlay, onDirectPlay, initialScreen = "main" }) {
    const [rulesOpen, setRulesOpen] = useState(false);
    const [tutorialOpen, setTutorialOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [sound, setSound] = useState(true);
    const [animations, setAnimations] = useState(true);
    const [language, setLanguage] = useState("cs");
    /** @type {[Screen, Function]} */
    const [screen, setScreen] = useState(initialScreen);

    if (screen === "start") {
        return (
            <StartScreen
                onPlay={onPlay}
                onDirectPlay={onDirectPlay}
                onBack={() => setScreen("main")}
            />
        );
    }

    return (
        <div className="flex min-h-screen text-white">
            <MenuSidebar footer={
                <div className="flex items-center justify-between text-stone-500 text-xs px-1">
                    <span>{APP_VERSION}</span>
                    <a href="https://github.com/Tkaj39/donjon_fall" target="_blank" rel="noopener noreferrer" className="hover:text-stone-300 transition-colors" aria-label="GitHub">GitHub</a>
                </div>
            }>
                <MenuButton label="Start" onClick={() => setScreen("start")} />
                <MenuButton label="Continue" disabled />
                <MenuButton label="Tutorial" onClick={() => setTutorialOpen(true)} />
                <MenuButton label="Rules" onClick={() => setRulesOpen(true)} />
                <MenuButton label="Settings" onClick={() => setSettingsOpen(true)} />
            </MenuSidebar>

            {/* ── Canvas (right area) ─────────────────────────── */}
            <main className="flex flex-col items-center justify-center grow">
                <p className="text-stone-500 text-lg uppercase tracking-widest">
                    Donjon Fall
                </p>
                <p className="text-stone-600 text-sm mt-2">
                    Select an option from the menu
                </p>
            </main>

            {rulesOpen && <RulesViewer onClose={() => setRulesOpen(false)} />}
            {tutorialOpen && <Tutorial onClose={() => setTutorialOpen(false)} />}
            {settingsOpen && (
                <SettingsPanel
                    sound={sound}
                    onSoundChange={setSound}
                    animations={animations}
                    onAnimationsChange={setAnimations}
                    language={language}
                    onLanguageChange={setLanguage}
                    onClose={() => setSettingsOpen(false)}
                />
            )}
        </div>
    );
}

/* ── StartScreen ───────────────────────────────────────────────────────────── */

/**
 * @param {{ onPlay: () => void, onDirectPlay: () => void, onBack: () => void }} props
 * @returns {React.JSX.Element}
 */
function StartScreen({ onPlay, onDirectPlay, onBack }) {
    return (
        <div className="flex min-h-screen text-white">
            <MenuSidebar footer={
                <>
                    <MenuButton label="Back" onClick={onBack} />
                    <div className="flex items-center justify-between text-stone-500 text-xs px-1">
                        <span>{APP_VERSION}</span>
                    </div>
                </>
            }>
                <MenuButton label="Quick Start" onClick={onDirectPlay} />
                <MenuButton label="Configure Game" onClick={onPlay} />
            </MenuSidebar>

            {/* ── Canvas ──────────────────────────────────────── */}
            <main className="flex flex-col items-center justify-center grow">
                <p className="text-stone-500 text-lg uppercase tracking-widest">
                    New Game
                </p>
                <p className="text-stone-600 text-sm mt-2">
                    Choose a game mode
                </p>
            </main>
        </div>
    );
}

