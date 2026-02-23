import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from docx import Document
import tempfile

# =====================================================
# CONFIGURAZIONE INIZIALE
# =====================================================

# Carica variabili d'ambiente dal file .env
load_dotenv()

# Inizializza Flask
app = Flask(__name__)

# Limite massimo file upload (200MB)
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024

# Cartella temporanea dove salvare file caricati
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "C:/Users/Alexp/Desktop/innovation-week-project-informatica/upload")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Abilita CORS (per Svelte o altri frontend)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS(app, origins=[FRONTEND_URL])

# Configurazione Ollama
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", 300))
ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx"}

# =====================================================
# FUNZIONI DI SUPPORTO
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
    if path.lower().endswith(".pdf"):
        return extract_text_from_pdf(path)
    elif path.lower().endswith(".docx"):
        return extract_text_from_docx(path)
    else:
        return extract_text_from_txt(path)


def call_ollama(text: str) -> dict:
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
    # Verifica file
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "File mancante"}), 400

    # Salva temporaneamente il file nella cartella upload
    try:
        tmp_path = os.path.join(UPLOAD_DIR, file.filename)
        file.save(tmp_path)

        raw_text = extract_text_from_any(tmp_path)
        text = normalize_text(raw_text)

        if not text:
            return jsonify({"error": "Testo vuoto"}), 400

        result = call_ollama(text)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except requests.RequestException as re:
        return jsonify({"error": f"Errore Ollama: {str(re)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Errore interno: {str(e)}"}), 500
    finally:
        # Rimuove il file temporaneo dopo l'elaborazione
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return jsonify({
        "filename": file.filename,
        "extracted_data": result
    })

# =====================================================
# AVVIO SERVER
# =====================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5001)), debug=False)