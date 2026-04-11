# Grafický plán — Donjon Fall

> Plán vizuálního redesignu všech komponent hry, řazený podle priority a logických celků.

---

## PRIORITA 1 — Herní jádro (hráč vidí 90 % času)

#### Rozložení herní obrazovky

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]              Záře hrany (barva hráče)            [?] │
│────────────────────────────────────────────────────────────│
│           Indikátor fáze tahu                             │
│────────────────────────────────────────────────────────────│
│                                                            │
│  ┌────────┐                              ┌────────┐        │
│  │ ŠTÍT   │     ┌────────────────┐    │ ŠTÍT   │        │
│  │ Červený│     │                │    │ Modrý  │  ┌───┐ │
│  │ [erb]  │     │   HERNÍ DESKA  │    │ [erb]  │  │Atk│ │
│  │ Jméno  │     │  (61 hexů)    │    │ Jméno  │  │   │ │
│  │ VP: 3  │     │                │    │ VP: 1  │  └───┘ │
│  └────────┘     │                │    └────────┘        │
│                └────────────────┘                       │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [Přesun věže] [Přesun kostky] [Reroll] [Kolaps]  │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Vrstvy (Z-index):**
1. Záře hrany hráče (za vším, barva červená/modrá)
2. Herní deska + hexy + kostky
3. Zvýraznění polí, animace pohybu, combat flash
4. Modály na desce: CombatOverlay, DirectionPicker, CombatPowerTooltip
5. Celoobrazokové modály: VictoryScreen, RulesViewer

### A) Herní deska (Board + HexTile)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Hexagony** | CSS barvy + grass.png textura | Finální textury (tráva, kamení, písek?) pro různé typy polí |
| **Startovní pole** | startr-field-red/blue.png | Redesign — lepší vizuální odlišení |
| **Ohniskové body** | focus.png textura + SVG hvězda/kruh | Výraznější grafika — animace, glow efekt |
| **Pozadí mapy** | grass-dense.png | Okolí mapy — dekorativní rámeček, krajina |

### A.1) Záhlaví herní obrazovky

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Logo** | w-64 vlevo | Zachovat, možná zmenšit |
| **Tlačítko pravidel [?]** | 8×8 px vpravo | Tematická ikona (svitek, kniha?) |
| **Indikátor fáze tahu** | Pouze v debug módu | ❗ Chybí — musí být viditelný vždy |
| **Indikátor aktivního hráče** | Záře hrany (gradient, 200px) | Dopracovat — jasnější signalizace |

### A.2) Záře hrany hráče (PlayerGlow)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Pozice** | Fixed top/bottom podle hráče | OK |
| **Barva** | Gradient červená/modrá | Tematický gradient — oheň/led? |
| **Opacity** | 0.55 | Možná zeslabit na jemnější |
| **Přechod** | 0.5s | Plynulejší animace |

### A.3) Bokové panely (PlayerShield × 2)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Štít** | w-28 h-28, shield + animal PNG | Finální kvalita, konzistentní styl |
| **Jméno hráče** | text-xs, truncate | Větší font, lepší čitelnost |
| **VP badge** | Barevný kroužek (amber/stone) | Heraldický štítek, medailony |
| **Aktivní hráč** | bg-amber-400 badge | Výraznější — záře, animace, rámeček |

### A.4) CombatPowerTooltip (pravý panel)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **SVG hex** | 72×83 px, číslo \u00fatoku | Tematický rámec, ikony mečů/štítů |
| **Barvy** | Barva hráče | Konzistentní s ostatními prvky |
| **Formát** | „A × D“ při hoveru nad nepřítelem | Jasnější vizualizace síly |

### B) Kostky (Die)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Tělo kostky** | SVG obdélník s barvou hráče | 3D vzhled, stín, lesk, textura dřeva/kovu? |
| **Tečky (pips)** | Bílé SVG kruhy | Styl odpovídající tématu (reliéf, gravírování?) |
| **Stacking ve věži** | Dimmed opacity 0.55 | Lepší vizuální vrstvení, 3D efekt věže |

### C) Akční panel (ActionPanel)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Tlačítka akcí** | Tailwind slate barvy | Ikony + text, rámování odpovídající tématu |
| **Aktivní stav** | Amber border | Výraznější vizuální feedback |

### D) Skóre a hráčské štíty (ScoreBoard + PlayerShield)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Štíty** | 6× shield-[color].png | Finální kvalita, konzistentní styl |
| **Zvířata** | 6× animal-[type].png | Finální kvalita, sjednotit styl |
| **VP badge** | Barevný kroužek s číslem | Heraldický štítek, medailony |

---

## PRIORITA 2 — Boj a interakce

### E) Boj (CombatOverlay + CombatPowerTooltip)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Overlay** | Slate-800 box | Tematický rámec (pergamen? kamenná tabule?) |
| **Síla** | Čísla v hexu | Ikonografie — meče, štíty, efekty |
| **Push/Occupy tlačítka** | Textová tlačítka | Ikony s popisem |
| **Combat flash** | CSS pulsing opacity | Výraznější efekt — exploze, jiskry |

### F) Směr útoku (DirectionPickerOverlay)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Pie segmenty** | SVG výseče 60°, radius 0.85 × hexSize | Šipky, vizuální směrování |
| **Dostupný segment** | Fill `rgba(251,191,36,0.18)`, stroke `rgba(251,191,36,0.75)` | Výraznější — ikona/šipka v segmentu |
| **Vybraný (hover)** | Fill `rgba(251,191,36,0.65)` | Animace zvětšení nebo záře |
| **Interakce** | Průhledný polygon zachytává `mousemove` | Dotyk: tap místo hover |
| **Spouštěč** | Nepřátelský cíl s >1 směrem přístupu | — |

### G) Zvýraznění polí (highlights)

> Herní deska využívá 17 vizuálních stavů pro jednotlivá pole.
> Zvýraznění vždy přebíjí texturu — při aktivním highlightu zmizí grass/focus PNG.

#### G.1) Barevné výplně polí

| Stav pole | CSS proměnná | Barva | Spouštěč |
|-----------|-------------|-------|----------|
| **Výchozí** | `--color-hex-default` | `#e8e677` (žlutá) | Žádný speciální stav |
| **Startovní pole** | `--color-hex-starting` | Tint hráče (červená `#fca5a5` / modrá `#93c5fd`) | Vlastnost `startingField` v definici mapy |
| **Ohniskový bod** | `--color-hex-focal` | `#c4b5fd` (světle fialová) | Vlastnost `focalPoint` v definici mapy |
| **Vybrané** | `--color-hex-selected` | `#f59e0b` (amber) | Klik na vlastní kostku |
| **Dosažitelné** | `--color-hex-reachable` | `#86efac` (zelená) | Kostka vybrána + pole v dosahu (prázdné/vlastní) |
| **Trajektorie** | `--color-hex-trajectory` | `#67e8f9` (cyan) | Hráč plánuje cestu pohybu |
| **Nepřítel v dosahu** | `--color-hex-enemy-reachable` | `#fca5a5` (růžová) | Kostka vybrána + nepřátelské pole v dosahu |
| **Highlighted** | `--color-hex-highlighted` | `#34d399` (smaragdová) | Alias pro „selected" highlight |

**Priorita** (poslední vítězí): výchozí → startovní → ohniskový → highlight → vybrané.

**Přebíjení textur**: Pokud existuje textura (`grass.png`, `focus.png`, `starter-field-*.png`) A NENÍ aktivní žádný highlight/výběr → polygon je průhledný a textura se zobrazí přes `<image>` s clip-path. Jakýkoliv highlight texturu přebije.

#### G.2) Bojový záblesk (Combat Flash)

| Cíl | Barva | Zpoždění | Spouštěč |
|-----|-------|----------|----------|
| **Hex útočníka** | `rgba(239,68,68,0.4)` (červená) | 0s | `phase === "combat"` |
| **Hex obránce** | `rgba(251,191,36,0.35)` (amber) | 0.4s | `phase === "combat"` |

**Animace** (`@keyframes combat-flash`): opacity pulsuje 0.2 → 0.65, trvání 0.8s, ease-in-out, nekonečná smyčka. SVG `<polygon>` s `pointerEvents: "none"`.

#### G.3) Aktivní ohniskový bod — překryv

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Hex překryv** | Fill `#fbbf24` (gold), opacity 0.25 | Animovaná záře, pulsování |
| **Hvězda (aktivní)** | 5-cípá SVG hvězda, R=0.28×hex, r=0.12×hex, gold fill, amber stroke | Rotace? Záře? Jiskření? |
| **Kruh (pasivní)** | SVG kruh, r=0.18×hex, fialový fill `#7c3aed` | Jemnější indikace, možná čárkovaný okraj |

#### G.4) Animace pohybu kostky (MovingDie)

| Vlastnost | Současný stav | Potřeba |
|-----------|---------------|---------|
| **Trvání** | 260ms (`MOVE_ANIMATION_MS`) | OK — rychlé a plynulé |
| **Easing** | Cubic ease-in-out (custom) | OK |
| **Vizuál** | Celý stack kostek letí ze zdroje do cíle | Stín pod letící kostkou? Stopa? |
| **Zdrojový hex** | Stack potlačen (prázdný) během animace | OK |

#### G.5) Kurzor a interakce

| Stav | Kurzor | Spouštěč |
|------|--------|----------|
| **Klikatelný hex** | `pointer` | Hex je v `clickableHexes` |
| **Neklikatelný hex** | `default` | Žádný `onClick` handler |
| **Hover nad hexem** | Žádná vizuální změna na polygonu | ❗ Chybí — přidat jemný hover efekt |

#### G.6) Co chybí / co zlepšit

| Problém | Popis | Návrh řešení |
|---------|-------|--------------|
| **Highlight přebíjí texturu** | Při zvýraznění zmizí grass/focus textura → pole vypadá „ploše" | Tinted overlay místo nahrazení výplně — textura prosvítá |
| **Chybí hover efekt** | Najetí myší na hex nemá žádnou vizuální odezvu | Jemný okrajový glow nebo zesvětlení |
| **Chybí vybraná trajektorie** | Hráč nevidí zvlášť zvýrazněnou vybranou cestu | Tečkovaná čára / šipky po cestě |
| **Pulsování dosažitelných polí** | Statická zelená výplň | Animovaný border nebo jemné pulsování opacity |
| **Varovný efekt na nepříteli** | Statická růžová výplň | Blikající border, ikona meče / hrozby |
| **Combat flash příliš jemný** | Pouze opacity pulsování | Částicový efekt, jiskry, vlna |
| **Score pop** | `@keyframes score-pop` scale 1→1.55→1 | OK, možná přidat záři/barvu |

---

## PRIORITA 3 — Menu flow (první a poslední dojem)

### H) Úvodní obrazovky (SplashScreen + MainMenu)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Pozadí** | `bg-stone-900/60` (poloprůhledná šedá) | Ilustrace / atmospheric artwork |
| **Logo** | logo-donjon-fall.png | ✅ Hotovo |
| **Tlačítka** | Tailwind bg-red-700 / stone-700 | Tematická tlačítka (kámen, dřevo, reliéf) |
| **Spinner** | CSS kroužek s border-spin | Tematický loading (padající kostky? erb?) |

#### Rozložení hlavní obrazovky

```
┌────────────────────────────────────────────────────────────┐
│  MENU (boční panel)  │       PLÁTNO (hlavní plocha)           │
│─────────────────────│                                      │
│  [Profil hráče]      │  Rotující obsah:                      │
│  [Logo]             │  • Grafický tutoriál / příběh hry    │
│                     │  • Záznam ukázkové hry (replay)      │
│  Start         ▶    │  • Atmosférická ilustrace / artwork   │
│  Pokračovat         │  • Novinky / changelog               │
│  Tutoriál           │                                      │
│  Pravidla           │  (fade/slide animace, ~8s interval)  │
│  Statistiky         │  nebo reaguje na hover položky menu │
│  Žebříček           │                                      │
│  Úspěchy            │                                      │
│  Nastavení     ▶    │                                      │
│  Vytvořit mapu      │                                      │
│  Autoři             │                                      │
│  Ukončit            │                                      │
│─────────────────────│                                      │
│  v0.9.1  [💬] [🐙]  │                                      │
└─────────────────────┴──────────────────────────────────────┘
```

**Plátno (hlavní plocha)** střídá obsah:
- **Grafický tutoriál** — animované snímky vysvětlující základy hry (pohyb, boj, věže…)
- **Záznam ukázkové hry** — přehrávání reálné partie (replay demo), aby hráč viděl jak hra vypadá
- **Atmosférický artwork** — ilustrace světa hry, koncepty
- **Novinky** — changelog, komunitní informace

#### Struktura hlavního menu

```
Hlavní menu
├── Start
│   ├── Quick Start        — rychlý start s výchozím nastavením
│   ├── Start vs Bot       — hra proti AI
│   ├── Start              — klasický start (výběr mapy → hráči)
│   ├── Online             — hra přes síť (multiplayer)
│   ├── Denní výzva        — speciální denní scénář se specifickými podmínkami
│   └── Kampaň             — příběhový režim
├── Pokračovat             — obnovení rozehrané hry (viditelné jen pokud existuje)
├── Tutoriál               — interaktivní výuka pravidel
├── Pravidla                — přehled pravidel (RulesViewer)
├── Statistiky              — odehrané hry, výhry/prohry, skóre
├── Žebříček (Leaderboard)  — online ranking hráčů
├── Úspěchy (Achievements)  — odemykatelné trofeje za splněné výzvy
├── Nastavení (Settings)
│   ├── Zvuk               — hlasitost, zapnutí/vypnutí zvukových efektů
│   ├── Složitost grafiky   — nízká / střední / vysoká (animace, efekty, textury)
│   ├── Styl grafiky       — výběr vizuálního tématu (default, retro, minimalist…)
│   ├── Jazyk              — přepínač CS / EN
│   ├── Ovládání           — klávesové zkratky, myš/touch
│   ├── Zobrazení          — fullscreen, rozlišení
│   └── Přístupnost        — barvoslepost, velikost textu
├── Vytvořit mapu           — editor vlastních map
├── Autoři                  — credits, informace o tvůrcích
└── Ukončit                 — zavřít hru
```

**Patička menu panelu:**
- **Číslo verze** — malý text (např. „v0.9.1“)
- **Sociální odkazy** — ikonky Discord / GitHub
- **Upozornění po aktualizaci** — popup „Co je nového“ při prvním spuštění po updatu
- **Profil hráče** — widget v horní části panelu (jméno, avatar, úroveň)

### I) Nastavení hráčů (PlayerSetup)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Form layout** | Stone panel | Pergamenový / heraldický rámec |
| **Výběr erbu** | Grid 6 dlaždic | Větší náhled, animace výběru |

### J) Výběr mapy (MapSelection)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Thumbnail mapy** | ⚠️ TEXT PLACEHOLDER „MAP PREVIEW“ | Náhled mapy (JPG/PNG) |
| **Karty** | Stone-800 box | Tematické karty s rámečkem |

#### Rozložení obrazovky výběru mapy

```
┌────────────────────────────────────────────────────────────┐
│  SEZNAM MAP (levý panel)  │     DETAIL MAPY (pravá plocha)      │
│──────────────────────────│                                    │
│  [← Zpět]                 │  Náhled mapy (JPG)                 │
│                          │  ┌──────────────────────────────┐ │
│  ┌──────────────────────┐ │  │                              │ │
│  │ [thumb] Classic     │ │  │      (obrázek mapy)          │ │
│  │ 2 hráči • 5 VP     │ │  │                              │ │
│  └──────────────────────┘ │  └──────────────────────────────┘ │
│  ┌──────────────────────┐ │                                    │
│  │ [thumb] Fortress   │ │  Název: Classic                    │
│  │ 2 hráči • 7 VP     │ │  Hráči: 2 (nastavení níže)         │
│  └──────────────────────┘ │  Vítězství: První na 5 VP            │
│  ┌──────────────────────┐ │  Polí: 61 hexů                       │
│  │ [thumb] Další...   │ │                                    │
│  │ 3 hráči • 5 VP     │ │  Nastavení hráčů:                   │
│  └──────────────────────┘ │  ┌──────────────────────────────┐ │
│                          │  │ 🔴 Hráč 1  [Hráč ▼] [erb]   │ │
│                          │  │ 🔵 Hráč 2  [AI   ▼] [erb]   │ │
│                          │  └──────────────────────────────┘ │
│                          │                                    │
│                          │         [ HRÁT ]                    │
└──────────────────────────┴────────────────────────────────────┘
```

#### Karta mapy (MapCard)

Každá karta v seznamu zobrazuje:
- **Mini náhled** — malý JPG/PNG obrázek mapy
- **Název mapy** — např. „Classic“, „Fortress“
- **Počet hráčů** — „2 hráči“
- **VP k víhře** — „5 VP“
- **Obtížnost** — hvězdičky nebo štítek (easy / medium / hard)
- **Štítky** — např. „balanced“, „asymmetric“, „large“, „custom“

#### Detail mapy (pravá plocha)

Po kliknutí na kartu se vpravo zobrazí:
- **Velký náhled mapy** — JPG/PNG obrázek celé mapy
- **Název** — velký nadpis
- **Popis mapy** — krátký text (téma, strategie, tip — např. „Symetrická klasika pro začátečníky“)
- **Obtížnost** — hvězdičky nebo štítek
- **Počet hráčů** — informace
- **Podmínky víhře** — např. „První na 5 VP“
- **Velikost** — počet hexů
- **Počet ohniskových bodů** — např. „3 focal“
- **Štítky / kategorie** — „balanced“, „asymmetric“, „large“, „custom“
- **Nastavení hráčů** — pro každý slot:
  - Barva hráče (🔴/🔵)
  - Přepínač **Hráč / AI** (dropdown)
  - Výběr **znaku na erbu** (ikona erbu)
- **Tlačítko HRÁT** — spustí hru s vybraným nastavením

#### Seznam map — doplňky

- **Filtr / řazení** — filtr podle počtu hráčů, velikosti, obtížnosti; řazení A–Z
- **Oficiální vs vlastní** — oddělení vestavěných a uživatelských map (záložky nebo sekce)

### K) Loading + Victory

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **GameLoading** | Minimalistický | Animace přípravy, dramatický nástup |
| **VictoryScreen** | SVG koruna + barva hráče | Slavnostní efekty — konfety, záře, fanfáry |

---

## PRIORITA 4 — Doplňkové

### L) Pravidla (RulesViewer)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Modal** | Dark panel, collapsible sekce | Ilustrace pravidel, diagramy |

### M) Favicon

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **favicon.png** | Existuje | Ověřit kvalitu, multi-size ICO? |

---

## Shrnutí priorit

| Priorita | Celky | Dopad |
|----------|-------|-------|
| **P1** | Deska, Kostky, Panel, Štíty | Jádro hry — hráč to vidí neustále |
| **P2** | Boj, Směr, Zvýraznění | Klíčové interakce — musí být čitelné |
| **P3** | Menu, Setup, Loading, Victory | První/poslední dojem — „wow efekt" |
| **P4** | Pravidla, Favicon | Nice-to-have |
