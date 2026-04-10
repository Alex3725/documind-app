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

# Categorie di classificazione supportate
CLASSIFICATION_TYPES = [
    "Invoice",
    "Receipt",
    "Contract",
    "Resume",
    "Personal Document",
    "Legal Document",
    "Poetry",
    "Literature",
    "Code",
    "Spreadsheet",
    "Presentation",
    "Report",
    "Email",
    "Financial Document",
    "Medical Document",
    "Technical Document",
    "Other"
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


def _ollama_model_names(tags_payload: dict) -> set[str]:
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
# CLASSIFICAZIONE AI CON OLLAMA
# =====================================================

def call_ollama_classify(text: str, filename: str) -> dict:
    """
    Chiama Ollama per classificazione multi-label con confidence scores.
    Restituisce lista di {type, confidence} ordinata per confidenza decrescente.
    """
    ensure_ollama_model_available()
    types_list = ", ".join(CLASSIFICATION_TYPES)

    prompt = f"""You are a document classification expert. Analyze the following document and classify it.

Document filename: {filename}

Document content:
```
{text}
```

Your task:
1. Assign a confidence score (0.0 to 1.0) to EACH of these document types: {types_list}
2. A document can belong to multiple types (multi-label classification)
3. Be precise: only give high scores (>0.5) when truly confident
4. Scores must reflect real content analysis, not guesses

Also extract:
- "tipo_documento": primary document type in Italian (fattura, contratto, lettera, ricevuta, curriculum, documento_personale, altro)
- "data_documento": date if present (ISO format or null)
- "soggetti_coinvolti": list of people/companies mentioned (or empty list)
- "descrizione_breve": 1-2 sentence summary in Italian

Respond ONLY with valid JSON in this exact format:
{{
  "classifications": [
    {{"type": "Invoice", "confidence": 0.0}},
    {{"type": "Receipt", "confidence": 0.0}},
    {{"type": "Contract", "confidence": 0.0}},
    {{"type": "Resume", "confidence": 0.0}},
    {{"type": "Personal Document", "confidence": 0.0}},
    {{"type": "Legal Document", "confidence": 0.0}},
    {{"type": "Poetry", "confidence": 0.0}},
    {{"type": "Literature", "confidence": 0.0}},
    {{"type": "Code", "confidence": 0.0}},
    {{"type": "Spreadsheet", "confidence": 0.0}},
    {{"type": "Presentation", "confidence": 0.0}},
    {{"type": "Report", "confidence": 0.0}},
    {{"type": "Email", "confidence": 0.0}},
    {{"type": "Financial Document", "confidence": 0.0}},
    {{"type": "Medical Document", "confidence": 0.0}},
    {{"type": "Technical Document", "confidence": 0.0}},
    {{"type": "Other", "confidence": 0.0}}
  ],
  "tipo_documento": "string or null",
  "data_documento": "string or null",
  "soggetti_coinvolti": [],
  "descrizione_breve": "string"
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

    # Normalizza e ordina per confidenza
    classifications = raw.get("classifications", [])
    for c in classifications:
        c["confidence"] = max(0.0, min(1.0, float(c.get("confidence", 0.0))))
    classifications.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "classifications": classifications,
        "tipo_documento": raw.get("tipo_documento"),
        "data_documento": raw.get("data_documento"),
        "soggetti_coinvolti": raw.get("soggetti_coinvolti", []),
        "descrizione_breve": raw.get("descrizione_breve", "")
    }


def call_ollama_extract(text: str) -> dict:
    """Estrae metadati strutturati dal documento (compatibilità con vecchio endpoint)."""
    ensure_ollama_model_available()
    prompt = f"""
Analizza il seguente documento.
Estrai SOLO se presenti le seguenti informazioni:
- tipo_documento (fattura, contratto, lettera, ricevuta, altro)
- data_documento
- data_scadenza
- soggetti_coinvolti (persone o aziende)
- descrizione_breve

IMPORTI:
Se presenti, restituisci un JSON con:
"importi": {{
    "totale": numero o null,
    "imponibile": numero o null,
    "iva": numero o null,
    "altri": [{{"descrizione": stringa,"valore": numero,"valuta": stringa}}]
}}
- Usa SOLO numeri
- Se un campo non è presente usa null
- NON inventare valori

Rispondi ESCLUSIVAMENTE con JSON valido.
Documento:
```
{text}
```
"""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "format": "json",
        "stream": False
    }
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json=payload,
        timeout=OLLAMA_TIMEOUT
    )
    response.raise_for_status()
    data = response.json()
    return json.loads(data.get("response", "{}"))


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

        result = call_ollama_extract(text)

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
        "extracted_data": result
    })


@app.route("/api/classify", methods=["POST"])
def classify_file():
    """
    Endpoint principale: classifica il documento con multi-label e confidence scores.
    Usato da Spring Boot.
    
    Response format:
    {
        "file_id": "uuid",
        "filename": "example.pdf",
        "classifications": [
            {"type": "Invoice", "confidence": 0.85},
            ...
        ],
        "extracted_text": "...",
        "metadata": {...},
        "extracted_data": {...}
    }
    """
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "File mancante"}), 400

    filename = file.filename or "unknown"
    tmp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{filename}")

    try:
        file.save(tmp_path)
        raw_text = extract_text_from_any(tmp_path)
        text = normalize_text(raw_text)

        if not text:
            return jsonify({"error": "Testo vuoto o non estraibile"}), 400

        metadata = extract_metadata(tmp_path, filename)
        ai_result = call_ollama_classify(text, filename)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except requests.RequestException as re:
        return jsonify({"error": f"Errore Ollama: {format_ollama_error(re)}"}), 503
    except Exception as e:
        return jsonify({"error": f"Errore interno: {str(e)}"}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    file_id = str(uuid.uuid4())

    return jsonify({
        "file_id": file_id,
        "filename": filename,
        "classifications": ai_result["classifications"],
        "extracted_text": text[:2000],  # primi 2000 chars per debug
        "metadata": metadata,
        "extracted_data": {
            "tipo_documento": ai_result.get("tipo_documento"),
            "data_documento": ai_result.get("data_documento"),
            "soggetti_coinvolti": ai_result.get("soggetti_coinvolti", []),
            "descrizione_breve": ai_result.get("descrizione_breve", "")
        }
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
        "classification_types": CLASSIFICATION_TYPES
    })


# =====================================================
# AVVIO SERVER
# =====================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"DocuMind Python AI Backend avviato su porta {port}")
    print(f"Ollama: {OLLAMA_BASE_URL} | Modello: {OLLAMA_MODEL}")
    app.run(host="0.0.0.0", port=port, debug=debug)
