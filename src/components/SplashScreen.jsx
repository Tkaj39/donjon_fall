/**
 * SplashScreen component — shown briefly on app start while assets load.
 * Phase 9.2
 */

import { useEffect } from "react";
import { Logo } from "./Logo.jsx";
import { preloadImages } from "../utils/preloadImages.js";
import { MENU_ASSETS } from "../styles/themes/default.js";

/** Minimum display duration after assets are loaded. */
const SPLASH_DURATION_MS = 2000;

/**
 * @param {{ onDone: () => void }} props
 * @returns {JSX.Element}
 */
export function SplashScreen({ onDone }) {
    useEffect(() => {
        let cancelled = false;
        preloadImages(MENU_ASSETS).then(() => {
            if (cancelled) return;
            const timer = setTimeout(() => { if (!cancelled) onDone(); }, SPLASH_DURATION_MS);
            return () => clearTimeout(timer);
        });
        return () => { cancelled = true; };
    }, [onDone]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900/60 text-white">
            <Logo className="w-48 h-48 mb-8" />
            <h1 className="text-4xl font-bold tracking-widest uppercase">Donjon Fall</h1>
            <p className="mt-4 text-stone-400 text-sm">Pád Donjonu</p>
            <div className="mt-8 h-6 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-stone-400 border-t-transparent animate-spin" />
            </div>
        </div>
    );
}