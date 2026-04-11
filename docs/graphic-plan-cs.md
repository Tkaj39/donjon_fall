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

> Kostky jsou vizuálně nejdůležitější herní jednotky — hráč s nimi interaguje každý tah.
> Dva vizuální režimy: **2D s 3D efektem** (výchozí, lehčí) a **plné 3D** (volitelné, náročnější).

#### B.1) Současný stav

| Prvek | Hodnota | Detail |
|-------|---------|--------|
| **Tvar** | SVG `<rect>` se zaoblenými rohy (`rx = 0.3 × half`) | Čtverec, strana = `hexSize × 0.55` (≈ 21 px) |
| **Barva těla** | `primary` z `PLAYER_PALETTE` | Červená `#dc2626`, modrá `#2563eb` |
| **Obrys** | `rgba(0,0,0,0.35)`, šířka 1 px | Jednotný pro všechny hráče |
| **Tečky (pips)** | Bílé SVG `<circle>`, opacity 0.9, r = `hexSize × 0.075` | Klasické rozmístění 1–6 |
| **Opacity non-top** | 0.55 | Ztlumené kostky pod vrcholem věže |
| **Stacking offset** | `hexSize × 0.22` per úroveň | Vertikální posun ve věži |
| **Vizuální stav „vybrané"** | ❗ Žádný — mění se jen barva hexu | Chybí odlišení kostky samotné |
| **Stín / 3D** | ❗ Žádný | Plochý vzhled |
| **Animace** | Žádná na kostce samotné | Pouze MovingDie (let mezi hexy, 260ms) |

#### B.2) Varianta 1 — 2D s 3D efektem (výchozí)

Lehký vizuální upgrade zachovávající SVG `<rect>` základ, vhodný pro nízký výkon i mobilní zařízení.

```
  ┌─────────────┐
  │ ╔═══════╗   │  ← vnější stín (drop shadow)
  │ ║ ● · ● ║   │  ← tělo kostky s gradientem
  │ ║ · ● · ║   │     (světlý → tmavý shora dolů)
  │ ║ ● · ● ║   │
  │ ╚═══════╝   │  ← spodní hrana (tmavší linka)
  └─────────────┘
```

| Prvek | Návrh | Detail |
|-------|-------|--------|
| **Tělo** | SVG `<rect>` + lineární gradient (shora světlejší → dole tmavší) | Simulace osvětlení shora |
| **Horní hrana** | Tenká světlá linka (1 px, bílá 20 %) | Odraz světla |
| **Spodní/pravá hrana** | Tmavší linka (1 px, černá 25 %) | Hloubka |
| **Drop shadow** | SVG `<filter>` — `feDropShadow`, dx=1, dy=2, blur=2 | Kostka „leží" na desce |
| **Tečky** | Vnitřní stín (inset efekt) — tmavší stín kolem pip | Reliéf / vydlabání |
| **Lesk** | Malý bílý kruhový gradient v levém horním rohu (opacity 0.15) | Plast/sklo efekt |
| **Vybraná kostka** | Zlatý obrys (2 px, `#f59e0b`) + jemná záře | ❗ Nový stav |
| **Hover** | Mírné zvětšení (`transform: scale(1.08)`) + zesvětlení | ❗ Nový stav |
| **Animace rerollu** | CSS `@keyframes` — rychlé přepínání pip layoutu (0.3s) | Vizuální „přehození" |
| **Tower stacking** | Gradient stínu na nižších kostkách — tmavší = níže | Lepší hloubka |

#### B.3) Varianta 2 — Plné 3D kostky

Izometrický vzhled se třemi viditelnými stranami. Náročnější na rendering, vhodné jako volitelné „premium" nastavení.

```
       ╱─────╲
      ╱  ● ●  ╲        ← horní strana (aktuální hodnota)
     ╱  ●   ●  ╲
    ╱─────────────╲
    │  ·       ·  │╲
    │  ·   ·   ·  │ ╲   ← pravá boční strana (dekorativní)
    │  ·       ·  │  │
    └─────────────┘  │
       ╲──────────╱  │  ← spodní hrana
        ╲─────────╱
```

| Prvek | Návrh | Detail |
|-------|-------|--------|
| **Horní strana** | SVG `<polygon>` — kosočtverec (izometrická projekce) | Zobrazuje aktuální hodnotu (pips) |
| **Levá strana** | SVG `<polygon>` — lichoběžník, tmavší odstín barvy hráče | Dekorativní — žádné pips nebo fixní vzor |
| **Pravá strana** | SVG `<polygon>` — lichoběžník, středně tmavý odstín | Dekorativní — žádné pips nebo fixní vzor |
| **Osvětlení** | Horní = 100 %, levá = 65 %, pravá = 80 % jasu | Konzistentní světlo shora-zleva |
| **Pips na horní straně** | Izometricky transformované pozice | Ovály místo kruhů (perspektiva) |
| **Stín pod kostkou** | SVG elipsa, rozmazaná, černá 15 % | Kostka „stojí" na hexu |
| **Vybraná kostka** | Záře kolem všech tří stran (outer glow, zlatá) | Konzistentní s 2D variantou |
| **Hover** | Mírný „nadzvednutí" efekt — posun nahoru o 2 px + větší stín | Jako by se vznášela |
| **Animace rerollu** | Rotace kolem vertikální osy (CSS 3D transform, 0.4s) | Kostka se „otočí" |
| **Tower stacking** | Izometrické vrstvení — každá kostka výš a mírně dozadu | Realistická věž |
| **Rozměry** | Celková výška ≈ `hexSize × 0.7`, šířka ≈ `hexSize × 0.55` | Větší než 2D kvůli bočním stranám |

#### B.4) Společné prvky (obě varianty)

| Prvek | Návrh | Detail |
|-------|-------|--------|
| **Barvy hráčů** | Zachovat `PLAYER_PALETTE.primary` | Červená, modrá (+ green, amber, purple, cyan pro budoucí hráče) |
| **Pip barva** | Bílá s jemným stínem | Konzistentní viditelnost na tmavém i světlém těle |
| **Non-top opacity** | Snížit z 0.55 → 0.45 + desaturace | Jasnější rozlišení top vs nižší |
| **Vybraná kostka** | ❗ NOVÝ STAV — zlatý obrys + záře | Aktuálně chybí |
| **Hover kostka** | ❗ NOVÝ STAV — zvětšení + zesvětlení | Aktuálně chybí |
| **Přepínání variant** | Nastavení → Styl grafiky → „2D" / „3D" | Hráč si vybere v menu |
| **Číslo jako fallback** | SVG `<text>` s číslem místo pip pro malé rozlišení / přístupnost | Volitelné v nastavení přístupnosti |

#### B.5) Co chybí / co zlepšit

| Problém | Popis | Návrh řešení |
|---------|-------|--------------|
| **Žádný stav „vybraná kostka"** | Hráč nevidí kterou kostku vybral — mění se jen hex | Zlatý obrys + záře na kostce |
| **Žádný hover efekt** | Najetí na kostku nemá vizuální odezvu | Scale + zesvětlení |
| **Plochý vzhled** | Žádný stín, gradient ani hloubka | Gradient + drop shadow (2D) nebo 3 strany (3D) |
| **Monotónní pips** | Bílé kruhy bez efektu | Reliéf / inset stín |
| **Reroll bez vizuálu** | Hodnota se změní „instantně" | Animace přehození / rotace |
| **Věž vypadá ploše** | Jen opacity rozlišuje úrovně | Stínový gradient + izometrické vrstvení |

### C) Akční panel (ActionPanel)

> Panel se 4 akčními tlačítky ve spodní části obrazovky. Viditelný jen když hráč vybere hex s vlastní kostkou.

#### C.1) Současný stav

| Prvek | Hodnota | Detail |
|-------|---------|--------|
| **Layout** | Horizontální `flex gap-2` | Dole-střed, uvnitř `pb-4 px-4` |
| **Kontejner** | `bg-[#1e293b]`, border `#475569`, `rounded-xl` | Temná karta s jemným okrajem |
| **Stín** | `0 4px 16px rgba(0,0,0,0.4)` | Mírný drop shadow |
| **Viditelnost** | `visibility: hidden/visible` | Zůstává v layoutu i když skrytý |
| **Podmínka zobrazení** | `phase === "action"` + vybraný hex + akce neprovedena | — |

#### C.2) Tlačítka akcí

| Akce | Label | Viditelnost |
|------|-------|-------------|
| **Move tower** | `"Move tower"` | Jen když je vybraný hex věž s dosažitelnými poli |
| **Move die** | `"Move die"` | Když kostka má dosažitelná pole |
| **Reroll** | `"Reroll"` | Vždy |
| **Collapse** | `"Collapse"` | Jen věž 3+ kostek s vlastní nahoře |

**Stavy tlačítek:**

| Stav | Border | Pozadí | Barva textu | Font |
|------|--------|--------|-------------|------|
| **Aktivní** | `2px solid #f59e0b` | `rgba(245,158,11,0.18)` | `#f59e0b` (amber) | 700 |
| **Dostupné** | `2px solid transparent` | `rgba(255,255,255,0.08)` | `#f1f5f9` (světlá) | 500 |
| **Zakázané** | `2px solid transparent` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.25)` | 500 |

Přechody: `background 0.12s, border-color 0.12s, color 0.12s`.

#### C.3) Grafický návrh

| Prvek | Návrh | Detail |
|-------|-------|--------|
| **Kontejner** | Tematický rámeček — dřevěná/kamenná deska | Místo generického slate panelu |
| **Tlačítka** | Ikona + text (meč pro tah, šipky pro přesun, kostka pro reroll, zřícení pro kolaps) | Aktuálně jen text |
| **Hover efekt** | Zesvětlení + jemný scale(1.05) | Aktuálně žádný hover |
| **Aktivní stav** | Tematický glow / zapuštění (pressed efekt) | Výraznější než jen amber border |
| **Zakázaný stav** | Šedivé + přeškrtnutí nebo zámek ikona | Jasné „nelze použít" |
| **Animace výběru** | Krátký pulse/bounce při kliknutí (0.15s) | Aktuálně žádná |
| **Popisky** | Tooltip při hoveru s vysvětlením akce | Aktuálně žádné |
| **Klávesové zkratky** | Vizuální indikace zkratky na tlačítku (1–4) | Pro budoucí klávesové ovládání |

### D) Skóre a hráčské štíty (PlayerShield)

> Dva štíty po stranách desky — erb, jméno, VP skóre, indikátor aktivního hráče.

#### D.1) Současný stav

| Prvek | Hodnota | Detail |
|-------|---------|--------|
| **Rozměr štítu** | `w-28 h-28` (112×112 px) | Kontejner pro shield + animal |
| **Shield obrázek** | `shield-[color].png` (6 barev) | Vrstva 1 — pozadí |
| **Animal obrázek** | `animal-[type].png` (6 zvířat: bear, deer, horse, pig, rooster, wolf) | Vrstva 2 — overlay s `p-1` |
| **Jméno** | `text-xs font-semibold`, `max-w-28 truncate` | Fallback na player ID |
| **VP badge (aktivní)** | `bg-amber-400 text-stone-900` | Kroužek pod štítem |
| **VP badge (neaktivní)** | `bg-stone-700 text-stone-200` | Šedý kroužek |
| **Badge pozice** | `absolute -bottom-1 left-1/2 -translate-x-1/2` | Centrovaný pod štítem |
| **Layout** | `flex flex-col items-center gap-1 shrink-0` | Vertikální: štít → jméno |

#### D.2) Grafický návrh

| Prvek | Návrh | Detail |
|-------|-------|--------|
| **Shield kvalita** | Finální artworky – konzistentní styl (heraldický, ručně malovaný?) | 6 barev: red, blue, green, amber, purple, cyan |
| **Animal kvalita** | Sjednotit styl — všechna zvířata ve stejné technice | Aktuálně různé styly/kvality |
| **Větší jméno** | `text-sm` nebo `text-base`, lepší font | `text-xs` je příliš malé |
| **VP badge redesign** | Heraldický medailon / štítek místo kroužku | Zlato pro aktivního, stříbro/bronz pro neaktivního |
| **Aktivní hráč** | Animovaný okraj kolem celého štítu (glow, pulsování) | Jen badge nestačí |
| **Score-pop animace** | Zachovat `scale 1→1.55→1` + přidat barvu/záři | Existuje `@keyframes score-pop` |
| **Hover na štít** | Jemné zvětšení + tooltip s detaily hráče | Aktuálně žádná interakce |
| **Přechod tahů** | Plynulá animace změny badge barvy (0.3s) | Aktuálně instantní přepnutí |
| **Zničené kostky** | Indikátor kolik kostek hráč ztratil (mini kostky / číslo) | ❗ Chybí zcela |
| **Počet kostek na mapě** | Mini přehled „3/5 kostek" pod VP | ❗ Chybí zcela |

### E) Boj (CombatOverlay)

> Modální dialog nad herní deskou zobrazující síly útočníka a obránce s volbou Push/Occupy.

#### E.1) Současný stav

| Prvek | Hodnota | Detail |
|-------|---------|--------|
| **Pozice** | `absolute top-1/2 left-1/2 -translate-x/y-1/2` | Centrovaný nad deskou |
| **Z-index** | `z-[100]` | Nad vším kromě celoobrazovkových modálů |
| **Kontejner** | `bg-[#1e293b]`, border `#475569`, `rounded-xl` | Stejný styl jako ActionPanel |
| **Rozměr** | `min-w-56` (224 px), `py-5 px-6` | Kompaktní karta |
| **Stín** | `0 8px 32px rgba(0,0,0,0.5)` | Výrazný drop shadow |
| **Nadpis** | `"Combat"`, `1.1rem bold` | Jednoduchý text |
| **Síla útočníka** | `text-2xl font-bold` | Číslo + label „Attacker" |
| **Síla obránce** | `text-2xl font-bold` | Číslo + label „Defender" |
| **Separator** | `"vs"`, `opacity-50` | Mezi sloupci |
| **Tlačítka** | Push / Occupy (jen dostupné se zobrazí) | `bg-[#334155]`, border `#475569` |
| **Animace** | Žádná na overlayi | Jen combat-flash na hexech za ním |

#### E.2) Grafický návrh

```
┌─────────────────────────────┐
│         ⚔ COMBAT ⚔         │
│                             │
│    ⚔ ATTACKER   🛡 DEFENDER │
│       ┌───┐        ┌───┐   │
│       │ 5 │  vs.   │ 3 │   │
│       └───┘        └───┘   │
│     [die icon]  [die icon]  │
│                             │
│   [ 🗡 Push ]  [ 🏰 Occupy ] │
└─────────────────────────────┘
```

| Prvek | Návrh | Detail |
|-------|-------|--------|
| **Rámec** | Tematický — pergamen, kamenná tabule, nebo dřevěný rám | Místo generického slate |
| **Nadpis** | Ikona mečů ⚔ + dekorativní font | Dramatičtější |
| **Síla — vizualizace** | Mini kostka s hodnotou místo jen čísla | Barevná kostka útočníka/obránce |
| **Síla — breakdown** | Rozložení: „top die (4) + own (2) − enemy (1) = 5" | Hráč vidí jak se síla počítá |
| **VS separator** | Ikona zkřížených mečů místo textu „vs" | Grafické oddělení |
| **Push tlačítko** | Ikona šipky/úderu + text + tooltip | Vysvětlení co se stane |
| **Occupy tlačítko** | Ikona věže/hradby + text + tooltip | Vysvětlení co se stane |
| **Hover tlačítek** | Zesvětlení + preview efektu na desce | Hráč vidí dopad akce |
| **Vstupní animace** | Slide-in + fade (0.2s ease-out) | Aktuálně se objeví instantně |
| **Výstupní animace** | Fade-out (0.15s) | Po volbě zmizí plynule |
| **Zvukový efekt** | Zvuk tříštění/úderu při otevření | Pro budoucí audio |
| **Info panel** | Co se stane po Push vs Occupy — krátký tooltip | Nováčci nemusí vědět rozdíl |

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
