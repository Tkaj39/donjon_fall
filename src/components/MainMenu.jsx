/**
 * MainMenu component — primary navigation hub.
 * Phase 9.3
 */

import { useState } from "react";
import { Logo } from "./Logo.jsx";
import { RulesViewer } from "./RulesViewer.jsx";

/**
 * @param {{ onPlay: () => void, onDirectPlay: () => void }} props
 * @returns { React.JSX.Element }
 */
export function MainMenu({onPlay, onDirectPlay}) {
    const [rulesOpen, setRulesOpen] = useState(false);

    return (
        <>
            <Logo className="fixed top-16 left-1/2 -translate-x-1/2"/>

            <div className="flex flex-col items-center justify-center gap-4 min-h-screen bg-stone-900/60">
                <button
                    onClick={onPlay}
                    className="bg-red-700 hover:bg-red-600 text-white font-semibold w-48 py-3 rounded-lg tracking-wide uppercase transition-colors"
                >
                    Play
                </button>
                <button
                    onClick={onDirectPlay}
                    className="bg-stone-600 hover:bg-stone-500 text-white font-semibold w-48 py-3 rounded-lg tracking-wide uppercase transition-colors"
                >
                    Direct Play
                </button>
                <button
                    onClick={() => setRulesOpen(true)}
                    className="bg-stone-700 hover:bg-stone-600 text-white font-semibold py-3 w-48 rounded-lg tracking-wide uppercase transition-colors"
                >
                    Rules
                </button>

                {rulesOpen && <RulesViewer onClose={() => setRulesOpen(false)}/>}
            </div>
        </>
    );
}