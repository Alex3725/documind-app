import os
import json
import uuid
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from docx import Document

# =====================================================
# CONFIGURAZIONE INIZIALE
# =====================================================

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/documind_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
CORS(app, origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:8080"])

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", 300))

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx", ".md", ".csv", ".html"}

TAG_NAME_ALIASES = {
    "contraetto": "contratto",
    "contratti": "contratto",
    "cv": "curriculum",
    "documento identita": "documento_identita",
    "documento di identita": "documento_identita",
    "id document": "documento_identita",
    "source code": "codice_sorgente",
    "code": "codice_sorgente",
    "spreadsheet": "foglio_calcolo",
    "payslip": "busta_paga",
    "medical report": "documento_medico",
    "medical prescription": "ricetta_medica",
}

KEYWORD_FALLBACK_RULES = {
    "fattura": ["fattura", "invoice", "partita iva", "imponibile", "totale", "iva"],
    "ricevuta": ["ricevuta", "scontrino", "pagamento ricevuto", "importo pagato"],
    "contratto": ["contratto", "accordo", "clausola", "firmato", "parti"],
    "curriculum": ["curriculum", "cv", "esperienza", "competenze", "formazione"],
    "documento_identita": ["carta d'identita", "passaporto", "patente", "codice fiscale"],
    "documento_legale": ["tribunale", "sentenza", "ordinanza", "atto notarile"],
    "poesia": ["poesia", "verso", "strofa", "rima"],
    "narrativa": ["romanzo", "racconto", "capitolo", "personaggio"],
    "codice_sorgente": ["class ", "function", "import ", "public static", "def "],
    "foglio_calcolo": ["csv", "colonna", "riga", "foglio", "tabella"],
    "presentazione": ["slide", "presentazione", "agenda", "speaker notes"],
    "relazione": ["relazione", "report", "analisi", "conclusioni"],
    "email": ["oggetto:", "mittente:", "destinatario:", "inviato:"],
    "documento_medico": ["referto", "diagnosi", "paziente", "esame"],
    "documento_tecnico": ["specifiche", "architettura", "api", "manuale"],
    "verbale": ["verbale", "riunione", "ordine del giorno", "presenti"],
    "busta_paga": ["busta paga", "retribuzione", "cedolino", "stipendio"],
    "ricetta_medica": ["ricetta", "prescrizione", "farmaco", "dosaggio"],
}

# =====================================================
# TAG DI DEFAULT DEL SISTEMA
# =====================================================

DEFAULT_TAGS = [
    {
        "name": "fattura",
        "description": "Documento che attesta un'operazione commerciale con importo dovuto, numero fattura, partita IVA e dati del fornitore/cliente",
        "category": "finance"
    },
    {
        "name": "ricevuta",
        "description": "Documento che certifica la ricezione di un pagamento o merce, più semplice di una fattura",
        "category": "finance"
    },
    {
        "name": "contratto",
        "description": "Accordo legale tra due o più parti che stabilisce obblighi, diritti e condizioni",
        "category": "legal"
    },
    {
        "name": "curriculum",
        "description": "Documento personale che riassume l'esperienza lavorativa, la formazione e le competenze di una persona",
        "category": "hr"
    },
    {
        "name": "documento_identita",
        "description": "Documento ufficiale che certifica l'identità di una persona (carta d'identità, passaporto, patente)",
        "category": "personal"
    },
    {
        "name": "documento_legale",
        "description": "Atto notarile, sentenza, ordinanza o qualsiasi documento con valenza giuridica",
        "category": "legal"
    },
    {
        "name": "poesia",
        "description": "Componimento letterario in versi, con struttura ritmica o metrica",
        "category": "literature"
    },
    {
        "name": "narrativa",
        "description": "Opera letteraria in prosa: romanzo, racconto, novella",
        "category": "literature"
    },
    {
        "name": "codice_sorgente",
        "description": "File contenente istruzioni di programmazione in qualsiasi linguaggio (Python, Java, JS, ecc.)",
        "category": "tech"
    },
    {
        "name": "foglio_calcolo",
        "description": "Documento con dati tabellari, formule, grafici (Excel, CSV, ecc.)",
        "category": "data"
    },
    {
        "name": "presentazione",
        "description": "Documento con slide per presentazioni (PowerPoint, Keynote, ecc.)",
        "category": "business"
    },
    {
        "name": "relazione",
        "description": "Documento descrittivo che analizza un argomento, un progetto o un'attività",
        "category": "business"
    },
    {
        "name": "email",
        "description": "Messaggio di posta elettronica, con mittente, destinatario e oggetto",
        "category": "communication"
    },
    {
        "name": "documento_medico",
        "description": "Referto, prescrizione, cartella clinica, certificato medico",
        "category": "health"
    },
    {
        "name": "documento_tecnico",
        "description": "Manuale tecnico, specifiche di progetto, documentazione di sistema",
        "category": "tech"
    },
    {
        "name": "verbale",
        "description": "Resoconto scritto di una riunione, assemblea o seduta",
        "category": "business"
    },
    {
        "name": "busta_paga",
        "description": "Documento che attesta la retribuzione mensile di un lavoratore dipendente",
        "category": "finance"
    },
    {
        "name": "ricetta_medica",
        "description": "Prescrizione medica per farmaci o esami diagnostici",
        "category": "health"
    },
]

# =====================================================
# FUNZIONI DI SUPPORTO - ESTRAZIONE TESTO
# =====================================================

def allowed_file(filename: str) -> bool:
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)


def normalize_text(text: str, max_chars: int = 12000) -> str:
    return text.strip()[:max_chars]


def extract_text_from_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def extract_text_from_pdf(path: str) -> str:
    reader = PdfReader(path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract_text_from_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text_from_any(path: str) -> str:
    if not allowed_file(path):
        raise ValueError("Tipo file non consentito")
    ext = os.path.splitext(path.lower())[1]
    if ext == ".pdf":
        return extract_text_from_pdf(path)
    elif ext == ".docx":
        return extract_text_from_docx(path)
    else:
        return extract_text_from_txt(path)


def extract_metadata(path: str, filename: str) -> dict:
    stat = os.stat(path)
    ext = os.path.splitext(filename.lower())[1]
    return {
        "filename": filename,
        "extension": ext,
        "size_bytes": stat.st_size,
        "mime_type": guess_mime(ext)
    }


def guess_mime(ext: str) -> str:
    mime_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
        ".md": "text/markdown",
        ".csv": "text/csv",
        ".html": "text/html",
    }
    return mime_map.get(ext, "application/octet-stream")


# =====================================================
# GESTIONE MODELLO OLLAMA
# =====================================================

def _ollama_model_names(tags_payload: dict) -> set:
    model_names = set()
    for entry in tags_payload.get("models", []):
        model_name = entry.get("model") or entry.get("name")
        if not model_name:
            continue
        model_names.add(model_name)
        model_names.add(model_name.split(":", 1)[0])
    return model_names


def is_ollama_model_available() -> bool:
    response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
    response.raise_for_status()
    try:
        available_models = _ollama_model_names(response.json())
    except ValueError as exc:
        raise requests.RequestException("Risposta non valida dall'endpoint tags di Ollama.") from exc
    return OLLAMA_MODEL in available_models or OLLAMA_MODEL.split(":", 1)[0] in available_models


def ensure_ollama_model_available() -> None:
    if is_ollama_model_available():
        return
    pull_response = requests.post(
        f"{OLLAMA_BASE_URL}/api/pull",
        json={"name": OLLAMA_MODEL, "stream": False},
        timeout=OLLAMA_TIMEOUT,
    )
    pull_response.raise_for_status()
    try:
        pull_payload = pull_response.json()
    except ValueError as exc:
        raise requests.RequestException("Risposta non valida durante il pull del modello Ollama.") from exc
    if pull_payload.get("error"):
        raise requests.RequestException(pull_payload["error"])


def format_ollama_error(error: requests.RequestException) -> str:
    response = getattr(error, "response", None)
    if response is None:
        return str(error)
    try:
        payload = response.json()
    except ValueError:
        payload = {}
    return payload.get("error") or payload.get("message") or response.text or str(error)


# =====================================================
# CORE AI: ANALISI CON TAG MULTI-LABEL + CONFIDENCE
# =====================================================

def build_tags_context(custom_tags: list = None) -> str:
    """Costruisce il contesto dei tag per il prompt AI."""
    all_tags = DEFAULT_TAGS.copy()
    if custom_tags:
        all_tags.extend(custom_tags)
    
    tags_desc = []
    for tag in all_tags:
        desc = f'- "{tag["name"]}": {tag["description"]}'
        if tag.get("category"):
            desc += f' [categoria: {tag["category"]}]'
        tags_desc.append(desc)
    
    return "\n".join(tags_desc)


def normalize_tag_name(tag_name: str) -> str:
    if not tag_name:
        return ""
    normalized = tag_name.strip().lower().replace("-", "_").replace(" ", "_")
    normalized = TAG_NAME_ALIASES.get(normalized, normalized)
    return TAG_NAME_ALIASES.get(normalized.replace("_", " "), normalized)


def extract_tag_scores_from_raw(raw: dict | list, known_tags: set) -> dict:
    scores = {}

    def push_score(name: str, confidence: float):
        normalized = normalize_tag_name(name)
        if normalized not in known_tags:
            return
        bounded = max(0.0, min(1.0, float(confidence or 0.0)))
        scores[normalized] = max(scores.get(normalized, 0.0), bounded)

    if isinstance(raw, dict):
        raw_scores = raw.get("tag_scores")
        if isinstance(raw_scores, dict):
            for name, conf in raw_scores.items():
                push_score(name, conf)

        raw_tags = raw.get("tags")
        if isinstance(raw_tags, list):
            for item in raw_tags:
                if isinstance(item, dict):
                    push_score(item.get("name", ""), item.get("confidence", 0.0))
                elif isinstance(item, str):
                    push_score(item, 0.65)

        primary = raw.get("primary_tags")
        if isinstance(primary, list):
            for item in primary:
                if isinstance(item, str):
                    push_score(item, 0.7)

    elif isinstance(raw, list):
        for item in raw:
            if not isinstance(item, dict):
                continue
            tags = item.get("tags")
            conf = item.get("confidence", 0.0)
            if isinstance(tags, list):
                for t in tags:
                    if isinstance(t, str):
                        push_score(t, conf)

    return scores


def keyword_fallback_scores(text: str, known_tags: set) -> dict:
    lower_text = text.lower()
    fallback = {}
    for tag_name, keywords in KEYWORD_FALLBACK_RULES.items():
        if tag_name not in known_tags:
            continue
        hits = sum(1 for keyword in keywords if keyword in lower_text)
        if hits <= 0:
            continue
        # 1 keyword -> 0.56, 2 -> 0.67, 3+ -> 0.78
        fallback[tag_name] = min(0.78, 0.45 + (hits * 0.11))
    return fallback


def call_ollama_tag_analysis(text: str, filename: str, custom_tags: list = None) -> dict:
    """
    Analisi AI che restituisce TAG MULTIPLI con confidence score.
    Ogni file può avere più tag, le percentuali NON sommano a 100%.
    """
    ensure_ollama_model_available()
    
    tags_context = build_tags_context(custom_tags)
    tag_names = [t["name"] for t in DEFAULT_TAGS]
    if custom_tags:
        tag_names.extend([t["name"] for t in custom_tags])
    
    tags_json_template = "{" + ", ".join([f'"{name}": 0.0' for name in tag_names]) + "}"

    prompt = f"""Sei un esperto classificatore di documenti. Analizza questo documento e assegna un punteggio di confidenza (0.0 a 1.0) a OGNI tag elencato.

IMPORTANTE:
- Ogni tag è INDIPENDENTE: le percentuali NON devono sommare a 100%
- Un documento PUÒ avere più tag con alta confidenza contemporaneamente
- Assegna punteggi alti (>0.7) SOLO quando sei molto sicuro
- Un documento può essere sia "fattura" (0.95) che "documento_legale" (0.60) allo stesso tempo

FILE: {filename}

TAG DISPONIBILI (con descrizione):
{tags_context}

DOCUMENTO:
```
{text[:6000]}
```

Rispondi SOLO con JSON valido in questo formato esatto:
{{
  "tag_scores": {tags_json_template},
  "primary_tags": ["tag1", "tag2"],
  "summary": "breve descrizione del documento in italiano (max 100 parole)",
  "extracted_data": {{
    "data_documento": null,
    "soggetti_coinvolti": [],
    "importo_totale": null,
    "note": ""
  }}
}}"""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.1,
            "top_p": 0.9
        }
    }

    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json=payload,
        timeout=OLLAMA_TIMEOUT
    )
    response.raise_for_status()
    data = response.json()
    raw = json.loads(data.get("response", "{}"))

    known_tags = set(tag_names)
    tag_scores = extract_tag_scores_from_raw(raw, known_tags)
    if not tag_scores:
        tag_scores = keyword_fallback_scores(text, known_tags)

    # Costruisce lista tag con confidence > 0.05 (filtra rumore)
    tags_with_confidence = []
    
    for tag_name, confidence in tag_scores.items():
        confidence = max(0.0, min(1.0, float(confidence or 0.0)))
        if confidence > 0.05:
            # Trova info tag
            tag_info = next((t for t in DEFAULT_TAGS if t["name"] == tag_name), None)
            if not tag_info and custom_tags:
                tag_info = next((t for t in custom_tags if t["name"] == tag_name), None)
            
            tags_with_confidence.append({
                "name": tag_name,
                "confidence": round(confidence, 4),
                "description": tag_info["description"] if tag_info else "",
                "category": tag_info.get("category", "other") if tag_info else "other",
                "is_default": tag_info in DEFAULT_TAGS if tag_info else True
            })
    
    # Ordina per confidenza decrescente
    tags_with_confidence.sort(key=lambda x: x["confidence"], reverse=True)
    
    summary = raw.get("summary", "") if isinstance(raw, dict) else ""
    if not summary and tags_with_confidence:
        top = tags_with_confidence[0]
        summary = f"Documento classificato principalmente come '{top['name']}'."

    extracted_data = raw.get("extracted_data", {}) if isinstance(raw, dict) else {}

    return {
        "tags": tags_with_confidence,
        "primary_tags": [t["name"] for t in tags_with_confidence[:3]],
        "summary": summary,
        "extracted_data": extracted_data
    }


# =====================================================
# ENDPOINT API
# =====================================================

@app.route("/api/analyze", methods=["POST"])
def analyze_file():
    """
    Endpoint legacy: estrae dati strutturati dal documento.
    Compatibile con il frontend Svelte esistente.
    """
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "File mancante"}), 400

    tmp_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        file.save(tmp_path)
        raw_text = extract_text_from_any(tmp_path)
        text = normalize_text(raw_text)

        if not text:
            return jsonify({"error": "Testo vuoto o non estraibile"}), 400

        # Usa il nuovo sistema di tag
        result = call_ollama_tag_analysis(text, file.filename)
        
        # Compatibilità con vecchio formato
        extracted = result.get("extracted_data", {})
        extracted["tipo_documento"] = result["primary_tags"][0] if result["primary_tags"] else "altro"
        extracted["descrizione_breve"] = result.get("summary", "")

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except requests.RequestException as re:
        return jsonify({"error": f"Errore Ollama: {format_ollama_error(re)}"}), 503
    except Exception as e:
        return jsonify({"error": f"Errore interno: {str(e)}"}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return jsonify({
        "filename": file.filename,
        "extracted_data": extracted
    })


@app.route("/api/classify", methods=["POST"])
def classify_file():
    """
    Endpoint principale: classifica il documento con tag MULTI-LABEL e confidence scores.
    
    Input: multipart/form-data con:
        - file: il documento da analizzare
        - custom_tags (opzionale): JSON array di tag custom dell'utente
    
    Response format:
    {
        "file_id": "uuid",
        "filename": "example.pdf",
        "tags": [
            {"name": "fattura", "confidence": 0.92, "description": "...", "category": "finance"},
            {"name": "documento_legale", "confidence": 0.45, "description": "...", "category": "legal"},
            ...
        ],
        "primary_tags": ["fattura"],
        "summary": "Descrizione del documento...",
        "extracted_data": {...},
        "metadata": {...}
    }
    """
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "File mancante", "code": "FILE_MISSING"}), 400

    filename = file.filename or "unknown"
    
    # Tag custom opzionali dell'utente
    custom_tags_raw = request.form.get("custom_tags")
    custom_tags = []
    if custom_tags_raw:
        try:
            custom_tags = json.loads(custom_tags_raw)
        except Exception:
            pass

    tmp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{filename}")

    try:
        file.save(tmp_path)
        raw_text = extract_text_from_any(tmp_path)
        text = normalize_text(raw_text)

        if not text:
            return jsonify({
                "error": "Testo vuoto o non estraibile dal file",
                "code": "EMPTY_TEXT"
            }), 400

        metadata = extract_metadata(tmp_path, filename)
        ai_result = call_ollama_tag_analysis(text, filename, custom_tags)

    except ValueError as ve:
        return jsonify({"error": str(ve), "code": "FILE_NOT_SUPPORTED"}), 400
    except requests.RequestException as re:
        return jsonify({
            "error": f"Servizio AI non disponibile: {format_ollama_error(re)}",
            "code": "ANALYSIS_FAILED"
        }), 503
    except Exception as e:
        return jsonify({"error": f"Errore interno: {str(e)}", "code": "INTERNAL_ERROR"}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    file_id = str(uuid.uuid4())

    return jsonify({
        "file_id": file_id,
        "filename": filename,
        "tags": ai_result["tags"],
        "primary_tags": ai_result["primary_tags"],
        "summary": ai_result["summary"],
        "extracted_text": text[:2000],
        "metadata": metadata,
        "extracted_data": ai_result["extracted_data"]
    })


@app.route("/api/tags/default", methods=["GET"])
def get_default_tags():
    """Restituisce i tag di default del sistema."""
    return jsonify({
        "tags": DEFAULT_TAGS,
        "count": len(DEFAULT_TAGS)
    })


@app.route("/api/health", methods=["GET"])
def health_check():
    """Verifica stato del servizio e connessione Ollama."""
    ollama_ok = False
    model_ok = False
    try:
        r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        ollama_ok = r.status_code == 200
        if ollama_ok:
            model_ok = is_ollama_model_available()
    except Exception:
        pass

    return jsonify({
        "status": "ok",
        "ollama_connected": ollama_ok,
        "ollama_model_available": model_ok,
        "model": OLLAMA_MODEL,
        "default_tags_count": len(DEFAULT_TAGS),
        "supported_extensions": list(ALLOWED_EXTENSIONS)
    })


# =====================================================
# AVVIO SERVER
# =====================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"DocuMind Python AI Backend avviato su porta {port}")
    print(f"Ollama: {OLLAMA_BASE_URL} | Modello: {OLLAMA_MODEL}")
    print(f"Tag di default disponibili: {len(DEFAULT_TAGS)}")
    app.run(host="0.0.0.0", port=port, debug=debug)
