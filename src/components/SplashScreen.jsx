/**
 * SplashScreen component — shown briefly on app start while assets load.
 * Phase 9.2
 */

import { useEffect } from "react";
import { Logo } from "./Logo.jsx";
import { preloadImages } from "../utils/preloadImages.js";
import { MENU_ASSETS } from "../styles/themes/default.js";
import Spinner from "./Spinner.jsx";

/** Minimum display duration after assets are loaded. */
const SPLASH_DURATION_MS = 2000;

/**
 * @param {{ onDone: () => void }} props
 * @returns { React.JSX.Element }
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
        <>
            <Logo className="fixed top-16 left-1/2 -translate-x-1/2"/>
            <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900/60">
                <Spinner />
            </div>
        </>
    );
}