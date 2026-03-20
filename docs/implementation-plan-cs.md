# Donjon Fall — Implementační plán

## Přehled

Hra pro více hráčů (N hráčů, N ≥ 2) na hexagonální mřížce postavená jako React webová aplikace. Výchozí konfigurace je pro dva hráče, ale veškerá herní logika je navržena pro N hráčů. Veškerá herní logika běží na straně klienta; backend zatím není potřeba. Hráči sdílejí jednu obrazovku (hot-seat).

---

## Fáze 1: Základ hexagonální mřížky

### 1.1 Souřadnicový systém hexů
- Implementovat cubické souřadnice (q, r, s) pro hexagony
- Utility: `cubeToOffset`, `offsetToCube`, `cubeDistance`
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
  - Pokud je dostupnější více než jeden směr příchodu, počkaj na potvrzení směru hráčem před potvrzením (viz oddíl 10.3); `CombatState` zahrnuje `approachDirection`

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

## Fáze 4: Logika souboje

### 4.1 Způsobilost k útoku
- `canAttack(state, attackerHex, defenderHex)` — síla útočníka > síla obránce
- `getAvailableCombatOptions(state)` — ['push', 'occupy'] nebo jen ['push'] pro pohyb věže na věž

### 4.2 Rozlišení odsunu
- `getPushDirection(attackerHex, defenderHex)` — cubický směrový vektor
- `getPushChain(state, defenderHex, direction)` — seřazený seznam formací k odsunutí
- `canPush(state, defenderHex, direction)` — ověří, zda na konci řetězce existuje volné pole
- `applyPush(state)` — vrátí nový stav
  - Přesune každou formaci o 1 hex ve směru odsunu
  - Detekuje obklíčení (vlastní jednotka blokuje ústup) → zničení, body
  - Detekuje vypadnutí z mapy → zničení, body
  - Přehodí jednu poraženou nepřátelskou kostku (min(hod, původní))
  - Útočníkova kostka se sníží o 1 (min 1)

### 4.3 Rozlišení obsazení
- `applyOccupy(state)` — vrátí nový stav
  - Umístí útočníkovu kostku na vrchol obránčovy formace
  - Útočníkova kostka se sníží o 1 (min 1)
  - Obránce nepřehazuje

---

## Fáze 5: Logika fokálních bodů

### 5.1 Fáze bodování fokálních bodů
- `applyFocalPhase(state, extraDieRoll)` — zpracuje fokální body na začátku tahu
  - Pro každý aktivní fokální bod držený aktuálním hráčem na konci předchozího tahu:
    - Udělí 1 bod
    - Přehodí danou kostku: min(hod, původní − 1)
  - Pokud existují pasivní fokální body: hodí extra D6 pro výběr jedné pasivní grupy k aktivaci; mapování hodnot hodů na grupy je určeno počtem pasivních grup (např. se 2 pasivními grupami: sudé = první, liché = druhá)
  - Přijme hodnoty hodů jako parametry pro čistotu

### 5.2 Detekce fokálních bodů (konec akční fáze)
- `updateFocalHolders(state)` — po akci zaznamená, které fokální body drží kostka každého hráče

---

## Fáze 6: Správa tahů a fází

### 6.1 Přechody fází
- `advancePhase(state, ...rollResults)` — zpracuje přechody:
  - `focal → action`
  - `action → combat` (pokud byl spuštěn souboj) nebo `action → victory` kontrola → `focal` (další tah)
  - `combat → victory` kontrola → `focal` (další tah)
  - `victory → (konec hry)`
- `endTurn(state)` — posune `currentPlayer` na dalšího hráče v poli `state.players` (zabalení), resetuje příznaky tahu, aktualizuje držitele fokálních bodů

### 6.2 Detekce legálních tahů
- `hasLegalMoves(state)` — vrátí false, pokud není dostupná žádná akce (prohra náhlou smrtí)
- Kontrola: lze pohybovat jakoukoli kostkou, lze zřítit věž, lze přehodit kostku

---

## Fáze 7: UI komponenty

### 7.1 Komponenta kostky
- `<Die value, owner, isTop>` — vykreslí plochu kostky (tečky nebo číslo) na hexu
- Vrstvené kostky zobrazeny s posunutím/stínem pro indikaci výšky věže

### 7.2 Značka fokálního bodu
- Vizuální indikátor na hexech fokálních bodů (aktivní vs. neaktivní)
- Zobrazení počtu uložených bodů vítězství na fokálním bodu

### 7.3 Zobrazení skóre
- `<ScoreBoard players, scores>` — zobrazí aktuální celkové body vítězství všech hráčů; `players` je seřazený seznam ID hráčů

### 7.4 Panel akcí
- `<ActionPanel currentPlayer, availableActions, onAction>` — tlačítka pro 4 akce
- Zakázaný stav, pokud již byla akce provedena nebo akce není legální

### 7.5 Indikátor fáze
- `<PhaseIndicator phase, currentPlayer>` — zobrazí, čí je tah a aktuální fáze

### 7.6 Modální okno souboje
- `<CombatOverlay options, onChoose>` — zobrazí se při spuštění souboje
- Ukáže sílu útočníka/obránce a dostupné možnosti (odsun / obsazení)

### 7.7 Obrazovka vítězství
- `<VictoryScreen winner>` — zobrazí se, když hráč dosáhne 5 bodů nebo soupeř nemá tahy

---

## Fáze 8: Hody kostkami

### 8.1 Náhodné utility
- `rollD6()` — vrátí 1–6
- `rollFocalDie()` — vrátí 1–6 (používá se pro určení, který fokální bod se aktivuje)

### 8.2 Počáteční umístění kostek
- Určit startovní pozice a hodnoty pro 5 kostek každého hráče (v jejich základních řadách)
- Startovní hodnoty: všechny kostky začínají na hodnotě 3 (nebo náhodný hod — TBD)

---

## Fáze 9: Orchestrace hry

### 9.1 Herní reducer
- `gameReducer(state, action)` — centrální reducer zpracovávající všechny herní akce:
  - `MOVE_DIE`, `MOVE_TOWER`, `JUMP`, `COLLAPSE`, `REROLL`
  - `CHOOSE_COMBAT_OPTION` (odsun / obsazení)
  - `ADVANCE_FOCAL_PHASE`
  - `CONFIRM_ACTION`, `END_TURN`

### 9.2 Integrace React stavu
- Hook `useGameState(players, boardFields)` — obaluje `useReducer(gameReducer, createInitialState(players, boardFields))`
- Exponuje: `state`, `dispatch` a pomocné selektory

### 9.3 Vrcholová herní komponenta
- `<Game>` — orchestruje hrací plochu, UI panely, modální okna
- Spravuje stav výběru (vybraný hex → zvýrazněné hexy)
- Zpracovává tok kliknutí: vyber jednotku → vyber cíl → potvrď

---

## Fáze 10: Interaktivita a vylepšení

### 10.1 Výběr a zvýrazňování hexů
- Klik na vlastní kostku → zvýraznit dosažitelné hexy pro zvolenou akci
- Klik na zvýrazněný hex → odeslat akci
- Zrušit výběr druhým klikem nebo klávesou Escape

### 10.2 Disambiguace akcí
- Pokud se na stejný hex vztahuje více akcí (např. pohyb vs. skok), zobrazí malé popup pro výběr

### 10.3 Výběr směru příchodu
Když se hráč najeď myší na dosažitelný hex obsazený nepřítelem a více než jeden směr příchodu je dostupné, je hex vizuálně rozdělen na až 6 směrových segmentů (jako koláčový graf). Každý segment odpovídá jednomu platnému směru příchodu. Zvýrazněný segment indikuje vybraný směr — najetím myší blízko segmentu jej vyberete. Potvrzením (klik) zamknete ten směr a spustíte souboj s `approachDirection` odpovídajícím vybranému směru. Pokud je dostupný pouze jeden směr příchodu, výběr se přeskočí a útok se spustí přímo.

### 10.5 Animace (volitelné, později)
- Přechod pohybu kostky
- Záblesk souboje
- Animace přírůstku skóre

### 10.6 Responzivní rozložení
- Hrací plocha se přizpůsobuje viewportu
- UI panely se přeuspořádávají na úzkých obrazovkách

---

## Fáze 11: Testování

### 11.1 Unit testy herní logiky
- Otestovat všechny čisté logické funkce (pohyb, souboj, fokální body, bodování)
- Nainstalovat Vitest + React Testing Library

### 11.2 Integrační testy
- Celé sekvence tahů
- Okrajové případy: útok kostkou s hodnotou 1, bodování zřícení věže, řetězový odsun s obklíčením, bodování při vypadnutí z mapy

---

## Fáze 12: Board Creator

Samostatný editor (samostatná React route nebo stránka) pro navrhování, ukládání a načítání herních map. Produkuje JSON soubory, které hra samotná načítá.

### 12.1 Datový formát mapy (JSON)
```
BoardDefinition {
  id: string               // unikátní identifikátor mapy
  name: string
  hexes: HexField[]        // všechna pole s jejich souřadnicemi a vlastnostmi
}
```
- `HexField` reuse strukturu z Fáze 1.2 (`coords` + `properties[]`)
- Uložení/načtení přes `JSON.stringify` / `JSON.parse`; persist do `localStorage` klíčovaný podle `id`, export/import jako `.json` soubor

### 12.2 Model stavu Board Creatoru
```
BoardCreatorState {
  board: BoardDefinition
  selectedHex: HexKey | null
  tool: 'place' | 'delete' | 'assignProperty' | 'removeProperty'
  activeTool PropertyType | null   // která vlastnost se přiřazuje/odebírá
}
```

### 12.3 Operace s políčky
Čisté funkce (bez vedlejších efektů):
- `addHex(board, coords)` — přidá nové prázdné pole; no-op pokud již existuje
- `removeHex(board, coords)` — odstraní pole i všechny jeho vlastnosti
- `assignProperty(board, coords, property)` — přidá nebo nahradí vlastnost daného typu na poli
- `removeProperty(board, coords, type)` — odebere vlastnost daného typu z pole

### 12.4 Persistence
- `saveBoard(board)` — serializuje do JSON, uloží do `localStorage`
- `loadBoard(id)` — načte z `localStorage`, deserializuje
- `listBoards()` — vrátí pole `{ id, name }` pro všechny uložené mapy
- `deleteBoard(id)` — odstraní z `localStorage`
- `exportBoardJSON(board)` — spustí stažení `.json` souboru v prohlížeči
- `importBoardJSON(file)` — načte nahraný `.json` soubor, vrátí `BoardDefinition`

### 12.5 UI Board Creatoru
- `<BoardCreator>` — vrcholová komponenta editoru
- `<EditorBoard>` — vykreslí hexagonální mřížku v editačním režimu; klik přidá/odstraní/vybere pole
- `<ToolPanel>` — výběr aktivního nástroje (umístit, smazat, přiřadit vlastnost, odebrat vlastnost)
- `<PropertyPanel>` — při vybraném hexu zobrazí jeho aktuální vlastnosti a umožní editaci; vstupy pro `owner` (startingField) a `group` / `active` (focalPoint)
- `<MapManager>` — seznam uložených map s tlačítky načíst, smazat, exportovat; tlačítko import pro nahrání `.json`
- `<BoardNameInput>` — editovatelné pole pro název mapy

---

## Doporučené pořadí implementace

1. Fáze 1 (hex utility + vykreslení plochy) — vizuální základ
2. Fáze 2 (model stavu) — datový základ
3. Fáze 8.1 (utility pro hody) — potřebné téměř všude
4. Fáze 3 (logika pohybu) — jádro hry
5. Fáze 4 (souboj) — jádro hry
6. Fáze 5 (fokální body) — bodování
7. Fáze 6 (správa tahů) — herní smyčka
8. Fáze 9 (reducer + hook) — propojení logiky s Reactem
9. Fáze 7 (UI komponenty) — hratelné UI
10. Fáze 10 (vylepšení interaktivity) — UX
11. Fáze 11 (testování) — jistota
12. Fáze 12 (board creator) — nástroj pro tvorbu map

---

## Otevřené otázky

- **Bodování smíšené věže mimo mapu**: boduje si body pouze útočník, nebo oba hráči za každou vlastní kostku?
- **Podmínka vstupu do věže**: je kontrola na základě hodnoty kostky nebo útočné síly? (Plán předpokládá hodnotu kostky.)
- **Počáteční umístění kostek**: přesné startovní hexové pozice pro 5 kostek každého hráče.
- **Startovní hodnoty kostek**: fixní (např. všechny 3) nebo náhodné hody?

---

## Další zdroje

Viz https://www.redblobgames.com/grids/hexagons/.
