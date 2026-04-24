/**
 * Tutorial component — step-by-step mini-map overlay teaching game mechanics.
 */

import { useState } from "react";
import { TutorialScene, hexRange, hexDist } from "./TutorialScene.jsx";

import picAttack        from "../assets/pictogram/pictogram-attack.svg";
import picDestroyed     from "../assets/pictogram/pictogram-destroyed.svg";
import picFocalActive   from "../assets/pictogram/pictogram-focal-active.svg";
import picJump          from "../assets/pictogram/pictogram-jump.svg";
import picMoveDice      from "../assets/pictogram/pictogram-move-dice.svg";
import picMoveTower     from "../assets/pictogram/pictogram-move-tower.svg";
import picPlus          from "../assets/pictogram/pictogram-plus.svg";
import picPush          from "../assets/pictogram/pictogram-push.svg";
import picReroll        from "../assets/pictogram/pictogram-reroll.svg";
import picTower         from "../assets/pictogram/pictogram-tower.svg";
import picTowerCollapse from "../assets/pictogram/pictogram-tower-collapse.svg";

const H2 = hexRange(2);

function reachable(hexes, oq, or_, radius) {
    return hexes
        .filter(h => !(h.q === oq && h.r === or_) && hexDist(oq, or_, h.q, h.r) <= radius)
        .map(h => ({ ...h, type: "reachable" }));
}

function trajectory(path) {
    return path.map(([q, r]) => ({ q, r, type: "trajectory" }));
}

// ---------------------------------------------------------------------------
// Scene definitions
// ---------------------------------------------------------------------------

const STEPS = [
    {
        icon: picMoveDice,
        title: "Pohyb kostky",
        caption: "Klikni na svou kostku. Můžeš ji posunout až o tolik polí, kolik ukazuje její hodnota — to je zároveň její bojové číslo. Nemůžeš projít přes soupeřovy kostky ani přes vlastní s vyšší hodnotou.",
        scene: {
            frames: [
                {
                    label: "Pohyb kostky",
                    hexes: H2,
                    dice:  [{ q: 0, r: 0, owner: "red", value: 3 }],
                    highlights: [
                        ...reachable(H2, 0, 0, 3).filter(
                            h => ![[1,0],[2,0],[2,-1]].some(([q,r]) => h.q===q && h.r===r)
                        ),
                        ...trajectory([[1,0],[2,0],[2,-1]]),
                    ],
                },
            ],
        },
    },
    {
        icon: picAttack,
        title: "Útok",
        caption: "Útok: Zautočit můžeš, pokud máš vyšší hodnotu než soupeř. Vyber si: obsadit pole (skoč na kostku), nebo ji odstrčit. Po útoku má útočník vždy −1 k hodnotě. Při odstrčení se obráncova kostka přehodí, ale nemůže být silnější než byla.",
        scene: {
            frames: [
                {
                    label: "Před útokem",
                    hexes: H2,
                    dice: [
                        { q: -1, r: 0, owner: "red",  value: 4 },
                        { q:  0, r: 0, owner: "blue", value: 2 },
                    ],
                    highlights: [
                        { q: -1, r: 0, type: "selected" },
                        { q:  0, r: 0, type: "target"   },
                    ],
                    arrows: [{ fromQ: -1, fromR: 0, toQ: 0, toR: 0 }],
                },
                {
                    label: "Obsazení",
                    hexes: H2,
                    dice: [
                        { q: 0, r: 0, owner: "blue", value: 2 },
                        { q: 0, r: 0, owner: "red",  value: 3 },
                    ],
                    highlights: [{ q: 0, r: 0, type: "selected" }],
                },
                {
                    label: "Vyšoupnutí",
                    hexes: H2,
                    dice: [
                        { q:  0, r: 0, owner: "red",  value: 3 },
                        { q:  1, r: 0, owner: "blue", value: 2, note: "↻ ≤2" },
                    ],
                    highlights: [
                        { q:  0, r: 0, type: "selected" },
                        { q:  1, r: 0, type: "target"   },
                    ],
                    arrows: [
                        { fromQ: -1, fromR: 0, toQ:  0, toR: 0 },
                        { fromQ:  0, fromR: 0, toQ:  1, toR: 0 },
                    ],
                },
            ],
            choices: [
                { label: "Obsazení",   frame: 1 },
                { label: "Vyšoupnutí", frame: 2 },
            ],
        },
    },
    {
        icon: picDestroyed,
        title: "Destrukce",
        caption: "Získávání bodů — destrukce: +1 bod za každou soupeřovu kostku zničenou vyšoupnutím z mapy, obklíčením nebo zhroucením věže. Cílem je získat 5 bodů jako první!",
        scene: {
            frames: [
                {
                    label: "Vyšoupnutí z mapy",
                    hexes: H2,
                    dice: [
                        { q: 1, r: 0, owner: "red",  value: 4 },
                        { q: 2, r: 0, owner: "blue", value: 2 },
                    ],
                    highlights: [
                        { q: 1, r: 0, type: "selected" },
                        { q: 2, r: 0, type: "target"   },
                    ],
                    arrows: [{ fromQ: 1, fromR: 0, toQ: 2, toR: 0 }],
                },
                {
                    label: "+1 bod — modrá vypadla z mapy",
                    hexes: H2,
                    dice: [
                        { q: 1, r: 0, owner: "red", value: 3 },
                    ],
                    highlights: [
                        { q: 1, r: 0, type: "selected" },
                        { q: 2, r: 0, type: "target"   },
                    ],
                    arrows: [{ fromQ: 2, fromR: 0, toQ: 3, toR: 0 }],
                },
            ],
        },
    },
    {
        icon: picFocalActive,
        title: "Ohniska",
        caption: "Získávání bodů — ohniska: Pokud tvoje kostka stála na aktivním ohnisku na konci tvého minulého tahu, na začátku tahu získáš bod. Kostka se přehodí na stejnou nebo nižší hodnotu.",
        scene: {
            frames: [
                {
                    label: "Kostka na ohnisku",
                    hexes: hexRange(3),
                    dice: [{ q: 0, r: 0, owner: "red", value: 4 }],
                    highlights: [
                        { q:  0, r:  0, type: "focal" },
                        { q: -3, r:  2, type: "focal" },
                        { q:  3, r: -2, type: "focal" },
                    ],
                },
                {
                    label: "+1 bod — kostka přehozena",
                    hexes: hexRange(3),
                    dice: [{ q: 0, r: 0, owner: "red", value: 3, note: "↻ <4" }],
                    highlights: [
                        { q:  0, r:  0, type: "focal" },
                        { q: -3, r:  2, type: "focal" },
                        { q:  3, r: -2, type: "focal" },
                    ],
                },
            ],
        },
    },
    {
        icon: picTower,
        title: "Tvorba věže",
        caption: "Tvorba věže: Přesuneš-li kostku na pole s jinou kostkou nižší hodnoty, vznikne věž. Na vlastní kostku bez boje — hodnota se nemění. Na soupeřovu kostku přes boj — útočník ztrácí 1.",
        scene: {
            dual: [
                {
                    title: "Vlastní věž",
                    frames: [
                        {
                            label: "Před přesunem",
                            hexes: hexRange(1),
                            dice: [
                                { q: 0, r: -1, owner: "red", value: 3 },
                                { q: 0, r:  0, owner: "red", value: 2 },
                            ],
                            highlights: [{ q: 0, r: 0, type: "trajectory" }],
                            arrows: [{ fromQ: 0, fromR: -1, toQ: 0, toR: 0 }],
                        },
                        {
                            label: "Věž — hodnota beze změny",
                            hexes: hexRange(1),
                            dice: [
                                { q: 0, r: 0, owner: "red", value: 2 },
                                { q: 0, r: 0, owner: "red", value: 3 },
                            ],
                            highlights: [{ q: 0, r: 0, type: "selected" }],
                        },
                    ],
                },
                {
                    title: "Smíšená věž",
                    frames: [
                        {
                            label: "Útok na soupeře",
                            hexes: hexRange(1),
                            dice: [
                                { q: 0, r: -1, owner: "red",  value: 4 },
                                { q: 0, r:  0, owner: "blue", value: 2 },
                            ],
                            highlights: [
                                { q: 0, r: -1, type: "selected" },
                                { q: 0, r:  0, type: "target"   },
                            ],
                            arrows: [{ fromQ: 0, fromR: -1, toQ: 0, toR: 0 }],
                        },
                        {
                            label: "Smíšená věž — útočník −1",
                            hexes: hexRange(1),
                            dice: [
                                { q: 0, r: 0, owner: "blue", value: 2 },
                                { q: 0, r: 0, owner: "red",  value: 3 },
                            ],
                            highlights: [{ q: 0, r: 0, type: "selected" }],
                        },
                    ],
                },
            ],
        },
    },
    {
        icon: picMoveTower,
        title: "Pohyb věže",
        caption: "Pohyb věže: Věž přesuneš, pokud máš navrchu svou kostku. Dosah = počet vlastních kostek − počet soupeřových (min 1). Věž se pohybuje jako celek.",
        scene: {
            frames: [
                {
                    label: "Pohyb věže (dosah 2)",
                    hexes: H2,
                    dice: [
                        { q: 0, r: 0, owner: "red", value: 2 },
                        { q: 0, r: 0, owner: "red", value: 4 },
                    ],
                    highlights: reachable(H2, 0, 0, 2),
                },
            ],
        },
    },
    {
        icon: picPush,
        title: "Útok věže",
        caption: "Útok věže: Bojová síla věže = hodnota vrchní kostky + vlastní kostky pod ní − soupeřovy kostky pod ní. Věž může soupeře pouze vyšoupnout — nemůže pole obsadit.",
        scene: {
            frames: [
                {
                    label: "Věž útočí (síla 5 vs 2)",
                    hexes: H2,
                    dice: [
                        { q: -1, r: 0, owner: "red",  value: 2 },
                        { q: -1, r: 0, owner: "red",  value: 4 },
                        { q:  0, r: 0, owner: "blue", value: 2 },
                    ],
                    highlights: [
                        { q: -1, r: 0, type: "selected" },
                        { q:  0, r: 0, type: "target"   },
                    ],
                    arrows: [{ fromQ: -1, fromR: 0, toQ: 0, toR: 0 }],
                },
                {
                    label: "Věž se posune, soupeř vyšoupnut",
                    hexes: H2,
                    dice: [
                        { q:  0, r: 0, owner: "red",  value: 2 },
                        { q:  0, r: 0, owner: "red",  value: 3 },
                        { q:  1, r: 0, owner: "blue", value: 2, note: "↻ ≤2" },
                    ],
                    highlights: [
                        { q:  0, r: 0, type: "selected" },
                        { q:  1, r: 0, type: "target"   },
                    ],
                    arrows: [
                        { fromQ: -1, fromR: 0, toQ:  0, toR: 0 },
                        { fromQ:  0, fromR: 0, toQ:  1, toR: 0 },
                    ],
                },
            ],
        },
    },
    {
        icon: picJump,
        title: "Skok z věže",
        caption: "Skok z věže: Vrchní kostka může seskočit. Dosah skoku = vlastní kostky ve věži − soupeřovy. Útočí s bojovou silou celé věže, ale pohybuje se samostatně.",
        scene: {
            frames: [
                {
                    label: "Skok z věže (dosah 2)",
                    hexes: H2,
                    dice: [
                        { q: -1, r: 0, owner: "red", value: 1 },
                        { q: -1, r: 0, owner: "red", value: 3 },
                    ],
                    highlights: [
                        { q: -1, r: 0, type: "selected" },
                        ...reachable(H2, -1, 0, 2).filter(
                            h => !(h.q === 1 && h.r === 0)
                        ),
                        { q: 1, r: 0, type: "trajectory" },
                    ],
                    arrows: [{ fromQ: -1, fromR: 0, toQ: 1, toR: 0 }],
                },
            ],
        },
    },
    {
        icon: picPlus,
        title: "Průchod věží",
        caption: "Průchod vlastní věží: Táhneš-li kostkou přes vlastní věž nebo kostku, platí pro tebe pravidla skoku z věže — dosah i bojová síla se řídí věží, přes kterou jsi prošel.",
        scene: {
            frames: [
                {
                    label: "Kostka táhne přes vlastní věž",
                    hexes: H2,
                    dice: [
                        { q: -2, r: 0, owner: "red", value: 5 },
                        { q:  0, r: 0, owner: "red", value: 1 },
                        { q:  0, r: 0, owner: "red", value: 3 },
                        { q:  2, r: 0, owner: "blue", value: 5 },
                    ],
                    highlights: [
                        { q: -2, r: 0, type: "selected"   },
                        { q:  0, r: 0, type: "trajectory" },
                        { q:  2, r: 0, type: "target"     },
                        { q: -1, r: 0, type: "trajectory" },
                        { q:  1, r: 0, type: "trajectory" },
                    ],
                    arrows: [
                        { fromQ: -2, fromR: 0, toQ: 0, toR: 0 },
                        { fromQ:  0, fromR: 0, toQ: 2, toR: 0 },
                    ],
                },
                {
                    label: "Útočí silou věže (4+1=5 vs 5)",
                    hexes: H2,
                    dice: [
                        { q:  0, r: 0, owner: "red", value: 1 },
                        { q:  0, r: 0, owner: "red", value: 3 },
                        { q:  2, r: 0, owner: "blue", value: 5, note: "↻ ≤5" },
                        { q:  1, r: 0, owner: "red",  value: 5 },
                    ],
                    highlights: [
                        { q: 0, r: 0, type: "selected" },
                        { q: 1, r: 0, type: "selected" },
                        { q: 2, r: 0, type: "target"   },
                    ],
                    arrows: [{ fromQ: 1, fromR: 0, toQ: 2, toR: 0 }],
                },
            ],
        },
    },
    {
        icon: picTowerCollapse,
        title: "Zhroucení věže",
        caption: "Zhroucení věže: Věž se 3+ kostkami může zhroutit. Hráč s vrchní kostkou ji aktivuje — spodní kostka je odstraněna. Pokud to byl soupeřův kámen, získáváš bod.",
        scene: {
            frames: [
                {
                    label: "Věž 3 kostek",
                    hexes: hexRange(1),
                    dice: [
                        { q: 0, r: 0, owner: "blue", value: 1 },
                        { q: 0, r: 0, owner: "red",  value: 3 },
                        { q: 0, r: 0, owner: "red",  value: 5 },
                    ],
                    highlights: [{ q: 0, r: 0, type: "selected" }],
                },
                {
                    label: "Po zhroucení — spodní odebrána",
                    hexes: hexRange(1),
                    dice: [
                        { q: 0, r: 0, owner: "red", value: 3 },
                        { q: 0, r: 0, owner: "red", value: 5 },
                    ],
                    highlights: [{ q: 0, r: 0, type: "selected" }],
                },
            ],
        },
    },
];

// ---------------------------------------------------------------------------
// Tutorial component
// ---------------------------------------------------------------------------

/** @param {{ onClose: () => void }} props */
export function Tutorial({ onClose }) {
    const [step, setStep] = useState(0);

    const current = STEPS[step];
    const isFirst = step === 0;
    const isLast  = step === STEPS.length - 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="frame-panel flex flex-col items-center w-[680px] max-w-[95vw]">
                {/* Header */}
                <div className="flex items-center justify-between w-full px-12 pt-8 pb-2">
                    <h2 className="text-2xl font-bold tracking-widest uppercase text-stone-300">
                        Tutoriál
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Zavřít"
                        className="btn-frame-sm px-2 py-1 text-stone-400 hover:text-stone-100 cursor-pointer text-base leading-none transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Step title */}
                <div className="flex items-center gap-3 px-12 pb-1">
                    {current.icon && (
                        <img src={current.icon} alt="" className="w-8 h-8 shrink-0 invert opacity-80" />
                    )}
                    <h3 className="m-0 text-lg font-semibold text-stone-200">{current.title}</h3>
                </div>

                {/* Mini-map + arrows */}
                <div className="flex items-center gap-4 w-full px-8 mt-2">
                    <button
                        onClick={() => setStep(s => Math.max(0, s - 1))}
                        disabled={isFirst}
                        className="text-4xl font-thin text-stone-400 hover:text-stone-100 disabled:text-stone-700 transition-colors cursor-pointer disabled:cursor-not-allowed select-none w-10 text-center shrink-0"
                        aria-label="Předchozí"
                    >
                        &lt;
                    </button>

                    <div className="flex-1 aspect-video flex items-center justify-center overflow-hidden p-2">
                        {current.scene.dual ? (
                            <div className="flex gap-3 w-full h-full">
                                {current.scene.dual.map((s, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                                        <span className="text-xs uppercase tracking-widest text-stone-500 shrink-0">
                                            {s.title}
                                        </span>
                                        <div className="flex-1 w-full min-h-0">
                                            <TutorialScene key={`${step}-${i}`} frames={s.frames} choices={s.choices} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <TutorialScene key={step} frames={current.scene.frames} choices={current.scene.choices} />
                        )}
                    </div>

                    <button
                        onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
                        disabled={isLast}
                        className="text-4xl font-thin text-stone-400 hover:text-stone-100 disabled:text-stone-700 transition-colors cursor-pointer disabled:cursor-not-allowed select-none w-10 text-center shrink-0"
                        aria-label="Další"
                    >
                        &gt;
                    </button>
                </div>

                {/* Caption */}
                <div className="mt-3 px-12 min-h-[2.5rem]">
                    <p className="text-stone-400 text-sm text-center">
                        {current.caption}
                    </p>
                </div>

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
