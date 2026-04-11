# Grafický plán — Donjon Fall

> Plán vizuálního redesignu všech komponent hry, řazený podle priority a logických celků.

---

## PRIORITA 1 — Herní jádro (hráč vidí 90 % času)

### A) Herní deska (Board + HexTile)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Hexagony** | CSS barvy + grass.png textura | Finální textury (tráva, kamení, písek?) pro různé typy polí |
| **Startovní pole** | startr-field-red/blue.png | Redesign — lepší vizuální odlišení |
| **Ohniskové body** | focus.png textura + SVG hvězda/kruh | Výraznější grafika — animace, glow efekt |
| **Pozadí mapy** | grass-dense.png | Okolí mapy — dekorativní rámeček, krajina |

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
| **Pie segmenty** | Semi-transparentní výseče | Šipky, vizuální směrování |

### G) Zvýraznění polí (highlights)

| Prvek | Současný stav | Potřeba |
|-------|---------------|---------|
| **Dosažitelná pole** | Zelená (#86efac) | Animovaný okraj, pulsování |
| **Trajektorie** | Cyan (#67e8f9) | Tečkovaná cesta, šipky |
| **Vybraná trajektorie** | — | Zvýrazněná vybraná cesta pohybu |
| **Nepřítel v dosahu** | Růžová (#fca5a5) | Varovný efekt |

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
| **Thumbnail mapy** | ⚠️ TEXT PLACEHOLDER „MAP PREVIEW" | SVG mini-náhled mapy nebo screenshot |
| **Karty** | Stone-800 box | Tematické karty s rámečkem |

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
