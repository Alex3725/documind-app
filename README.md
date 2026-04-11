# DocuMind — Sistema Intelligente di Classificazione Documenti

Sistema full-stack per la classificazione automatica di documenti tramite AI locale (Ollama).

---

## 🗂️ Struttura del progetto

```
documind/
├── backandpy-documind/      # Python AI Backend (Flask + Ollama)
├── springboot-documind/     # Spring Boot Backend (API + DB)
├── frontend-documind/       # Next.js Frontend
└── docker-compose.yml       # Deploy completo
```

---

## 🚀 Avvio rapido

### Prerequisiti
- Java 21+
- Python 3.11+
- Node.js 20+
- MariaDB (o Docker)
- [Ollama](https://ollama.com) installato con `qwen2.5:1.5b`

```bash
ollama pull qwen2.5:1.5b
```

---

### 1. Python AI Backend

```bash
cd backandpy-documind
pip install -r requirements.txt
python app.py
# → http://localhost:5001
```

**Endpoint principali:**
- `POST /api/classify` — classificazione multi-label con confidence scores
- `POST /api/analyze` — estrazione dati strutturati (legacy)
- `GET /api/health` — stato servizio

---

### 2. Spring Boot Backend

```bash
cd springboot-documind
./mvnw spring-boot:run
# → http://localhost:8080
```

**Configurazione** (`application-dev.properties`):
```properties
app.python.url=http://localhost:5001
spring.datasource.url=jdbc:mariadb://localhost:3306/documind_app
```

**Endpoint principali:**
- `POST /api/v1/classify/analyze` — analizza file (proxy → Python)
- `POST /api/v1/classify/confirm` — conferma classificazione incerta
- `POST /api/v1/user/in` — login
- `GET /api/v1/files` — lista file utente

**Credenziali di test (profilo dev):**
- Email: `test@documind.local`
- Password: `test123`

---

### 3. Next.js Frontend

```bash
cd frontend-documind
pnpm install   # oppure npm install
pnpm dev
# → http://localhost:3000
```

**Pagine:**
- `/` — Login
- `/dashboard` — Archivio documenti con upload, classificazione, filtri
- `/tags` — Gestione tag personalizzati

---

## 🔄 Flusso di classificazione

```
[Upload file] → Next.js → Spring Boot → Python AI (Ollama)
                                ↓
                    Confidence > 60%  →  CLASSIFIED (auto)
                    50-60%            →  CONFIRMATION_REQUIRED (popup)
                    < 50%             →  LOW_CONFIDENCE (Uncategorized)
                                ↓
                    Tags assegnati automaticamente
                    Cartella suggerita
```

---

## 🐳 Deploy con Docker

```bash
docker-compose up -d

# Prima dell'uso: scarica il modello Ollama nel container
docker exec documind_ollama ollama pull qwen2.5:1.5b
```

---

## 🧪 Test

### Python
```bash
cd backandpy-documind
curl -X POST -F "file=@documento.pdf" http://localhost:5001/api/classify
```

### Spring Boot
```bash
cd springboot-documind
./mvnw test
```

---

## 📋 Categorie di classificazione

| Tipo | Descrizione |
|------|-------------|
| Invoice | Fattura |
| Receipt | Ricevuta |
| Contract | Contratto |
| Resume | Curriculum vitae |
| Personal Document | Documento personale |
| Legal Document | Documento legale |
| Poetry | Poesia |
| Literature | Opera letteraria |
| Code | Codice sorgente |
| Spreadsheet | Foglio di calcolo |
| Report | Report/Relazione |
| Email | Email |
| Financial Document | Documento finanziario |
| Medical Document | Documento medico |
| Technical Document | Documento tecnico |

---

## ⚠️ Note importanti

- L'AI gira **localmente** tramite Ollama: nessun dato inviato a server esterni
- Il modello `qwen2.5:1.5b` richiede circa ~1-2GB RAM
- Le analisi pendenti (50-60% confidence) sono in memoria: riavviare Spring Boot le azzera
- In produzione, usare Redis per la cache delle analisi pendenti


## Implementazione

- persistenza file upload
- aggiorna file
- analisi con percentuale
- utente immagine upload anti expload 
- Persistenza tag custom nel DB (serve endpoint `/api/v1/tags` in Spring Boot)
- Upload file senza analisi con scelta cartella/tag nel frontend
- Sezione tag management collegata al backend
- Test unitari per il nuovo `ClassificationService`


