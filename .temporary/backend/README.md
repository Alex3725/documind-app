# Esempio di Backend con Python, Flask e Ollama

Questo progetto è un'applicazione backend creata con Python e il framework Flask. Fornisce un'API RESTful che può essere interrogata da un'applicazione frontend per analizzare file di testo o di codice utilizzando un modello linguistico (LLM) tramite [Ollama](https://ollama.com/).

## Spiegazione Passo-Passo

### 1. Obiettivo
L'obiettivo è creare un servizio che:
1. Riceva una richiesta da un client (il frontend) con il percorso di un file.
2. Legga il contenuto di quel file sul server.
3. Prepari una richiesta (prompt) per un modello Ollama, istruendolo a estrarre informazioni specifiche.
4. Invii il contenuto del file e il prompt a Ollama.
5. Riceva la risposta da Ollama, che è strutturata in formato JSON.
6. Invii questo JSON come risposta al client.

### 2. Prerequisiti
Prima di iniziare, assicurati di avere installato:
- **Python** (versione 3.8 o successiva).
- **Pip** (il gestore di pacchetti di Python).
- **Ollama**: Segui la [guida ufficiale](https://ollama.com/download) per installarlo sul tuo sistema operativo.
- **Un modello Ollama**: Dopo aver installato Ollama, scarica un modello. Questo esempio usa `llama3`. Esegui questo comando nel tuo terminale:
  ```bash
  ollama pull llama3
  ```

### 3. Struttura dei File
Il progetto `backend` è così organizzato:

- **`app.py`**: Il file principale dell'applicazione. Contiene il codice del server web Flask, la logica dell'API e l'interazione con Ollama.
- **`requirements.txt`**: Elenca tutte le librerie Python necessarie per far funzionare il progetto. Pip le userà per installarle.
- **`.env`**: Un file di configurazione per memorizzare variabili "segrete" o che cambiano in base all'ambiente, come l'indirizzo del server Ollama. Questo permette di non scrivere indirizzi e modelli direttamente nel codice.
- **`README.md`**: Questo file, con la guida e le spiegazioni.

### 4. Installazione
Per installare le dipendenze, apri un terminale nella cartella `backend` ed esegui:
```bash
pip install -r requirements.txt
```
Questo comando legge il file `requirements.txt` e installa le versioni corrette di `Flask`, `requests`, `python-dotenv` e `Flask-Cors`.

### 5. Esecuzione del Server
Una volta installate le dipendenze, avvia il server web con il seguente comando (sempre dalla cartella `backend`):
```bash
python app.py
```
Se tutto va bene, vedrai un output simile a questo, che indica che il server è in ascolto sulla porta 5001:
```
 * Running on http://127.0.0.1:5001
 * Running on http://<tua_ip_locale>:5001
```

### 6. Come Funziona il Codice (`app.py`)

1.  **Importazioni e Setup**: Vengono importate le librerie necessarie. `load_dotenv()` carica la configurazione dal file `.env`, e `app = Flask(__name__)` crea l'istanza del server. `CORS(app)` è fondamentale per permettere al frontend (che gira su un'altra porta) di fare richieste a questo server.

2.  **Configurazione Ollama**: Il codice legge `OLLAMA_BASE_URL` e `OLLAMA_MODEL` dal file `.env`. Questo rende facile cambiare modello o indirizzo senza modificare il codice.

3.  **Endpoint `/api/analyze-file`**:
    - `@app.route(...)`: Definisce una rotta API all'indirizzo `/api/analyze-file` che accetta solo richieste `POST`.
    - `request.get_json()`: Estrae il corpo della richiesta, che ci aspettiamo sia un JSON (es. `{"file_path": "..."}`).
    - **Lettura sicura del file**: Per sicurezza, il percorso del file ricevuto viene controllato per evitare che si possa accedere a file fuori dalla directory del progetto (prevenendo attacchi di tipo *Path Traversal*).
    - **Creazione del Prompt**: Questa è la parte più importante. Creiamo un'istruzione testuale per l'LLM. Gli diciamo di agire come un analista e di estrarre dati specifici, **restituendo solo un oggetto JSON**. Questo è un esempio di *Prompt Engineering*. L'opzione `format: "json"` nella richiesta a Ollama aiuta a garantire che l'output sia un JSON valido.
    - **Chiamata a Ollama**: Usando la libreria `requests`, viene inviata una richiesta `POST` all'endpoint `/api/generate` di Ollama, con il modello, il prompt e il contenuto del file.
    - **Elaborazione della Risposta**: La risposta di Ollama è un JSON che contiene una chiave `"response"`. Il valore di questa chiave è una **stringa** che contiene il JSON che abbiamo chiesto. Il codice estrae questa stringa e la converte in un vero oggetto JSON (`json.loads()`).
    - **Risposta al Frontend**: Infine, l'oggetto JSON estratto viene inviato come risposta al frontend.

### 7. Come Testare l'API
Puoi testare l'API da un terminale (mentre il server Python è in esecuzione) usando un comando come `curl`.

Questo esempio chiede di analizzare il file `svelte.config.js` che si trova nella cartella `frontend`.

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{\"file_path\": \"frontend/svelte.config.js\"}" \
  http://localhost:5001/api/analyze-file
```

**Risultato Atteso (esempio):**
```json
{
  "extracted_data": {
    "functions": [
      "config"
    ],
    "libraries": [
      "@sveltejs/adapter-auto",
      "@sveltejs/kit/vite"
    ],
    "purpose": "This file is the configuration for a SvelteKit project. It defines the preprocessor, Vite plugins, and Kit-specific settings like the adapter."
  }
}
```
---
Questo backend è ora pronto per essere integrato con la tua applicazione frontend SvelteKit.
