# CLAUDE-cs.md
Tento soubor poskytuje pokyny pro Claude Code (claude.ai/code) při práci s kódem v tomto repozitáři.

## Příkazy

```bash
npm run dev       # Spustí Vite dev server s HMR
npm run build     # Produkční sestavení
npm run lint      # ESLint
npm run preview   # Náhled produkčního sestavení
```

## Přehled projektu

**Donjon Fall** („Pád Donjonu") je desková hra pro dva hráče na hexagonální síti, která je přepisována jako webová aplikace v Reactu.

- `g-drive/` — soubory původního prototypu a autoritativní PDF s pravidly (`PÁD DONJONU – Pravidla_v41.pdf`, pravidla v4.1). Ostatní soubory v tomto adresáři ignoruj, pokud není v promptu uvedeno jinak.
- `src/` — nová aplikace React + Vite + Tailwind v4, zatím jen placeholder (`App.jsx` vykresluje název).

## Pravidla hry (v4.2)

### Hrací plocha a komponenty

- **61 šestiúhelníkových polí** uspořádaných do tvaru velkého šestiúhelníku. Toto je výchozí mapa, v budoucnu lze navrhovat další.
- Dva hráči: **červený** a **modrý**.
- Každý hráč má **5 kostek D6** představujících jeho jednotky, plus jedna sdílená extra D6 pro vyhodnocení ohnisek.
- **Základna červeného** = horní řada polí; **základna modrého** = dolní řada. Základny nemají během hry žádná speciální pravidla — fungují jako normální pole.
- **3 ohniska** ve středové vodorovné řadě (levé, střední, pravé). Středové ohnisko začíná jako **aktivní** (s 1 vítězným bodem na něm).

### Podmínka vítězství

* První hráč, který nasbírá **5 vítězných bodů**, vyhrává. Body jsou **trvalé** (nelze je ztratit). Body lze získávat pouze ve vlastním tahu.
* Hráč, který nemůže provést žádný legální tah, **okamžitě prohrává** (náhlá smrt).

### Bodování

- **Zničení**: +1 bod za každou zničenou nepřátelskou kostku (vystrčenou z mapy, obklíčenou nebo zřícením věže).
- **Ohniska**: Pokud tvá kostka držela **aktivní** ohnisko na konci tvého předchozího tahu, na začátku svého aktuálního tahu: získáš 1 bod, přehodíš tuto kostku (nová hodnota = min(hod, původní−1), takže může jen klesat), poté hodíš extra D6 a určíš, které ze dvou zbývajících ohnisek také získá bod (sudé = levé, liché = pravé).

### Struktura tahu (4 fáze v pořadí)

1. **Ohniska** — viz **Bodování** – **Ohniska**.
2. **Akce** — vyber a proveď **právě jednu** ze 4 akcí (viz níže).
3. **Souboj** — pokud tvůj pohyb skončil na nepřátelsky obsazeném poli, vyřeš souboj (fáze 1 a 2).
4. **Vítězství** — pokud máš 5+ bodů, vyhráváš.

### Akce

* **Pohyb kostky** — pohni jednou ze svých kostek až o tolik polí, kolik je její hodnota, po libovolné trase (směr se může měnit uprostřed pohybu).
  - Nemůže procházet přes nepřátelské kostky.
  - Může procházet přes vlastní kostky pouze pokud má pohybující se kostka vyšší bojovou sílu na daném poli. Průchod přes přátelskou kostku je vyhodnocen jako vytvoření dočasné věže v daném bodě: zbývající pohyb pokračuje jako skok z věže — bojová síla se navýší na hodnotu virtuální věže pro dalších (vlastní kostky − nepřátelské kostky, min 1) polí, poté se vrátí na prostou hodnotu kostky. Žádný bonusový pohyb se neuděluje; již provedené kroky se odečítají od hodnoty kostky.
  - Pohyb na prázdné pole kostku prostě přesune.
  - Pohyb na přátelsky obsazené pole vytvoří věž, pouze pokud bojová síla pohybující se kostky překročí bojovou sílu věže na daném poli.
  - Pohyb na nepřátelské pole spustí buď **Souboj**, nebo vytvoří **věž** (volba aktuálního hráče).
  - **Skok z věže**: kostka na vrcholu věže se může oddělit a skočit až o tolik polí, kolik je její vlastní hodnota (stejně jako samostatná kostka). Její bojová síla se rovná bývalé bojové síle věže po prvních (vlastní kostky ve věži − nepřátelské kostky ve věži, min 1) polích skoku; za touto vzdáleností se bojová síla vrátí na prostou hodnotu kostky.
* **Zřícení věže** — dostupné pokud má věž **3+ kostek**.
  - Spustit ho může pouze hráč, jehož kostka je **nahoře**.
  - **Spodní** kostka je odstraněna ze hry. Pokud šlo o nepřátelskou kostku, získáš 1 bod.
* **Pohyb celé věže** — hráč s vrchní kostkou ovládá věž.
  - Dosah = vlastní kostky ve věži − nepřátelské kostky ve věži (min 1).
  - Pokud cíl obsahuje nepřítele, spustí se **Souboj**; dostupné jsou možnosti **posunutí** i **obsazení**.
* **Přehození** — vyber jednu ze svých kostek (samostatnou nebo vrchol věže) a přehoď ji.
  - Pokud je nová hodnota nižší než původní, ponech původní.
  - Hodnota kostky může jen zůstat stejná nebo vzrůst.

### Souboj

Spustí se, když pohyb skončí na nepřátelsky obsazeném poli.

- **Bojová síla** = hodnota vrchní kostky + počet vlastních podpůrných kostek − počet nepřátelských kostek. Pro samostatnou kostku se bojová síla rovná její hodnotě. U věže se „vlastní podpůrné kostky" nepočítají včetně samotné vrchní kostky.
- Útok uspěje pouze pokud bojová síla útočníka **striktně převyšuje** bojovou sílu obránce.
- Na pole, kde má nepřítel stejnou nebo vyšší bojovou sílu, nelze zaútočit.

**Fáze 1 — Automatické důsledky:** Hodnota útočníkovy kostky se sníží o 1.
  - Kostka s bojovou silou 1 nemůže útočit, takže minimální hodnota, na kterou může kostka klesnout v důsledku souboje, je 1.

**Fáze 2 — Útočník si vybere jednu možnost:**
  - **Posunutí** (musí existovat volná ústupová cesta):
    - Nepřátelská kostka nebo celá nepřátelská formace (viz **Řetězová reakce**) ve směru útoku je posunuta o 1 pole dále, pokud tam je volné pole (volná ústupová cesta).
    - Jedna poražená nepřátelská kostka **přehazuje** (nová hodnota = min(hod, původní) — obránce se nemůže stát silnějším).
    - Smíšená věž se pohybuje jako celek.
    - Řetězová reakce: pokud je za ní další nepřátelská formace, každá je postupně posunuta; každá formace, která narazí na vlastní jednotku (viz **Obklíčení**) nebo okraj mapy (viz **Mimo mapu**), je **zničena** (útočník získává body).
    - **Obklíčení**: pokud vlastní jednotka blokuje ústupovou cestu, posunutá formace (poslední ve formaci ve směru útoku) nemůže uniknout a je zničena (jeden bod za každou zničenou nepřátelskou kostku).
    - **Mimo mapu**: vystrčení za okraj → zničení, útočící hráč získá 1 bod za každou zničenou nepřátelskou kostku.
  - **Obsazení**: útočníkova formace je umístěna na vrchol nepřátelské formace a vytvoří **Smíšenou věž**. Pokud byl útočník samostatná kostka, pohybuje se pouze ona; pokud útočník přišel jako celá věž, celá věž se přesune na obránce. Kontrolu má hráč, jehož kostka je nahoře. Obránce **nepřehazuje**.

### Věže a klíčové pojmy

- **Věž**: 2+ kostek na stejném poli. Nová kostka může být přidána pouze pokud její **bojová síla** striktně překročí aktuální bojovou sílu věže. Kontrola = hráč s vrchní kostkou.
- **Smíšená věž**: věž obsahující kostky obou hráčů. Ovládá ji hráč s vrchní kostkou — pouze ten ji může přesouvat, útočit z ní nebo z ní skákat.
- **Základna**: výchozí řada; žádná speciální pravidla během hry.

## Technický stack

- React 19, Vite 8, Tailwind CSS v4 (přes plugin `@tailwindcss/vite` — není potřeba `tailwind.config.js`)
- ESLint 9 flat config (`eslint.config.js`)
- Zatím žádný testovací framework
