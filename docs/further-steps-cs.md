# Donjon Fall — Další kroky

## Přehled

Nyní, když je základní část hry implementovaná (viz implementační-plán.md), zbývá mnoho vylepšení.

---

## Umělý inteligentní protivník

Počítačem řízený hráč, který může zaujmout libovolný slot hráče. Všichni boti sdílí společné rozhraní, takže herní smyčka je s nimi zachází stejně jako s lidskými hráči.

### 1 Rozhraní AI hráče
- `AIPlayer { id: string, getAction(state): Promise<GameAction> }` — abstraktní rozhraní, které všichni boti implementují
- Herní smyčka automaticky zavolá `getAction`, když se `currentPlayer` shoduje s ID AI hráče
- Před přijetím akce je přidána malá umělá prodleva, aby se pohyby zdály přirozenější
- Obrazovka nastavení hry (@docs/implementační-plán.md Fáze 9.5) umožňuje přiřadit každý slot hráče buď člověku, nebo botovi na zvolené úrovni obtížnosti

### 2 Náhodný bot
- Vyjmenuje všechny legální akce a vybere jednu náhodně s stejnou pravděpodobností
- Užitečný jako základní bod srovnání a pro automatizované testování herní logiky

### 3 Heuristický bot
Rozhodování na základě pravidel, vyhodnocované v pořadí priorit:
- Útočit na jakéhokoliv nepřítele, kterého lze porazit (nejdříve největší výhoda útočné síly)
- Obsazovat aktivní ohniska, jsou-li dosažitelná
- Pohybovat se k nejbližšímu nepříteli
- Přehodit jakoukoli kostku, jejíž hodnota je pod průměrem
- Vrátit se na náhodný legální pohyb

### 4 Minimax bot (s prořezáváním alfa-beta)
- Konstruuje herní strom do konfiguratelné hloubky vyhledávání
- Funkce vyhodnocení zvažuje: diferenci skóre, kontrolu ohnisek, celkovou hodnotu kostky na desce, pozici na desce (vzdálenost k ohniskům)
- Prořezávání alfa-beta ke snížení vyhledávacího prostoru
- Běží v Web Workeru, aby se zabránilo blokování vlákna uživatelského rozhraní

### 5 Úrovně obtížnosti
| Úroveň | Bot            | Poznámky                                    |
|--------|----------------|---------------------------------------------|
| Snadná | Náhodný bot    | Zcela nepředvídatelný                      |
| Střední| Heuristický bot| Hraje rozumně, bez forward lookahead       |
| Těžká  | Minimax hloubka 3| Podívá se dopředu, hraje dobře             |
| Expert | Minimax hloubka 5| Pomalý, ale silný                           |

### 6 Integrace do herní smyčky
- `createInitialState` přijímá mapu `botPlayers: { [playerId]: AIPlayer }`
- Po každé akci člověka, která ukončí tah, detektor zjistí, že dalším hráčem je bot, a automaticky odešle `BOT_MOVE`
- Akce bota procházejí stejným reducerem jako akce člověka — bez zvláštní léčby v herní logice

---

## Tvůrce desky

Samostatný editor (samostatná React trasa nebo stránka) pro návrh, ukládání a načítání herních map. Vytváří soubory JSON konzumované samotnou hrou.

### 1 Formát dat desky (JSON)
```
BoardDefinition {
  id: string               // jedinečný identifikátor mapy
  name: string
  hexes: HexField[]        // všechna pole se svými souřadnicemi a vlastnostmi
}
```
- `HexField` znovu používá strukturu z @docs/implementační-plán.md Fáze 1.2 (`coords` + `properties[]`)
- `minPlayers`, `maxPlayers` odvozeny z počtu různých vlastníků `startingField` základen; `victoryPoints` nastaveny autorem mapy
- Uložení/načtení přes `JSON.stringify` / `JSON.parse`; uchovávání v `localStorage` s klíčem `id`, s exportem/importem jako `.json` soubor

### 2 Model stavu tvůrce desky
```
BoardCreatorState {
  board: BoardDefinition
  selectedHex: HexKey | null
  tool: "place" | "delete" | "assignProperty" | "removeProperty"
  activeTool PropertyType | null   // která vlastnost se má přiřadit/odebrat
}
```

### 3 Operace pole
Čisté funkce (bez vedlejších účinků):
- `addHex(board, coords)` — přidá nové prázdné pole; žádná operace, pokud již existuje
- `removeHex(board, coords)` — odebere pole a všechny jeho vlastnosti
- `assignProperty(board, coords, property)` — přidá nebo nahradí vlastnost daného typu na poli
- `removeProperty(board, coords, type)` — odebere vlastnost daného typu z pole

### 4 Uchovávání
- `saveBoard(board)` — serializuje do JSON, uloží do `localStorage`
- `loadBoard(id)` — čte z `localStorage`, deserializuje
- `listBoards()` — vrátí pole `{ id, name }` pro všechny uložené desky
- `deleteBoard(id)` — odebere z `localStorage`
- `exportBoardJSON(board)` — spustí stažení `.json` souboru v prohlížeči
- `importBoardJSON(file)` — čte nahrán `.json` soubor, vrátí `BoardDefinition`

### 5 Uživatelské rozhraní tvůrce desky
- `<BoardCreator>` — komponenta editoru na nejvyšší úrovni
- `<EditorBoard>` — vykresluje hexagonální mřížku v režimu úprav; klik přidá/odebere/vybere pole
- `<ToolPanel>` — vybírá aktivní nástroj (place, delete, assign property, remove property)
- `<PropertyPanel>` — je-li vybrán hex, zobrazí jeho aktuální vlastnosti a umožní úpravu; vstupy pro `owner` (startingField) a `group` / `active` (focalPoint)
- `<MapManager>` — vypíše uložené mapy s tlačítky načíst, smazat, exportovat; tlačítko import pro nahrání `.json`
- `<BoardNameInput>` — upravitelné pole názvu mapy

---

## Tutorial

### 1 Struktura tutoriálu
- Interaktivní průvodce, který učí herní pravidla krok za krokem prostřednictvím skutečné hry
- Běží jako speciální herní režim (samostatná trasa / stav obrazovky), přístupný z hlavního menu
- Deska, kostky a herní uživatelské rozhraní jsou plně funkční — tutorial vede hráče skrz scenář se skriptem pomocí zvýrazněných promptů a tooltipů
- Pokrok je uložen v `localStorage`, aby hráč mohl pokračovat, pokud byl přerušen

### 2 Scénář tutoriálu
- Předdefinované nastavení desky se specifickými pozicemi kostek navržené k předvedení každého pravidla v pořadí
- Kroky jsou skriptovány: každý krok má podmínku, která musí být splněna před pokračováním (např. "přesuň tuto kostku sem")
- Pokrývá postupně: pohyb kostky, vytvoření věže, souboj (odsun a obsazení), bodování ohniska, zřícení věže, přehození, podmínka vítězství

### 3 Komponenty uživatelského rozhraní tutoriálu
- `<TutorialOverlay>` — zobrazí aktuální instrukční text a zvýrazní příslušný prvek nebo pole
- Indikátor šipky / ukazatele směřující na příslušný prvek uživatelského rozhraní
- Tlačítko **Přeskočit** pro ukončení tutoriálu kdykoli
- Tlačítko **Další** pro pokračování, když je krok dokončen (nebo se automaticky pokračuje na správnou akci)
- Indikátor pokroku ukazující aktuální krok z celkového počtu kroků

### 4 Skriptovaný herní engine
- `TutorialStep { instruction: string, highlightHexes: hexKey[], expectedAction: GameAction | null, autoAdvance: boolean }`
- `tutorialReducer(tutorialState, gameAction)` — kontroluje, zda akce hráče odpovídá `expectedAction`; posune krok, pokud ano
- Stav tutoriálu je oddělený od herního stavu; tutorial může vložit vynucený počáteční herní stav na krok, pokud je to potřeba

---

## Online multiplayer

Online multiplayer umožňuje hráčům hrát si proti sobě přes internet. Tato fáze zavádí backend poprvé. Režim místní jednoho se v jednom sedle plně zachovává vedle online hraní.

### 1 Backend a přenos
- Lehký server Node.js (např. Express + `ws` nebo Socket.IO) spravující herní místnosti a přenos zpráv v reálném čase
- Připojení WebSocket mezi klienty a serverem
- Veškerá herní logika se nadále spouští na serveru (autoritativní stav); klienti odesílají akce a přijímají aktualizace stavu
- Server ověřuje každou akci pomocí stejných čistých herních logických funkcí z @docs/implementační-plán.md Fáze 3, 5–7

### 2 Systém místností
- **Vytvořit místnost** — vygeneruje krátký kód místnosti; host volí mapu, počet hráčů a sloty botů
- **Připojit se k místnosti** — zadejte kód místnosti pro připojení; přiřazeno volnému slotu hráče
- **Obrazovka lobby** — zobrazí připojené hráče, jejich zvolené erby a stav připravenosti; host může spustit hru, když jsou všechny sloty vyplněny
- **Režim pozorovatele** — další hráči se mohou připojit jako pozorovatelé (bez práv akcí)

### 3 Synchronizace herního stavu
- Server drží autoritativní `GameState`; klienti drží místní kopii pouze pro čtení
- Klient odešle `GameAction` → server ověří → server vysílá nový stav všem klientům
- Botovští hráči běží na straně serveru v online hrách

### 4 Zpracování znovupřipojení a odpojení
- Pokud se hráč odpojí, jejich slot je označen jako odpojený; ostatní hráči vidí čekací indikátor
- Hráč se může znovu připojit pomocí stejného kódu místnosti v období odkladu (TBD); úplný stav se vyšle při znovupřipojení
- Pokud se odpojený hráč nepřipojí znovu během období odkladu, jejich slot zaujme heuristický bot

### 5 Identita hráče
- Anonymní identita na bázi relace (není vyžadován účet); jméno hráče a erb zvoleny před připojením
- Volitelné: trvalý profil hráče uložený v `localStorage` (jméno + preference erbu)

### 6 Odolnost sítě
- Klient zobrazuje indikátor stavu připojení (připojeno / opětovné připojování / odpojeno)
- Optimistické místní vykreslení vlastních akcí, kde je to bezpečné; stav serveru vždy vyhraje v případě konfliktu

---

## Otevřené otázky (z CLAUDE.md TODO)

- **Bodování věže mimo mapu**: boduje pouze útočník, nebo oba hráči za kostku?
- **Podmínka vstupu do věže**: je kontrola na hodnotě tváře nebo útočné síle? (Plán předpokládá hodnotu tváře.)
- **Počáteční umístění kostek**: přesné počáteční pozice hexů pro 5 kostek na hráče.
- **Počáteční hodnoty kostek**: fixní (např. všechny 3) nebo náhodné hody?

---

## Další zdroje

Viz https://www.redblobgames.com/grids/hexagons/.