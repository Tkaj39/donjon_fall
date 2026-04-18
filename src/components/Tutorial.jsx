/**
 * Tutorial component — image gallery overlay teaching game mechanics.
 * Displayed as a modal over MainMenu. Uses the same rusty frame styling as buttons.
 */

import { useState } from "react";

/**
 * Tutorial steps — replace `image` with actual imported image paths when available.
 * @type {{ caption: string, image?: string }[]}
 */
const STEPS = [
    { caption: "Klikni na svou kostku. Můžeš ji posunout až o tolik polí, kolik ukazuje její hodnota — a to je zároveň její bojové číslo. Nemůžeš ale projít přes soupeřovy kostky ani přes vlastní kostky s vyšší hodnotou." },
    { caption: "Útok: Zautočit můžeš, pokud máš vyšší hodnotu než soupeř. Vybereš si, jestli chceš skočit na kostku (obsadit pole), nebo ji podunout (odstrčit). Po útoku má útočník vždy -1 k hodnotě své kostky. Při posunu se obráncova kostka přehodí, ale nemůže být vyšší než původní." },
    { caption: "Získávání bodů: Body získáš za zničení soupeřovy kostky (například vysunutím z herního plánu) nebo za udržení aktivního ohniska až do začátku svého příštího tahu. Cílem je získat 5 bodů jako první!" },
    { caption: "Tvorba věže: Pokud má tvoje nebo soupeřova kostka na poli nižší hodnotu, můžeš při pohybu umístit svou kostku na ni a vytvořit věž." },
    { caption: "Pohyb věže: Věž můžeš přesunout, pokud máš na jejím vrcholu svou kostku a máš převahu. Věž se pohybuje o počet tvých kostek v ní mínus počet soupeřových, minimálně o jedna." },
    { caption: "Útok věže: Věž může útočit na jiné věže nebo kostky, pokud má vyšší bojovou sílu. Bojová síla věže je hodnota vrchní kostky plus +1 za každou svou kostku pod ní a -1 za každou soupeřovu kostku pod ní. Vyhodnocení boje je stejné jako u kostek, ale věž může soupeře pouze vysunout z políčka (nemůže pole obsadit)." },
    { caption: "Skok kostky z věže: Kostka na vrcholu věže může seskočit na jiné pole. Může jít až o tolik polí, kolik je její hodnota, ale ne dál než by mohla věž. Při útoku má bonus jako celá věž (počítá se bojová síla věže)." },
        { caption: "Ohniska: Některá pole jsou ohniska, která dávají bod za udržení aktivního ohniska do začátku tvého tahu. Když získáš bod z ohniska, kostka se přehodí a její nová hodnota je minimálně o 1 nižší než původní. (Fokusní body a speciální schopnosti nejsou v této verzi hry.)" }
    ];

/**
 * @param {{ onClose: () => void }} props
 * @returns {React.JSX.Element}
 */
export function Tutorial({ onClose }) {
    const [step, setStep] = useState(0);

    function prev() {
        setStep((s) => Math.max(0, s - 1));
    }

    function next() {
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }

    const current = STEPS[step];
    const isFirst = step === 0;
    const isLast  = step === STEPS.length - 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="frame-panel flex flex-col items-center w-[720px] max-w-[95vw]">
                {/* Header */}
                <div className="flex items-center justify-between w-full px-12 pt-8 pb-2">
                    <h2 className="text-2xl font-bold tracking-widest uppercase text-stone-300">
                        Tutoriál
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-stone-500 hover:text-stone-200 text-xl leading-none transition-colors cursor-pointer"
                        aria-label="Zavřít"
                    >
                        ✕
                    </button>
                </div>

                {/* Image + arrows */}
                <div className="flex items-center gap-4 w-full px-8 mt-2">
                    {/* Left arrow */}
                    <button
                        onClick={prev}
                        disabled={isFirst}
                        className="text-4xl font-thin text-stone-400 hover:text-stone-100 disabled:text-stone-700 transition-colors cursor-pointer disabled:cursor-not-allowed select-none w-10 text-center"
                        aria-label="Předchozí"
                    >
                        &lt;
                    </button>

                    {/* Image placeholder */}
                    <div className="flex-1 aspect-video bg-stone-900/60 flex items-center justify-center rounded-sm overflow-hidden">
                        {current.image
                            ? <img src={current.image} alt={current.caption} className="w-full h-full object-contain" />
                            : (
                                <div className="flex flex-col items-center gap-3 text-stone-500">
                                    <span className="text-5xl">🖼</span>
                                    <span className="text-sm text-center px-4">{current.caption}</span>
                                </div>
                            )
                        }
                    </div>

                    {/* Right arrow */}
                    <button
                        onClick={next}
                        disabled={isLast}
                        className="text-4xl font-thin text-stone-400 hover:text-stone-100 disabled:text-stone-700 transition-colors cursor-pointer disabled:cursor-not-allowed select-none w-10 text-center"
                        aria-label="Další"
                    >
                        &gt;
                    </button>
                </div>

                {/* Caption */}
                <p className="text-stone-400 text-sm mt-3 px-12 text-center min-h-[1.5rem]">
                    {current.caption}
                </p>

                {/* Dot indicators */}
                <div className="flex gap-2 mt-4 mb-8">
                    {STEPS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
                                i === step ? "bg-stone-300" : "bg-stone-600 hover:bg-stone-400"
                            }`}
                            aria-label={`Krok ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
