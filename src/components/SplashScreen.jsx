/**
 * SplashScreen component — shown briefly on app start while assets load.
 * Phase 9.2
 */

import { useEffect } from "react";

/** Duration in milliseconds before auto-advancing to the main menu. */
const SPLASH_DURATION_MS = 2000;

/**
 * @param {{ onDone: () => void }} props
 * @returns {JSX.Element}
 */
export function SplashScreen({ onDone }) {
    useEffect(() => {
        const timer = setTimeout(onDone, SPLASH_DURATION_MS);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-white">
            {/* Placeholder logo — replace with actual asset */}
            <div className="w-32 h-32 rounded-full bg-stone-600 flex items-center justify-center mb-8 text-stone-400 text-sm">
                LOGO
            </div>
            <h1 className="text-4xl font-bold tracking-widest uppercase">Donjon Fall</h1>
            <p className="mt-4 text-stone-400 text-sm">Pád Donjonu</p>
        </div>
    );
}