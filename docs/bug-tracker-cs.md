# Sledování chyb

## Formát

| ID | Komponenta | Popis | Priorita | Stav | Řešení |
|----|------------|-------|----------|------|--------|
| — | — | — | — | — | — |

**Priorita:** `P1` kritická · `P2` vysoká · `P3` střední · `P4` nízká  
**Stav:** `otevřená` · `řeší se` · `vyřešená` · `neřeší se`

---

## Otevřené chyby

| ID | Komponenta | Popis | Priorita | Stav | Řešení |
|----|------------|-------|----------|------|--------|
| BUG-001 | Game / PlayerHUD | Erby se zobrazují na špatných stranách — skóre červeného hráče se ukazuje na modrém erbu | P2 | otevřená | — |
| BUG-002 | Game / PlayerHUD | Indikátor aktivního hráče a přičítání bodů jsou prohozené — když hraje červený, na modrém erbu svítí aktivní stav a body dostává modrý; modrý hráč vyhrává body nasbíranými červeným | P1 | otevřená | — |
| BUG-003 | game / combat | Hráč může zaútočit na nepřátelskou kostku nebo věž se stejnou nebo vyšší silou útoku — útok by měl být povolen pouze pokud útočníkova síla striktně převyšuje obranu | P1 | otevřená | — |
| BUG-004 | Board / FocalPointMarker | Indikátor aktivního ohniska není vidět, když je na ohnisku umístěna kostka — značka aktivního ohniska by měla být vždy viditelná nad každou kostkou | P2 | otevřená | — |
| BUG-005 | game / combat | Po zvolení posunutí se útočící kostka nepohne na napadené pole — po odsunutí nepřítele by se útočník měl přesunout na uvolněné pole | P1 | otevřená | — |
| BUG-006 | hex / boardDefinition | Krajní ohniska jsou umístěna příliš blízko středu — každé by mělo být 2 pole od středového ohniska v horizontální řadě | P2 | otevřená | — |

---

## Vyřešené chyby

| ID | Komponenta | Popis | Priorita | Stav | Řešení |
|----|------------|-------|----------|------|--------|
| — | — | — | — | — | — |
