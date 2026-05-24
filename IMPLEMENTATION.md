# DocuMind - Implementation Notes

## Obiettivo

Rifare la UI in stile chiaro e modulare, con componenti a slot, path in stile GitHub e una vista centrale fatta di righe riusabili per file e cartelle.

In parallelo, rendere effettiva lato server la logica cartella/tag: quando una cartella contiene descrizione semantica e tag automatici, il backend deve poter assegnare in modo coerente la cartella e il tag primario ai file che combaciano con quella descrizione.

## Cosa è stato implementato

### Frontend dashboard

- La dashboard è stata riorganizzata in una griglia a tre slot: colonna sinistra, area centrale e rail destro.
- È stata introdotta una path bar in stile GitHub, mostrata come componente separato.
- È stato aggiunto un preview slot scuro per rappresentare l’area immagine/contenuto con contrasto forte rispetto al resto della UI.
- I pannelli principali sono stati portati a un linguaggio visivo chiaro e neutro, con card bianche o quasi bianche al posto dei blocchi saturi.

### Componenti riusabili creati

- `WorkspacePathBar` per mostrare branch/path e metadati del workspace.
- `WorkspacePreviewCard` per il blocco scuro di preview/immagine.
- La configurazione rapida delle cartelle è stata allineata al nuovo comportamento semantico.

### Creazione cartelle e tag

- Nella UI di creazione cartella è stato aggiunto uno switch per usare il nome cartella come tag.
- Se lo switch è disattivato, si può usare un tag personalizzato insieme alla descrizione semantica.
- Il payload inviato al backend ora include:
  - `semanticRules`
  - `autoUpdateType`
  - `autoTags`

### Backend classificazione

- Il servizio di classificazione applica adesso un matching server-side sui folder dell’utente.
- Il matching usa:
  - nome cartella
  - full path
  - descrizione
  - semantic rules
  - auto tags
  - testo estratto e tag già presenti nel risultato AI
- Quando il match è sufficientemente forte, il backend:
  - aggiorna la `suggestedFolder`
  - aggiunge il tag primario della cartella ai tag del file
  - rende persistibile quella scelta nel flusso di salvataggio file

## File toccati

- `frontend-documind/app/dashboard/page.tsx`
- `frontend-documind/app/dashboard/layout.tsx`
- `frontend-documind/app/globals.css`
- `frontend-documind/lib/components/dashboard/TopUtilityBar.tsx`
- `frontend-documind/lib/components/dashboard/SearchStrip.tsx`
- `frontend-documind/lib/components/dashboard/MemoryCircleCard.tsx`
- `frontend-documind/lib/components/dashboard/FoldersBoard.tsx`
- `frontend-documind/lib/components/dashboard/QuickActionsPanel.tsx`
- `frontend-documind/lib/components/dashboard/WorkspacePathBar.tsx`
- `frontend-documind/lib/components/dashboard/WorkspacePreviewCard.tsx`
- `frontend-documind/app/tags/page.tsx`
- `springboot-documind/src/main/java/com/example/documind/entities/classifications/ClassificationService.java`

## Decisioni di design

- La UI deve rimanere chiara e leggibile, con un solo blocco scuro dove serve contrasto visivo.
- La path è un elemento strutturale, non decorativo.
- Le cartelle sono tipi semantici, quindi la logica di tag deve essere persistita e usabile dal server.
- La vista centrale deve poter essere estesa a componenti file/cartella separati, senza bloccare i flussi esistenti.

## Verifiche da eseguire

1. Compilazione backend Spring Boot.
2. Verifica frontend con TypeScript/lint o controllo errori editor.
3. Controllo manuale della dashboard per confermare:
   - path visibile
   - slot chiari
   - preview scuro
   - switch cartella/tag funzionante
4. Test del flusso classificazione per verificare che il backend assegni davvero la cartella e il tag primario quando il documento combacia con la descrizione.

## Note

- Il backend non è stato reimpostato: la modifica è stata fatta in modo incrementale sopra la logica esistente.
- La logica di matching è volutamente conservativa: assegna la cartella solo quando il punteggio supera una soglia minima, per evitare falsi positivi.