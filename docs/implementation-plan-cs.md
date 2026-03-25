# Donjon Fall — Implementační plán


## Přehled

Hra pro více hráčů (N hráčů, N ≥ 2) na hexagonální mřížce postavená jako React webová aplikace. Výchozí konfigurace je pro dva hráče, ale veškerá herní logika je navržena pro N hráčů. Fáze 1–16 běží zcela na straně klienta (hot-seat místní hra). Fáze 17 zavádí backend pro online hraní přes internet.

---

## Fáze 1: Základ hexagonální mřížky

### 1.1 Souřadnicový systém hexů
- Používat cubické souřadnice (q, r, s) výhradně v celém kódu. Offsetové souřadnice nejsou používány.
- Utility: `cubeDistance`
- Utility: `getNeighbors(hex)` — vrátí 6 sousedních hexů
- Utility: `hexesInRange(hex, range)` — vrátí všechny hexy do N kroků
- Utility: `getPath(from, to)` — vrátí seřazený seznam hexů na přímé linii
- Utility: `isOnBoard(hex)` — ověří, zda hex patří do 61-polního velkého hexagonu

### 1.2 Vlastnosti polí
Pole jsou plain objekty s volitelným seznamem `properties`. Dva vestavěné typy vlastností:

```
HexField {
  coords: { q, r, s }
  properties: HexProperty[]
}

HexProperty =
  | { type: 'startingField', owner: string }
  | { type: 'focalPoint', active: boolean, group: string }
```

- **`startingField`** — označuje pole jako základnu hráče; `owner` je ID hráče (řetězec, např. `'red'`, `'blue'` nebo jakýkoliv budoucí ID hráče). Jedna základna na hráče.
- **`focalPoint`** — označuje pole jako ohnisko; `active` je jeho počáteční stav (true = aktivní na začátku hry, false = pasivní); `group` je řetězcový identifikátor (např. `'left'`, `'center'`, `'right'`) — každá grupa představuje jednu logickou pozici ohniska, která se může pohybovat mezi poli se stejným `group`. Definice plochy plně řídí počet ohnisek, jejich grupy a které začínají aktivní.

Pomocné funkce:
- `getProperty(field, type)` — vrátí objekt vlastnosti nebo null
- `hasProperty(field, type)` — boolean

### 1.3 Definice tvaru hrací plochy
- Definovat 61-polní velký hexagon jako množinu platných cubických souřadnic
- Střed mapy na (0,0,0); poloměr 4 (standardní hex mřížka: 1+6+12+18+24 = 61 polí)
- Přiřadit vlastnost `startingField` každé základně hráče; `owner` = ID hráče (výchozí mapa: `'red'` horní řada, `'blue'` dolní řada)
- Přiřadit vlastnost `focalPoint` 3 polím prostřední řady (grupy: `'left'`, `'center'`, `'right'`); střed začíná jako `active: true`, levé a pravé jako `active: false`
- Exportovat konstanty: `BOARD_HEXES`, `BASE_HEXES` (mapa `{ [playerId]: HexField[] }`), `FOCAL_POINT_HEXES`, `ACTIVE_FOCAL_HEXES`, `PASSIVE_FOCAL_HEXES`

### 1.5 Komponenta pro vykreslení hexu
- `<HexTile hex coords, content, state, onClick>` — vykreslí jeden SVG hexagon
- Props: `hex`, `isHighlighted`, `isFocalPoint`, `isSelected`, `onClick`
- Orientace flat-top nebo pointy-top (vybrat jednu, držet konzistentně — doporučena pointy-top)
- Převod na pixely: `hexToPixel(hex, size)` pro SVG pozicování

### 1.6 Komponenta herní plochy
- `<Board>` — vykreslí všech 61 komponent `<HexTile>` uvnitř SVG
- Deleguje kliknutí na úrovni plochy
- Statické vykreslení bez herního stavu — pouze prázdná plocha se značkami fokálních bodů

---

## Fáze 2: Model herního stavu

### 2.1 Datové struktury
Definovat kanonický tvar herního stavu jako plain JS objekty (bez tříd):

```
GameState {
  players: string[]           // seřazený seznam ID hráčů, např. ['red', 'blue']
  currentPlayer: string       // ID hráče aktivního hráče
  phase: 'focal' | 'action' | 'combat' | 'victory'
  dice: {
    [hexKey]: Die[]          // hexKey = "q,r,s"
  }
  focalPoints: {
    [hexKey]: FocalPointState
  }
  scores: { [playerId]: number }
  activeFocalHolders: { [playerId]: hexKey|null }
    // sleduje, na kterém hexu měl každý hráč kostku na fokálním bodu na konci předchozího tahu
  combat: CombatState | null
  selectedHex: hexKey | null
  highlightedHexes: hexKey[]
  actionTaken: boolean
}

Die {
  owner: string        // ID hráče
  value: 1..6
}

FocalPointState {
  isActive: boolean
  group: string        // zkopírováno z definice plochy; používá se k nalezení sesterských polí ve stejné grupě
}

CombatState {
  attackerHex: hexKey
  defenderHex: hexKey
  options: ('push' | 'occupy')[]
}
```

### 2.2 Odvozené selektory
Čisté funkce počítající odvozená data ze stavu:
- `getDiceAt(state, hex)` — pole kostek na hexu
- `getTopDie(state, hex)` — vrchní kostka
- `getController(state, hex)` — ID hráče | null (hráč, jehož kostka je nahoře)
- `getTowerSize(state, hex)` — počet kostek
- `getAttackStrength(state, attackerHex)` — hodnota vrchní kostky + počet vlastních − počet nepřátel
- `canEnterTower(state, moverDie, targetHex)` — ověří, zda útočná síla pohybující se kostky překračuje útočnou sílu vrchní kostky
- `isFocalPointActive(state, hex)` — boolean
- `getActiveFocalPoints(state)` — seznam hexů aktivních fokálních bodů

### 2.3 Továrna počátečního stavu
- `createInitialState(players, boardFields)` — bere seřazený seznam ID hráčů a definice polí plochy; umístí 5 kostek na příslušné základní řady každého hráče (přesné startovní pozice TBD), inicializuje fokální body ze `boardFields` (aktivní/pasivní podle definice v ploše), všechna skóre na 0

---

## Fáze 3: Logika pohybu

### 3.1 Validace cesty pro pohyb kostky
- `getReachableHexes(state, fromHex)` — BFS/DFS až do hodnoty kostky kroků
  - Nelze procházet přes nepřátelské kostky
  - Lze procházet přes vlastní kostky pouze pokud má pohybující se kostka vyšší útočnou sílu než vrchní kostka na daném poli
  - Vrátí množinu dosažitelných cílových hexů (ne mezilehlé cesty)
- `getPathsToHex(state, fromHex, toHex)` — vrátí platné cesty (potřebné pro směr odsunu)
- `getApproachDirections(state, fromHex, toHex)` — vrátí množinu rozlišných směrů, ze kterých se útočník může na `toHex` dostat (tj. unikátní poslední sousední hexes), odvozené ze všech platných cest; relevantní pouze pokud je cílové pole obsazeno nepřítelem

### 3.2 Akce pohybu kostky
- `applyMoveAction(state, fromHex, toHex)` — vrátí nový stav
  - Přesune kostku ze zdroje do cíle
  - Pokud je cíl obsazen vlastní kostkou: přidá do věže (pokud `canEnterTower`)
  - Pokud je cíl obsazen nepřítelem: nastaví fázi na 'combat', zaznamená `CombatState`
  - Pokud je dostupnější více než jeden směr příchodu, počkaj na potvrzení směru hráčem před potvrzením (viz oddíl 12.4); `CombatState` zahrnuje `approachDirection`

### 3.3 Skok z věže
- `getJumpRange(state, towerHex)` — vlastní kostky − nepřátelské kostky (min 1)
- `getJumpReachableHexes(state, towerHex)` — hexy dosažitelné skákající kostkou
- `applyJumpAction(state, towerHex, targetHex)` — vrátí nový stav (oddělí vrchní kostku, přesune ji)
- **Útočná síla při skoku** používá pouze hodnotu kostky skákajícího hráče — bez bonusu věže. To se liší od normálního pohybu, který skončí na nepříteli (kde útočná síla = hodnota vrchní kostky + počet vlastních − počet nepřátel). `getAttackStrength` musí obdržet kontext, který uvádí, zda se útočník skákal.

### 3.4 Akce pohybu celé věže
- `getTowerMoveRange(state, towerHex)` — vlastní kostky − nepřátelské kostky (min 1)
- `getTowerReachableHexes(state, towerHex)` — platné cílové hexy pro celou věž
- `applyMoveTowerAction(state, fromHex, toHex)` — vrátí nový stav
  - Pokud má cíl nepřítele: souboj pouze s odsunem

### 3.5 Akce zřícení věže
- `canCollapse(state, hex)` — věž má 3+ kostky A aktuální hráč je nahoře
- `applyCollapseAction(state, hex)` — odstraní spodní kostku, přidá bod pokud šlo o nepřítele

### 3.6 Akce přehození kostky
- `applyRerollAction(state, hex, newValue)` — přehodí vrchní kostku, zachová původní hodnotu pokud je nová nižší
  - Přijme `newValue` jako parametr pro čistotu/testovatelnost; UI předá skutečný náhodný hod

---
## Fáze 4: UI základ (Fáze 1–3)

Prezentační React komponenty vázané na logiku implementovanou ve fázích 1–3. Všechny komponenty jsou bezstavové (nebo obalují minimální lokální stav) a vyvozují svůj obsah výhradně z props `GameState` a dat hrací plochy.

### 4.1 Vykreslení hrací plochy
- `<HexTile coords, diceStack, fieldProperties, highlight, isSelected, onClick>` — vykreslí jedno hexové pole
  - Pozadí odráží typ pole (`focalPoint` aktivní/neaktivní, `startingField`)
  - Prop `highlight`: `null | 'reachable' | 'selected' | 'trajectory' | 'enemy-reachable'`
  - Vykreslí komponenty `<Die>` pro každou kostku v zásobníku (s věžovým posunem)
  - Předá klik rodiči přes `onClick(hexKey)`
- `<Board state, selectedHex, highlightedHexes, onHexClick>` — vykreslí všech 61 komponent `<HexTile>`
  - Umístí hexy pomocí `hexToPixel` pro absolutní SVG/CSS pozicování
  - Odvozuje zvýraznění pro každý hex z mapy `highlightedHexes` před předáním do `<HexTile>`
  - SVG nebo CSS-grid layout; žádná třetí-stranická hex knihovna

### 4.2 Vykreslení kostky
- `<Die value, owner, isTop>` — vykreslí jednu plochu kostky (tečky nebo číslice)
  - Barva a rámeček odvozeny z ID hráče `owner`
  - `isTop` ovládá plnou vs. ztmavennou viditelnost ve věžovém zásobníku
  - Věžový zásobník: více prvků `<Die>` vykresleno s malým svislým posunem na vrstvu

### 4.3 Značka fokálního bodu
- `<FocalPointMarker isActive>` — vykreslí se uvnitř `<HexTile>` na hexech s fokálním bodem
  - Výrazná vizualizace při aktivním stavu (záře, ikona); tlumená při pasivním stavu

### 4.4 Vrstva zvýraznění pohybu
- Vizuální stavy pro zvýrazněné hexy: **dosažitelné** (světlá záře), **vybrané** (výrazný obrys), **trajektorie** (trasa), **nepřítel v dosahu** (výstražná barva)
- Odvozeno z výstupu `getReachableHexes` / `getJumpReachableHexes` / `getTowerReachableHexes` (Fáze 3)

---
## Fáze 5: Logika souboje

### 5.1 Způsobilost k útoku
- `canAttack(state, attackerHex, defenderHex)` — síla útočníka > síla obránce
- `getAvailableCombatOptions(state)` — ['push', 'occupy'] nebo jen ['push'] pro pohyb věže na věž

### 5.2 Rozlišení odsunu
- `getPushDirection(attackerHex, defenderHex)` — cubický směrový vektor
- `getPushChain(state, defenderHex, direction)` — seřazený seznam formací k odsunutí
- `canPush(state, defenderHex, direction)` — ověří, zda na konci řetězce existuje volné pole
- `applyPush(state)` — vrátí nový stav
  - Přesune každou formaci o 1 hex ve směru odsunu
  - Detekuje obklíčení (vlastní jednotka blokuje ústup) → zničení, body
  - Detekuje vypadnutí z mapy → zničení, body
  - Přehodí jednu poraženou nepřátelskou kostku (min(hod, původní))
  - Útočníkova kostka se sníží o 1 (min 1)

### 5.3 Rozlišení obsazení
- `applyOccupy(state)` — vrátí nový stav
  - Umístí útočníkovu kostku na vrchol obránčovy formace
  - Útočníkova kostka se sníží o 1 (min 1)
  - Obránce nepřehazuje

### 5.4 Modální okno souboje
- `<CombatOverlay options, onChoose>` — zobrazí se při spuštění souboje
- Ukáže sílu útočníka/obránce a dostupné možnosti (odsun / obsazení)

---

## Fáze 6: Logika fokálních bodů

### 6.1 Fáze bodování fokálních bodů
- `applyFocalPhase(state, extraDieRoll)` — zpracuje fokální body na začátku tahu
  - Pro každý aktivní fokální bod držený aktuálním hráčem na konci předchozího tahu:
    - Udělí 1 bod
    - Přehodí danou kostku: min(hod, původní − 1)
  - Pokud existují pasivní fokální body: hodí extra D6 pro výběr jedné pasivní grupy k aktivaci; mapování hodnot hodů na grupy je určeno počtem pasivních grup (např. se 2 pasivními grupami: sudé = první, liché = druhá)
  - Přijme hodnoty hodů jako parametry pro čistotu

### 6.2 Detekce fokálních bodů (konec akční fáze)
- `updateFocalHolders(state)` — po akci zaznamená, které fokální body drží kostka každého hráče

---

## Fáze 7: Správa tahů a fází

### 7.1 Přechody fází
- `advancePhase(state, ...rollResults)` — zpracuje přechody:
  - `focal → action`
  - `action → combat` (pokud byl spuštěn souboj) nebo `action → victory` kontrola → `focal` (další tah)
  - `combat → victory` kontrola → `focal` (další tah)
  - `victory → (konec hry)`
- `endTurn(state)` — posune `currentPlayer` na dalšího hráče v poli `state.players` (zabalení), resetuje příznaky tahu, aktualizuje držitele fokálních bodů

### 7.2 Detekce legálních tahů
- `hasLegalMoves(state)` — vrátí false, pokud není dostupná žádná akce (prohra náhlou smrtí)
- Kontrola: lze pohybovat jakoukoli kostkou, lze zřítit věž, lze přehodit kostku

### 7.3 Zobrazení skóre
- `<ScoreBoard players, scores>` — zobrazí aktuální celkové body vítězství všech hráčů; `players` je seřazený seznam ID hráčů

### 7.4 Indikátor fáze
- `<PhaseIndicator phase, currentPlayer>` — zobrazí, čí je tah a aktuální fáze

---

## Fáze 8: UI komponenty

### 8.1 Panel akcí
- `<ActionPanel currentPlayer, availableActions, activeAction, onActionSelect>` — zobrazí se v dolní části obrazovky poté, co hráč vybere kostku
- Akce jsou uvedeny v tomto pevném pořadí: **Pohyb věže** (skrytý, pokud vybraná kostka není věž), **Pohyb kostky**, **Přehození**
- První použitelná akce v tomto pořadí je automaticky preselektována, když je kostka vybrána
- Přepnutí aktivní akce okamžitě aktualizuje zvýrazněné dosažitelné hexy na ploše
- Zakázaný stav, pokud již byla akce provedena nebo akce není legální

### 8.2 Obrazovka vítězství
- `<VictoryScreen winner>` — zobrazí se, když hráč dosáhne 5 bodů nebo soupeř nemá tahy

### 8.3 Prohlížeč pravidel
- `<RulesViewer onClose>` — modální okno nebo celoobrazovkové překrytí zobrazující pravidla hry
- Přístupný z hlavního menu (oddíl 9.3) a v rámci aktivní hry (např. tlačítko **?** v herním UI)
- Obsah zrcadlí pravidla definovaná v CLAUDE.md; strukturovaná do sbalitelných sekcí (Hrací plocha a komponenty, Podmínka vítězství, Struktura tahu, Akce, Souboj, Věže)
- Otevření prohlížeče pravidel během hry nepozastavuje hru ani neovlivňuje herní stav

---

## Fáze 9: Nastavení hry a navigace

### 9.1 Tok obrazovek aplikace
Aplikace má následující obrazovky v pořadí:

```
Splash obrazovka → Hlavní menu → Výběr mapy → Nastavení hráčů → Obrazovka načítání hry → Hra
```

Navigace se řeší přes React Router nebo jednoduchou stavovou mašinu na nejvyšší úrovni.

### 9.2 Splash obrazovka
- Zobrazí se krátce na začátku aplikace během načítání assetsů
- Zobrazí logo/název hry

### 9.3 Hlavní menu
- Tlačítko **Hrát** → naviguje na Výběr mapy
- Tlačítko **Pravidla** → otevře prohlížeč pravidel (viz oddíl 8.3)
- (Další možnosti menu TBD, např. titulky)

### 9.4 Výběr mapy
- Vypíše všechny dostupné mapy (vestavěná výchozí mapa + všechny uložené mapy z Board Creatoru)
- Každá karta mapy zobrazuje:
  - Náhledový obrázek rozložení hrací plochy
  - Název mapy
  - Počet hráčů (min–max podporovaných mapou, vycházející z počtu `startingField` základen)
  - Cíl bodů vítězství (např. "První na 5 bodů")
- Výběr mapy pokračuje na Nastavení hráčů

`BoardDefinition` je rozšířena o:
```
BoardDefinition {
  ...
  minPlayers: number      // vycházející z počtu rozlišných vlastníků základen v mapě
  maxPlayers: number      // totéž jako minPlayers pro mapy s pevným počtem hráčů; může se lišit pro flexibilní mapy
  victoryPoints: number   // počet bodů potřebných k vítězství
}
```

### 9.5 Nastavení hráčů
- Jeden slot hráče na základnu definovanou ve vybrané mapě
- Každý hráč si zvolí jméno a vybere si **znak** (heraldickou embléma) z nabídky předvoleb
- **Barva se nevybírá** — je přiřazena automaticky na základě pozice základny hráče v mapě (např. horní základna = červená, dolní základna = modrá); znak je překryt na tuto barvu v uživatelském rozhraní
- Potvrzení → Obrazovka načítání hry

### 9.6 Obrazovka načítání hry
- Krátká obrazovka zobrazená během běhu `createInitialState` a přípravy assetů pro herní obrazovku
- Zobrazuje jména hráčů, jejich barvy a znaky jako shrnutí před začátkem hry

---

## Fáze 10: Hody kostkami

### 10.1 Náhodné utility
- `rollD6()` — vrátí 1–6
- `rollFocalDie()` — vrátí 1–6 (používá se pro určení, který fokální bod se aktivuje)

### 10.2 Počáteční umístění kostek
- Určit startovní pozice a hodnoty pro 5 kostek každého hráče (v jejich základních řadách)
- Startovní hodnoty: všechny kostky začínají na hodnotě 3 (nebo náhodný hod — TBD)

---

## Fáze 11: Orchestrace hry

### 11.1 Herní reducer
- `gameReducer(state, action)` — centrální reducer zpracovávající všechny herní akce:
  - `MOVE_DIE`, `MOVE_TOWER`, `JUMP`, `COLLAPSE`, `REROLL`
  - `CHOOSE_COMBAT_OPTION` (odsun / obsazení)
  - `ADVANCE_FOCAL_PHASE`
  - `CONFIRM_ACTION`, `END_TURN`

### 11.2 Integrace React stavu
- Hook `useGameState(players, boardFields)` — obaluje `useReducer(gameReducer, createInitialState(players, boardFields))`
- Exponuje: `state`, `dispatch` a pomocné selektory

### 11.3 Vrcholová herní komponenta
- `<Game>` — orchestruje hrací plochu, UI panely, modální okna
- Spravuje stav výběru (vybraný hex → zvýrazněné hexy)
- Zpracovává tok kliknutí: vyber jednotku → vyber cíl → potvrď

---

## Fáze 12: Interaktivita a vylepšení

### 12.1 Výběr a zvýrazňování hexů
- Klik na vlastní kostku → vybrat ji; panel akcí se zobrazí v dolní části s první použitelnou akcí preselektovanou; dosažitelné hexy se zvýrazní
- Přepnutí akce v panelu znovu vypočítá a zvýrazní dosažitelné hexy
- Zrušit výběr druhým klikem na stejnou kostku nebo klávesou Escape

### 12.2 Plánování trajektorie (Pohyb kostky / Pohyb věže)
Pohyb prochází dvoustupňovým tokem — plánování a potvrzením:

**Krok 1 — Plánování trajektorie.** Dvě ekvivalentní vstupní metody:
- **Ruční cesta**: klikejte na hexy jeden po druhém podél požadované trasy od vybrané kostky; každý klik rozšíří trajektorii o jeden krok (zvýrazněno jako cesta na ploše)
- **Automatická cesta**: klikněte přímo na libovolný dosažitelný cílový hex; nejkratší platná cesta se vypočítá automaticky a zobrazí se jako plánovaná trajektorie

Obě metody vedou ke stejnému výsledku: zvýrazněná trajektorie od vybrané kostky do cílového hexu. Pohyb v tomto bodě **ještě není potvrzen**.

**Krok 2 — Potvrzení.** Jakmile je trajektorie naplánována, jsou dostupné dvě možnosti:
- **Klikněte na cílový hex** (konec trajektorie) — potvrdí pohyb jako jednoduchý pohyb; tah se posune do další fáze
- **Klikněte na nepřátelskou kostku**, která je dosažitelná z cíle (tj. sousední a v dosahu útoku) — potvrdí pohyb a okamžitě spustí souboj; směr příchodu trajektorie určuje směr odsunu (viz oddíl 12.3)

Nepřátelské kostky, které jsou dosažitelné z aktuálního koncového bodu trajektorie, jsou zvýrazněny odlišně, když je trajektorie naplánována, což signalizuje, že je lze zacílit pro ukončení tahu.

Stisknutí klávesy Escape nebo kliknutí na vybranou kostku zruší plánovanou trajektorii a vrátí se ke kroku 1.

### 12.3 Disambiguace akcí (mimo pohyb)
- Když se na stejný hex vztahuje více akcí (např. přehození vs. zřícení), zobrazí se malé popup pro výběr

### 12.4 Výběr směru příchodu
Když se hráč najeď myší na dosažitelný hex obsazený nepřítelem a více než jeden směr příchodu je dostupné, je hex vizuálně rozdělen na až 6 směrových segmentů (jako koláčový graf). Každý segment odpovídá jednomu platnému směru příchodu. Zvýrazněný segment indikuje vybraný směr — najetím myší blízko segmentu jej vyberete. Potvrzením (klik) zamknete ten směr a spustíte souboj s `approachDirection` odpovídajícím vybranému směru. Pokud je dostupný pouze jeden směr příchodu, výběr se přeskočí a útok se spustí přímo.

### 12.6 Animace (volitelné, později)
- Přechod pohybu kostky
- Záblesk souboje
- Animace přírůstku skóre

### 12.7 Responzivní rozložení
- Hrací plocha se přizpůsobuje viewportu
- UI panely se přeuspořádávají na úzkých obrazovkách

---

## Fáze 13: Testování

### 13.1 Unit testy herní logiky
- Otestovat všechny čisté logické funkce (pohyb, souboj, fokální body, bodování)
- Nainstalovat Vitest + React Testing Library

### 13.2 Integrační testy
- Celé sekvence tahů
- Okrajové případy: útok kostkou s hodnotou 1, bodování zřícení věže, řetězový odsun s obklíčením, bodování při vypadnutí z mapy

---

## Fáze 14: AI Opponent

Počítačově řízený hráč, který může obsadit jakýkoliv slot hráče. Všechny boty sdílejí společné rozhraní, takže je herní smyčka považuje za stejné jako lidské hráče.

### 14.1 Rozhraní AI hráče
- `AIPlayer { id: string, getAction(state): Promise<GameAction> }` — abstraktní rozhraní, které implementují všechny boty
- Herní smyčka automaticky volá `getAction`, když se `currentPlayer` shoduje s ID AI hráče
- Před potvrzením akce se přidá malá umělá prodleva, aby se pohyby zdály přirozené
- Obrazovka nastavení hry (Fáze 9.5) umožňuje přiřadit každý slot hráče buď člověku, nebo botovi na vybrané úrovni obtížnosti

### 14.2 Náhodný bot
- Vyjmenuje všechny legální akce a vybere jednu rovnoměrně náhodně
- Užitečný jako výchozí bod a pro automatizované testování herní logiky

### 14.3 Heuristický bot
Rozhodování na základě pravidel, vyhodnocené v pořadí priorit:
- Zaútočit na kteréhokoliv nepřítele, který může být poražen (největší výhoda útočné síly první)
- Obsadit aktivní fokální body, pokud jsou dosažitelné
- Pohybovat se směrem k nejbližšímu nepříteli
- Přehodit jakoukoliv kostku, jejíž hodnota je pod průměrem
- Vrátit se na náhodný legální tah

### 14.4 Minimax bot (s alpha-beta pruningem)
- Vytváří herní strom do konfigurabilní hloubky hledání
- Evaluační funkce bere v úvahu: rozdíl skóre, kontrolu fokálních bodů, celková hodnota kostky na ploše, pozici na ploše (blízkost k fokálním bodům)
- Alpha-beta pruning pro zmenšení prostoru hledání
- Běží ve Web Workeru, aby se zabránilo blokování vlákna UI

### 14.5 Úrovně obtížnosti
| Úroveň  | Bot               | Poznámky                        |
|---------|-------------------|---------------------------------|
| Snadná  | Náhodný bot       | Zcela nepředvídatelný           |
| Střední | Heuristický bot   | Hraje rozumně, bez přehledu     |
| Těžká   | Minimax hloubka 3 | Vidí dopředu, hraje dobře       |
| Expert  | Minimax hloubka 5 | Pomalý, ale silný               |

### 14.6 Integrace do herní smyčky
- `createInitialState` přijímá mapu `botPlayers: { [playerId]: AIPlayer }`
- Po každé akci člověka, která ukončí tah, detektor v reduceru zjistí, že dalším hráčem je bot, a automaticky odešle `BOT_MOVE`
- Akce botů procházejí stejným reducerem jako lidské akce — žádné zvláštní zpracování v herní logice

---

## Fáze 15: Board Creator

Samostatný editor (samostatná React route nebo stránka) pro navrhování, ukládání a načítání herních map. Produkuje JSON soubory, které hra samotná načítá.

### 15.1 Datový formát mapy (JSON)
```
BoardDefinition {
  id: string               // unikátní identifikátor mapy
  name: string
  hexes: HexField[]        // všechna pole s jejich souřadnicemi a vlastnostmi
}
```
- `HexField` reuse strukturu z Fáze 1.2 (`coords` + `properties[]`)
- `minPlayers`, `maxPlayers` odvozené z počtu rozlišných vlastníků `startingField`; `victoryPoints` nastavený autorem mapy
- Uložení/načtení přes `JSON.stringify` / `JSON.parse`; persist do `localStorage` klíčovaný podle `id`, export/import jako `.json` soubor

### 15.2 Model stavu Board Creatoru
```
BoardCreatorState {
  board: BoardDefinition
  selectedHex: HexKey | null
  tool: 'place' | 'delete' | 'assignProperty' | 'removeProperty'
  activeTool PropertyType | null   // která vlastnost se přiřazuje/odebírá
}
```

### 15.3 Operace s políčky
Čisté funkce (bez vedlejších efektů):
- `addHex(board, coords)` — přidá nové prázdné pole; no-op pokud již existuje
- `removeHex(board, coords)` — odstraní pole i všechny jeho vlastnosti
- `assignProperty(board, coords, property)` — přidá nebo nahradí vlastnost daného typu na poli
- `removeProperty(board, coords, type)` — odebere vlastnost daného typu z pole

### 15.4 Persistence
- `saveBoard(board)` — serializuje do JSON, uloží do `localStorage`
- `loadBoard(id)` — načte z `localStorage`, deserializuje
- `listBoards()` — vrátí pole `{ id, name }` pro všechny uložené mapy
- `deleteBoard(id)` — odstraní z `localStorage`
- `exportBoardJSON(board)` — spustí stažení `.json` souboru v prohlížeči
- `importBoardJSON(file)` — načte nahraný `.json` soubor, vrátí `BoardDefinition`

### 15.5 UI Board Creatoru
- `<BoardCreator>` — vrcholová komponenta editoru
- `<EditorBoard>` — vykreslí hexagonální mřížku v editačním režimu; klik přidá/odstraní/vybere pole
- `<ToolPanel>` — výběr aktivního nástroje (umístit, smazat, přiřadit vlastnost, odebrat vlastnost)
- `<PropertyPanel>` — při vybraném hexu zobrazí jeho aktuální vlastnosti a umožní editaci; vstupy pro `owner` (startingField) a `group` / `active` (focalPoint)
- `<MapManager>` — seznam uložených map s tlačítky načíst, smazat, exportovat; tlačítko import pro nahrání `.json`
- `<BoardNameInput>` — editovatelné pole pro název mapy

---

## Fáze 16: Tutoriál

### 16.1 Struktura tutoriálu
- Interaktivní průvodce herními pravidly, který uživatele postupně provedl skutečným hráním
- Běží jako speciální herní režim (odděleně route/stav obrazovky), přístupný z hlavního menu
- Hrací plocha, kostky a herní UI jsou plně funkční — tutoriál vede hráče skrz skriptovaný scénář pomocí zvýrazněných podnětů a tooltipů
- Postup je uložen do `localStorage`, takže si hráč může pokračovat po přerušení

### 16.2 Scénář tutoriálu
- Předdefinované nastavení plochy se specifickými pozicemi kostek určenými k demonstraci jednotlivých pravidel v pořadí
- Kroky jsou skriptovány: každý krok má podmínku, která musí být splněna před pokračováním (např. "pohni tuto kostkou sem")
- Pokrývá v pořadí: pohyb kostky, vytvoření věže, souboj (odsun a obsazení), bodování fokálních bodů, zřícení věže, přehození, podmínka vítězství

### 16.3 UI komponenty tutoriálu
- `<TutorialOverlay>` — zobrazuje aktuální text instrukce a zvýrazňuje relevantní kostku nebo hex
- Šipka / ukazatel směřující na relevantní prvek UI
- Tlačítko **Přeskočit** pro opuštění tutoriálu kdykoli
- Tlačítko **Dalej** pro pokračování, když je krok dokončen (nebo se postoupí automaticky při správné akci)
- Indikátor pokroku zobrazující aktuální krok z celkového počtu

### 16.4 Engine skriptovaného scénáře
- `TutorialStep { instruction: string, highlightHexes: hexKey[], expectedAction: GameAction | null, autoAdvance: boolean }` — typ pro jeden krok
- `tutorialReducer(tutorialState, gameAction)` — ověří, zda akce hráče odpovídá `expectedAction`; v tom případě postoupí krok
- Stav tutoriálu je oddělen od herního stavu; tutoriál může v případě potřeby injektovat vynucený počáteční herní stav pro jednotlivé kroky

---

## Fáze 17: Online hraní

Online hraní umožňuje hráčům hrát spolu přes internet. Tato fáze zavádí backend poprvé. Režim hot-seat zůstává plně funkční vedle online hraní.

### 17.1 Backend a přenos dat
- Lehký server Node.js (např. Express + `ws` nebo Socket.IO) zpracovávající herní místnosti a komunikaci v reálném čase
- WebSocket spojení mezi klienty a serverem
- Veškerá herní logika běží na serveru (autoritativní stav); klienti posílají akce a přijímají aktualizace stavu
- Server ověří každou akci pomocí stejných čistých herních logických funkcí z Fází 3, 5–7

### 17.2 Systém místností
- **Vytvoření místnosti** — generuje krátký kód místnosti; hostitel zvolí mapu, počet hráčů a sloty botů
- **Připojení do místnosti** — zadejte kód místnosti pro připojení; přiřazení volnému slotu hráče
- **Lobby obrazovka** — zobrazuje připojené hráče, jejich zvolené znaky a stav připravenosti; hostitel může spustit hru, když jsou všechny sloty obsazeny
- **Režim pozorovatele** — dodatoční hráči se mohou připojit jako pozorovatelé (bez práv na akce)

### 17.3 Synchronizace herního stavu
- Server drží autoritativní `GameState`; klienti mají místní kopii jen pro čtení
- Klient odešle `GameAction` → server ověří → server vysílá nový stav všem klientům
- Bot hráči (Fáze 14) běží na straně serveru v online hrách

### 17.4 Zpracování odpojení a znovupřipojení
- Pokud se hráč odpojí, jeho slot je označen jako odpojený; ostatní hráči vidí indikátor čekání
- Hráč se může znovu připojit pomocí stejného kódu místnosti během lhůty (TBD); při znovupřipojení se pošle plný stav
- Pokud se odpojený hráč znovu nepřipojí během lhůty, jeho slot převezme heuristický bot

### 17.5 Identita hráče
- Anonymní identita založená na relaci (není vyžadován účet); jméno a znak zvoleny před připojením
- Volitelné: trvalý profil hráče uložený v `localStorage` (jméno + preference znaku)

### 17.6 Odolnost sítě
- Klient zobrazuje indikátor stavu připojení (připojen / znovupřipojování / odpojeno)
- Optimistické místní vykreslování vlastních akcí, kde je to bezpečné; stav serveru vždy vítězí při konfliktu

---

## Fáze 18: Vyladění UI a ladění

### 18.1 Ladicí overlay
- Přepínatelný ladicí režim (klávesová zkratka, např. `Ctrl+D`), který překryje herní plochu informacemi o herním stavu:
  - Souřadnice hexů na každém poli
  - Hodnoty útočné síly pro každé obsazené pole
  - Označení skupin fokálních bodů a aktivní/pasivní stav
  - Aktuální hráč, fáze a příznak provedené akce

### 18.2 Inspektor stavu
- Čtetelný panel (sbalitelný) zobrazující celý serializovaný `GameState` jako formátovaný JSON
- Užitečný pro diagnostiku neočekávaného chování hry během vývoje

### 18.3 Přehrávání akcí
- Schopnost zaznamenat sekvenci herních akcí a přehrát je krok za krokem
- Užitečné pro reprodukci chyb a ověřování správnosti pravidel

### 18.4 Vizuální vyladění
- Vyladit velikost hexů, rozestupy, barvy a typografii v různých rozměrech obrazovky
- Upravit značky fokálních bodů, vizuály věžů a zvýrazňování trajektorie
- Ověřit kontrast barev a čitelnost všech barev hráčů

### 18.5 Profilování výkonu
- Identifikovat a opravit úzká místa při vykreslování (např. zbytečné překreslování všech 61 komponent HexTile)
- Měřit čas odezvy bota Minimax na každé úrovni obtížnosti; v případě potřeby upravit limity hloubky

---

## Doporučené pořadí implementace

1. Fáze 1 (hex utility + vykreslení plochy) — vizuální základ
2. Fáze 2 (model stavu) — datový základ
3. Fáze 10.1 (utility pro hody) — potřebné téměř všude
4. Fáze 3 (logika pohybu) — jádro hry
5. Fáze 4 (UI základ) — první vizuální prototyp
6. Fáze 5 (souboj) — jádro hry
7. Fáze 6 (fokální body) — bodování
8. Fáze 7 (správa tahů) — herní smyčka
9. Fáze 11 (reducer + hook) — propojení logiky s Reactem
10. Fáze 8 (UI komponenty) — plné hratelné UI
11. Fáze 12 (vylepšení interaktivity) — UX
12. Fáze 9 (nastavení hry a navigace) — úplný tok aplikace
13. Fáze 13 (testování) — jistota
14. Fáze 14 (AI opponent) — podpora jednoho hráče
15. Fáze 15 (board creator) — nástroj pro tvorbu map
16. Fáze 16 (tutoriál) — interaktivní průvodce
17. Fáze 17 (online hraní) — hraní přes internet
18. Fáze 18 (vyladění UI a ladění) — vyladění a diagnostika

---

## Poznámky

> **Nezapomeň na grafiku!** — Kostky, hexová pole, markery ohniskových bodů a základny hráčů budou někdy potřebovat pořádnou grafiku/ikonky. Zatím jsou všechny vizuály SVG primitiva. Vrátit se ve fázi 18.4 (vizuální ladění).

---

## Otevřené otázky (z TODO v CLAUDE.md)

- **Bodování smíšené věže mimo mapu**: boduje si body pouze útočník, nebo oba hráči za každou vlastní kostku?
- **Podmínka vstupu do věže**: je kontrola na základě hodnoty kostky nebo útočné síly? (Plán předpokládá hodnotu kostky.)
- **Počáteční umístění kostek**: přesné startovní hexové pozice pro 5 kostek každého hráče.
- **Startovní hodnoty kostek**: fixní (např. všechny 3) nebo náhodné hody?

---

## Další zdroje

Viz https://www.redblobgames.com/grids/hexagons/.
