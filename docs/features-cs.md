# Sledování funkcí

## Formát

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| — | — | — | — | — | — |

**Priorita:** `P1` kritická · `P2` vysoká · `P3` střední · `P4` nízká · `P90` backlog / budoucnost  
**Stav:** `otevřená` · `řeší se` · `hotová` · `neřeší se`

---

## UX / Ovládání

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-001 | Layout | Plynulý responzivní přechod mezi mobilním a desktopovým layoutem (nejen dva oddělené breakpointy) | P2 | otevřená | |
| FEAT-002 | Game / Mobil | Audit hratelnosti na mobilu: je hra plně funkční bez hoveru? Identifikovat chybějící informace nebo interakce na dotykových zařízeních | P2 | otevřená | |
| FEAT-003 | Game / Mobil | Směr útoku přes dotyk: (1) dotknout se a podržet nepřátelskou kostku, (2) kroužit přes možné směry útoku, (3) pustit na žádaném směru pro potvrzení útoku | P2 | otevřená | |
| FEAT-004 | Game / Desktop | Hover přes hex: zobrazit nejkratší trasu pohybu na najetý hex | P3 | otevřená | |
| FEAT-005 | Game / Desktop | Hover přes hex: zobrazit indikátor směru útoku při najetí na napadnutelného nepřítele | P3 | otevřená | |
| FEAT-006 | Game / Desktop | Audit a eliminace zbytečných kliků navíc v desktopovém ovládání | P3 | otevřená | |

---

## Panel akcí

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-007 | Game / ActionPanel | Zobrazit tlačítka akcí rovnou (bez dalšího kroku); skrýt akce, které aktivní hráč nemůže použít — např. skrýt Přesun věže a Destrukci, pokud nehráč nekontroluje žádnou věž | P2 | otevřená | |
| FEAT-008 | Game / ActionPanel | Při akci Pohyb: ztmavit všechny hexy kromě těch, kde jsou kostky/věže hráče, a jejich dosažitelných cílů | P3 | otevřená | |
| FEAT-009 | Game / ActionPanel | Při akci Přehození: ztmavit všechny hexy kromě těch, kde má hráč kontrolovatelné kostky/věže | P3 | otevřená | |

---

## Zpětná vazba a animace

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-010 | Game / Overlay | Overlay při změně hráče: zobrazit, kdo hraje, při přechodu tahu | P2 | otevřená | |
| FEAT-011 | Game / Overlay | Overlay přehození: zobrazit, která kostka se přehodila a z jaké hodnoty na jakou | P2 | otevřená | |
| FEAT-012 | Game / Overlay | Overlay ohniska: zobrazit získání vítězného bodu z ohniska | P2 | otevřená | |
| FEAT-013 | Game / Overlay | Overlay souboje: zobrazit opotřebení kostek, přehození a případné vítězné body | P2 | otevřená | |
| FEAT-014 | Game | Animace pro pohyb, souboj a přechody stavů | P3 | otevřená | |

---

## Perzistence

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-015 | App | Zachovat rozehranou hru při zavření prohlížeče a refreshi stránky (localStorage nebo podobně) | P2 | otevřená | |

---

## Debugovací nástroje

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-016 | Dev / Debug | Debug overlay: možnost zaevidovat bug přímo ze hry (zachytit stav desky, akci, popis) | P3 | otevřená | |
| FEAT-017 | Dev / Debug | Zpět: možnost vrátit libovolný počet tahů během hry (užitečné pro reprodukci bugů) | P3 | otevřená | |
| FEAT-018 | Dev / Debug | Záznamník stavu desky: vybrat kostky/věže, zaznamenat jejich pozice a popsat, která akce způsobuje bug | P3 | otevřená | |

---

## AI / Vývojový workflow

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-019 | Dev / AI | Claude nikdy nedělá commity automaticky — vždy se musí zeptat | P2 | otevřená | Zaznamenáno v paměti; formalizovat jako pravidlo v CLAUDE.md |
| FEAT-020 | Dev / AI | Načíst celá herní pravidla do paměti Claude, aby je mohl referencovat přímo bez čtení PDF | P3 | otevřená | |
| FEAT-021 | Dev / AI | Vytvořit znalostní bázi pro technologická rozhodnutí a vzory projektu, aby je Claude mohl referencovat | P4 | otevřená | |
| FEAT-022 | Dev / AI | Session paměť per větev: Claude ukládá a obnovuje kontext při přepínání git větví | P4 | otevřená | |

---

## Tutorial

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-023 | Tutorial | Přehlednější tutorial: komentovaná hra proti botovi nebo naskriptované situace | P90 | otevřená | |

---

## Architektura / Přeformátování

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-024 | App / Architektura | Celkové přeformátování: přesunout herní logiku z UI komponent; zvolit a zavést čistou architekturu (Context API nebo jiná) | P90 | otevřená | UI komponenty v současnosti obsahují velké množství herní logiky |

---

## Audio

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-025 | App / Audio | Zvuky pro herní události (pohyb, souboj, body atd.) | P90 | otevřená | |
| FEAT-026 | App / Audio | Hudba na pozadí | P90 | otevřená | |

---

## Statistiky

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-027 | App / Statistiky | Osobní statistika hráče (výhry, prohry atd.) | P90 | otevřená | |

---

## Zobecňování

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| FEAT-028 | App / Config | Zobecnění map: definovat mapy v JSON formátu | P90 | otevřená | |
| FEAT-029 | App / Config | Zobecnění win condition: konfigurovatelný počet vítězných bodů nebo alternativní podmínky výhry (např. zabij krále) | P90 | otevřená | |
| FEAT-030 | App / Config | Zobecnění hráčů: definovat hráče v JSON formátu | P90 | otevřená | |

---

## Hotové

| ID | Komponenta | Popis | Priorita | Stav | Poznámky |
|----|------------|-------|----------|------|----------|
| — | — | — | — | — | — |