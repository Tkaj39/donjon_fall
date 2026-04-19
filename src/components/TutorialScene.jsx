/**
 * TutorialScene — mini hex-board SVG for tutorial steps.
 * Renders a subset of hexes with dice, highlights and movement arrows.
 */

import { useState } from "react";

const R    = 26;
const SQ3  = Math.sqrt(3);

function hp(q, r) {
    return { x: R * (SQ3 * q + SQ3 / 2 * r), y: R * 1.5 * r };
}

function pts(cx, cy) {
    return Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${(cx + (R - 1) * Math.cos(a)).toFixed(1)},${(cy + (R - 1) * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
}

export function hexRange(radius) {
    const out = [];
    for (let q = -radius; q <= radius; q++)
        for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++)
            out.push({ q, r });
    return out;
}

export function hexDist(q1, r1, q2, r2) {
    return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(q1 + r1 - q2 - r2));
}

const HL_FILL = {
    reachable:  "rgba(74,222,128,0.28)",
    trajectory: "rgba(56,189,248,0.45)",
    focal:      "rgba(251,191,36,0.50)",
    target:     "rgba(248,113,113,0.55)",
    selected:   "rgba(250,250,200,0.18)",
};

const PC = { red: "#dc2626", blue: "#2563eb" };

/**
 * @param {{
 *   frames:   Array<{label?:string,hexes:{q:number,r:number}[],dice?:any[],highlights?:any[],arrows?:any[]}>,
 *   choices?: Array<{label:string,frame:number}>
 * }} props
 */
export function TutorialScene({ frames, choices }) {
    const [fi, setFi] = useState(0);
    const frame = frames[Math.min(fi, frames.length - 1)];
    const { hexes, dice = [], highlights = [], arrows = [], label } = frame;

    const hlMap = Object.fromEntries(highlights.map(h => [`${h.q},${h.r}`, h.type]));
    const diceMap = {};
    for (const d of dice) {
        const k = `${d.q},${d.r}`;
        (diceMap[k] ??= []).push(d);
    }

    const pxs = hexes.map(({ q, r }) => hp(q, r));
    const pad  = R * 1.6;
    const x0   = Math.min(...pxs.map(p => p.x)) - pad;
    const y0   = Math.min(...pxs.map(p => p.y)) - pad;
    const vw   = Math.max(...pxs.map(p => p.x)) + pad - x0;
    const vh   = Math.max(...pxs.map(p => p.y)) + pad - y0;

    return (
        <div className="flex flex-col items-center gap-2 w-full h-full">
            {label && (
                <span className="text-xs uppercase tracking-widest text-stone-400 shrink-0">
                    {label}
                </span>
            )}

            <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full max-h-[260px]">
                <defs>
                    <marker id="ta" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L7,3z" fill="rgba(255,240,130,0.92)" />
                    </marker>
                </defs>

                {hexes.map(({ q, r }) => {
                    const k = `${q},${r}`;
                    const { x, y } = hp(q, r);
                    const cx = x - x0, cy = y - y0;
                    return (
                        <g key={k}>
                            <polygon points={pts(cx, cy)} fill="rgba(22,14,7,0.82)" stroke="#57534e" strokeWidth="1" />
                            {hlMap[k] && (
                                <polygon points={pts(cx, cy)} fill={HL_FILL[hlMap[k]] ?? "rgba(200,200,200,0.25)"} />
                            )}
                        </g>
                    );
                })}

                {arrows.map(({ fromQ: fq, fromR: fr, toQ: tq, toR: tr }, i) => {
                    const a = hp(fq, fr), b = hp(tq, tr);
                    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
                    const sh = R * 0.6;
                    return (
                        <line key={i}
                            x1={a.x - x0 + dx / l * sh} y1={a.y - y0 + dy / l * sh}
                            x2={b.x - x0 - dx / l * sh} y2={b.y - y0 - dy / l * sh}
                            stroke="rgba(255,240,130,0.92)" strokeWidth={2.5} strokeDasharray="5 3"
                            markerEnd="url(#ta)"
                        />
                    );
                })}

                {Object.entries(diceMap).map(([k, stack]) => {
                    const [q, r] = k.split(",").map(Number);
                    const { x, y } = hp(q, r);
                    const cx = x - x0, cy = y - y0;
                    const dr = R * 0.43;
                    return stack.map((die, i) => {
                        const off = (stack.length - 1 - i) * R * 0.22;
                        return (
                            <g key={`${k}-${i}`} transform={`translate(${cx},${cy - off})`}>
                                <rect x={-dr} y={-dr} width={dr * 2} height={dr * 2} rx={3}
                                    fill={PC[die.owner] ?? "#666"}
                                    stroke="rgba(0,0,0,0.55)" strokeWidth={1}
                                />
                                <text x={0} y={0.5}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fill="white" fontSize={dr * 1.12} fontWeight="bold"
                                    fontFamily="sans-serif"
                                >
                                    {die.value}
                                </text>
                                {die.note && (() => {
                                    const bw = 52, bh = 22, by = dr + 8;
                                    return (
                                        <g>
                                            {/* bubble body */}
                                            <rect x={-bw / 2} y={by} width={bw} height={bh} rx={4}
                                                fill="rgba(30,20,8,0.92)" stroke="rgba(251,191,36,0.8)" strokeWidth={1}
                                            />
                                            {/* tail */}
                                            <polygon
                                                points={`-4,${by} 4,${by} 0,${by - 4}`}
                                                fill="rgba(30,20,8,0.92)" stroke="rgba(251,191,36,0.8)" strokeWidth={1}
                                            />
                                            <text x={0} y={by + bh / 2 + 0.5}
                                                textAnchor="middle" dominantBaseline="middle"
                                                fill="rgba(251,191,36,1)" fontSize={13} fontWeight="bold"
                                                fontFamily="sans-serif"
                                            >
                                                {die.note}
                                            </text>
                                        </g>
                                    );
                                })()}
                            </g>
                        );
                    });
                })}
            </svg>

            {choices && fi === 0 && (
                <div className="flex gap-3 shrink-0">
                    {choices.map(c => (
                        <button key={c.frame} onClick={() => setFi(c.frame)}
                            className="btn-frame px-5 py-2 text-sm font-semibold tracking-wide text-stone-300 cursor-pointer"
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            )}

            {choices && fi !== 0 && (
                <button onClick={() => setFi(0)}
                    className="btn-frame px-5 py-2 text-sm font-semibold tracking-wide text-stone-300 cursor-pointer shrink-0"
                >
                    ↺ Reset
                </button>
            )}

            {!choices && frames.length > 1 && (
                <button
                    onClick={() => setFi(f => (f + 1) % frames.length)}
                    className="btn-frame px-5 py-2 text-sm font-semibold tracking-wide text-stone-300 cursor-pointer shrink-0"
                >
                    {fi >= frames.length - 1 ? "↺ Reset" : "Další →"}
                </button>
            )}
        </div>
    );
}
