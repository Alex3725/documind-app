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

# =====================================================
# DEFINIZIONI GERARCHIA AI (3 LIVELLI)
# =====================================================

# Livello 1: Contesto
CONTEXTS = {
    "work": "Documenti di lavoro, professionali, aziendali: contratti, fatture, report, email di lavoro, presentazioni aziendali, codice sorgente, documentazione tecnica",
    "personal": "Documenti personali: carta d'identità, passaporto, ricevute personali, fotografie, note personali, messaggi privati",
    "study": "Documenti di studio o formazione: appunti, dispense, libri di testo, esercizi, relazioni scolastiche, tutorial",
    "leisure": "Contenuto di intrattenimento o tempo libero: libri, racconti, poesie, testi di canzoni, contenuti di giochi",
}

# Livello 2: Tipo di contenuto
CONTENT_TYPES = {
    "code": "Codice sorgente o script: Python, Java, JavaScript, HTML, CSS, shell script, file di configurazione, Makefile",
    "document": "Documento formale: fattura, contratto, ricevuta, relazione, verbale, atto, certificato, modulo",
    "notes": "Appunti, note, bozze, lista di cose da fare, memo, testo informale non strutturato",
    "media_metadata": "Descrizione o metadati di media: tracklist, crediti, descrizione di immagini, scheda tecnica video",
    "data": "Dati strutturati: CSV, tabelle, fogli di calcolo, database, dati JSON o XML",
    "communication": "Comunicazione scritta: email, lettera formale, messaggio, chat log",
    "literature": "Opera letteraria o creativa: romanzo, poesia, racconto, dramma, saggio creativo",
    "tutorial": "Guida o manuale: how-to, manuale d'uso, documentazione utente, FAQ",
}

# Livello 3: Sotto-tipo
SUB_TYPES = {
    # code
    "java": "Codice Java (.java, classi, Spring Boot, Maven)",
    "javascript": "Codice JavaScript o TypeScript (React, Node, frontend)",
    "python": "Codice Python (.py, script, notebook Jupyter)",
    "shell_config": "Script shell o file di configurazione (bash, yaml, toml, ini)",
    "web": "File web (HTML, CSS, template)",
    # document
    "invoice": "Fattura commerciale con importi, partita IVA, numero fattura",
    "contract": "Contratto o accordo legale con clausole e firme",
    "receipt": "Ricevuta o scontrino di pagamento",
    "report": "Relazione o report analitico",
    "certificate": "Certificato, attestato o documento ufficiale",
    "identity_doc": "Documento di identità (carta d'identità, passaporto, codice fiscale)",
    # notes
    "personal_notes": "Note personali informali, diario, pensieri",
    "todo": "Lista di cose da fare, checklist",
    "draft": "Bozza di testo da completare",
    # data
    "spreadsheet": "Foglio di calcolo con dati tabellari e formule",
    "csv_data": "Dati CSV o tabella strutturata",
    "json_xml": "File JSON o XML con dati strutturati",
    # communication
    "email": "Email con mittente, destinatario, oggetto",
    "formal_letter": "Lettera formale o ufficiale",
    # literature
    "poetry": "Componimento poetico in versi",
    "fiction": "Narrativa: romanzo, racconto, novella",
    "essay": "Saggio argomentativo o critico",
    # tutorial
    "manual": "Manuale tecnico o d'uso",
    "howto": "Guida pratica passo-passo",
}

# Mapping contesto → tipi di contenuto più probabili
CONTEXT_CONTENT_MAP = {
    "work": ["code", "document", "data", "communication", "notes", "tutorial"],
    "personal": ["document", "notes", "communication", "literature"],
    "study": ["notes", "tutorial", "document", "literature", "data"],
    "leisure": ["literature", "notes", "media_metadata"],
}

# Mapping tipo_contenuto → sotto-tipi più probabili
CONTENT_SUB_MAP = {
    "code": ["java", "javascript", "python", "shell_config", "web"],
    "document": ["invoice", "contract", "receipt", "report", "certificate", "identity_doc"],
    "notes": ["personal_notes", "todo", "draft"],
    "data": ["spreadsheet", "csv_data", "json_xml"],
    "communication": ["email", "formal_letter"],
    "literature": ["poetry", "fiction", "essay"],
    "tutorial": ["manual", "howto"],
    "media_metadata": [],
}

# =====================================================
# TAG DI DEFAULT DEL SISTEMA
# =====================================================

DEFAULT_TAGS = [
    {"name": "fattura", "description": "Fattura commerciale", "category": "finance"},
    {"name": "ricevuta", "description": "Ricevuta di pagamento", "category": "finance"},
    {"name": "contratto", "description": "Contratto legale", "category": "legal"},
    {"name": "curriculum", "description": "CV personale", "category": "hr"},
    {"name": "documento_identita", "description": "Documento di identità", "category": "personal"},
    {"name": "documento_legale", "description": "Documento legale", "category": "legal"},
    {"name": "poesia", "description": "Poesia o componimento in versi", "category": "literature"},
    {"name": "narrativa", "description": "Opera narrativa", "category": "literature"},
    {"name": "codice_sorgente", "description": "Codice sorgente", "category": "tech"},
    {"name": "foglio_calcolo", "description": "Foglio di calcolo", "category": "data"},
    {"name": "presentazione", "description": "Presentazione slide", "category": "business"},
    {"name": "relazione", "description": "Relazione o report", "category": "business"},
    {"name": "email", "description": "Email", "category": "communication"},
    {"name": "documento_medico", "description": "Documento medico", "category": "health"},
    {"name": "documento_tecnico", "description": "Documentazione tecnica", "category": "tech"},
    {"name": "verbale", "description": "Verbale di riunione", "category": "business"},
    {"name": "busta_paga", "description": "Busta paga", "category": "finance"},
    {"name": "ricetta_medica", "description": "Ricetta medica", "category": "health"},
]

# =====================================================
# FUNZIONI ESTRAZIONE TESTO
# =====================================================

def allowed_file(filename: str) -> bool:
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)


def normalize_text(text: str, max_chars: int = 10000) -> str:
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
    mime_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
        ".md": "text/markdown",
        ".csv": "text/csv",
        ".html": "text/html",
    }
    return {
        "filename": filename,
        "extension": ext,
        "size_bytes": stat.st_size,
        "mime_type": mime_map.get(ext, "application/octet-stream"),
    }


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
    available = _ollama_model_names(response.json())
    return OLLAMA_MODEL in available or OLLAMA_MODEL.split(":", 1)[0] in available


def ensure_ollama_model_available() -> None:
    if is_ollama_model_available():
        return
    pull = requests.post(
        f"{OLLAMA_BASE_URL}/api/pull",
        json={"name": OLLAMA_MODEL, "stream": False},
        timeout=OLLAMA_TIMEOUT,
    )
    pull.raise_for_status()
    payload = pull.json()
    if payload.get("error"):
        raise requests.RequestException(payload["error"])


def call_ollama_raw(prompt: str) -> dict:
    """Chiama Ollama e restituisce il JSON parsato dalla risposta."""
    ensure_ollama_model_available()
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {"temperature": 0.1, "top_p": 0.9},
    }
    resp = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json=payload,
        timeout=OLLAMA_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    return json.loads(data.get("response", "{}"))


def detect_poetry_signals(text: str) -> dict:
    """Riconosce testo in versi o letterario leggero usando segnali strutturali."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return {"is_poetry": False, "literature_score": 0.0, "poetry_score": 0.0}

    short_lines = sum(1 for line in lines if len(line) <= 55)
    avg_len = sum(len(line) for line in lines) / len(lines)
    verse_ratio = short_lines / len(lines)
    has_line_breaks = len(lines) >= 4

    # Semplice euristica: versi brevi, tante righe, andamento poetico.
    is_poetry = has_line_breaks and verse_ratio >= 0.75 and avg_len <= 50
    if not is_poetry:
        return {"is_poetry": False, "literature_score": 0.0, "poetry_score": 0.0}

    return {
        "is_poetry": True,
        "literature_score": 0.86,
        "poetry_score": 0.93,
    }


def apply_poetry_fallback(step1: dict, step2: dict, step3: dict, text: str) -> tuple[dict, dict, dict]:
    signals = detect_poetry_signals(text)
    if not signals["is_poetry"]:
        return step1, step2, step3

    # Se l'LLM produce valori piatti o vuoti, forza una lettura letteraria del testo.
    max_step1 = max(step1.get("scores", {}).values(), default=0.0)
    max_step2 = max(step2.get("scores", {}).values(), default=0.0)
    max_step3 = max(step3.get("scores", {}).values(), default=0.0)

    if max_step1 < 0.2:
        step1 = dict(step1)
        step1["scores"] = dict(step1.get("scores", {}))
        step1["scores"]["leisure"] = max(step1["scores"].get("leisure", 0.0), signals["literature_score"])
        step1["top"] = max(step1["scores"], key=step1["scores"].get)
        step1["reasoning"] = (step1.get("reasoning", "") + " Rilevati versi brevi: contesto letterario/leisure.").strip()

    if max_step2 < 0.2:
        step2 = dict(step2)
        step2["scores"] = dict(step2.get("scores", {}))
        step2["scores"]["literature"] = max(step2["scores"].get("literature", 0.0), signals["literature_score"])
        step2["top"] = max(step2["scores"], key=step2["scores"].get)
        step2["reasoning"] = (step2.get("reasoning", "") + " Rilevati versi brevi: tipo contenuto letteratura.").strip()

    if max_step3 < 0.2 and step2.get("top") == "literature":
        step3 = dict(step3)
        step3["scores"] = dict(step3.get("scores", {}))
        step3["scores"]["poetry"] = max(step3["scores"].get("poetry", 0.0), signals["poetry_score"])
        step3["top"] = max(step3["scores"], key=step3["scores"].get)
        step3["summary"] = step3.get("summary") or "Testo in versi o componimento poetico breve."

    return step1, step2, step3

# =====================================================
# CLASSIFICAZIONE GERARCHICA A 3 LIVELLI
# =====================================================

def step1_classify_context(text: str, filename: str, custom_type_descriptions: dict = None) -> dict:
    """
    STEP 1 – Classificazione del CONTESTO
    Restituisce: { context_name: probability (0.0-1.0), ... }
    """
    contexts_desc = "\n".join(
        [f'- "{k}": {v}' for k, v in CONTEXTS.items()]
    )
    # Aggiunge eventuali tipi personalizzati dell'utente
    if custom_type_descriptions:
        extra = "\n".join([f'- "{k}": {v}' for k, v in custom_type_descriptions.items()])
        contexts_desc += "\n" + extra

    template = "{" + ", ".join([f'"{k}": 0.0' for k in list(CONTEXTS.keys()) + (list(custom_type_descriptions.keys()) if custom_type_descriptions else [])]) + "}"

    prompt = f"""Sei un esperto classificatore. Analizza questo documento e assegna una probabilità (0.0-1.0) a ogni CONTESTO.

Le probabilità sono INDIPENDENTI e non devono sommare a 1.
Assegna valori alti solo quando sei molto sicuro.

FILE: {filename}

CONTESTI DISPONIBILI:
{contexts_desc}

DOCUMENTO (prime 3000 caratteri):
```
{text[:3000]}
```

Rispondi SOLO con JSON valido:
{{
  "scores": {template},
  "reasoning": "breve motivazione in italiano"
}}"""

    raw = call_ollama_raw(prompt)
    scores = raw.get("scores", {})
    # Normalizza scores
    result = {}
    for k in CONTEXTS:
        val = scores.get(k, 0.0)
        result[k] = round(max(0.0, min(1.0, float(val))), 4)
    if custom_type_descriptions:
        for k in custom_type_descriptions:
            val = scores.get(k, 0.0)
            result[k] = round(max(0.0, min(1.0, float(val))), 4)
    return {
        "scores": result,
        "reasoning": raw.get("reasoning", ""),
        "top": max(result, key=result.get) if result else "work",
    }


def step2_classify_content_type(text: str, filename: str, context_scores: dict, custom_type_descriptions: dict = None) -> dict:
    """
    STEP 2 – Classificazione del TIPO DI CONTENUTO
    Basata sul contesto dominante del passo precedente.
    Restituisce: { content_type_name: probability, ... }
    """
    # Trova il contesto dominante e i tipi di contenuto attesi
    top_context = max(context_scores, key=context_scores.get) if context_scores else "work"
    expected_types = CONTEXT_CONTENT_MAP.get(top_context, list(CONTENT_TYPES.keys()))

    # Mostra solo i tipi rilevanti per il contesto
    types_desc = "\n".join(
        [f'- "{k}": {CONTENT_TYPES[k]}' for k in expected_types if k in CONTENT_TYPES]
    )
    if custom_type_descriptions:
        types_desc += "\n" + "\n".join([f'- "{k}": {v}' for k, v in custom_type_descriptions.items()])

    template = "{" + ", ".join([f'"{k}": 0.0' for k in expected_types]) + "}"

    prompt = f"""Contesto rilevato: "{top_context}".
Ora classifica il TIPO DI CONTENUTO del documento tra le opzioni seguenti.

FILE: {filename}

TIPI DI CONTENUTO:
{types_desc}

DOCUMENTO:
```
{text[:4000]}
```

Rispondi SOLO con JSON valido:
{{
  "scores": {template},
  "reasoning": "motivazione"
}}"""

    raw = call_ollama_raw(prompt)
    scores = raw.get("scores", {})
    result = {}
    for k in expected_types:
        val = scores.get(k, 0.0)
        result[k] = round(max(0.0, min(1.0, float(val))), 4)
    return {
        "scores": result,
        "reasoning": raw.get("reasoning", ""),
        "top": max(result, key=result.get) if result else "document",
    }


def step3_classify_sub_type(text: str, filename: str, content_type_scores: dict, custom_type_descriptions: dict = None) -> dict:
    """
    STEP 3 – Classificazione del SOTTO-TIPO
    Basata sul tipo di contenuto dominante del passo precedente.
    Restituisce: { sub_type_name: probability, ... }
    """
    top_content = max(content_type_scores, key=content_type_scores.get) if content_type_scores else "document"
    expected_subtypes = CONTENT_SUB_MAP.get(top_content, [])

    if not expected_subtypes:
        return {"scores": {}, "reasoning": "Nessun sotto-tipo disponibile per questo tipo di contenuto", "top": None}

    subtypes_desc = "\n".join(
        [f'- "{k}": {SUB_TYPES[k]}' for k in expected_subtypes if k in SUB_TYPES]
    )
    if custom_type_descriptions:
        subtypes_desc += "\n" + "\n".join([f'- "{k}": {v}' for k, v in custom_type_descriptions.items()])

    template = "{" + ", ".join([f'"{k}": 0.0' for k in expected_subtypes]) + "}"

    prompt = f"""Tipo di contenuto rilevato: "{top_content}".
Ora classifica il SOTTO-TIPO specifico del documento.

FILE: {filename}

SOTTO-TIPI DISPONIBILI:
{subtypes_desc}

DOCUMENTO:
```
{text[:4000]}
```

Rispondi SOLO con JSON valido:
{{
  "scores": {template},
  "extracted_data": {{
    "data_documento": null,
    "soggetti_coinvolti": [],
    "importo_totale": null,
    "note": ""
  }},
  "summary": "descrizione breve in italiano (max 80 parole)"
}}"""

    raw = call_ollama_raw(prompt)
    scores = raw.get("scores", {})
    result = {}
    for k in expected_subtypes:
        val = scores.get(k, 0.0)
        result[k] = round(max(0.0, min(1.0, float(val))), 4)
    return {
        "scores": result,
        "reasoning": "",
        "top": max(result, key=result.get) if result else None,
        "extracted_data": raw.get("extracted_data", {}),
        "summary": raw.get("summary", ""),
    }


def hierarchical_classify(text: str, filename: str, custom_type_descriptions: dict = None) -> dict:
    """
    Classificazione gerarchica completa a 3 livelli.
    Restituisce struttura con tutti e 3 i livelli di classificazione.
    """
    # Step 1: Contesto
    step1 = step1_classify_context(text, filename, custom_type_descriptions)

    # Step 2: Tipo di contenuto (basato sul contesto)
    step2 = step2_classify_content_type(text, filename, step1["scores"], custom_type_descriptions)

    # Step 3: Sotto-tipo (basato sul tipo di contenuto)
    step3 = step3_classify_sub_type(text, filename, step2["scores"], custom_type_descriptions)

    # Correzione strutturale per testi brevi in versi: evita fallback errati a work/code.
    step1, step2, step3 = apply_poetry_fallback(step1, step2, step3, text)

    # Costruisce il risultato finale
    file_id = str(uuid.uuid4())

    # Tag suggeriti basati sulla classificazione gerarchica
    suggested_tags = build_tags_from_hierarchy(step1, step2, step3)

    return {
        "file_id": file_id,
        "filename": filename,
        "hierarchical_classification": {
            "step1_context": {
                "scores": step1["scores"],
                "top": step1["top"],
                "reasoning": step1.get("reasoning", ""),
            },
            "step2_content_type": {
                "scores": step2["scores"],
                "top": step2["top"],
                "reasoning": step2.get("reasoning", ""),
            },
            "step3_sub_type": {
                "scores": step3["scores"],
                "top": step3.get("top"),
            },
        },
        "tags": suggested_tags,
        "primary_tags": [t["name"] for t in suggested_tags[:3]],
        "summary": step3.get("summary", ""),
        "extracted_data": step3.get("extracted_data", {}),
        "suggested_folder": map_to_folder(step1["top"], step2["top"], step3.get("top")),
        "ambiguous": is_ambiguous(step1, step2, step3),
    }


def build_tags_from_hierarchy(step1: dict, step2: dict, step3: dict) -> list:
    """Costruisce la lista di tag con confidence dal risultato gerarchico."""
    tags = []
    seen = set()
    poetry_mode = step3.get("top") == "poetry"

    # Per la poesia evitiamo di emettere più tag forti che farebbero scattare la conferma manuale.
    if not poetry_mode:
        for name, score in sorted(step1["scores"].items(), key=lambda x: -x[1]):
            if score >= 0.4 and name not in seen:
                tags.append({"name": name, "confidence": score, "category": "context", "description": CONTEXTS.get(name, "")})
                seen.add(name)

        # Aggiungi tag dal tipo di contenuto
        for name, score in sorted(step2["scores"].items(), key=lambda x: -x[1]):
            if score >= 0.45 and name not in seen:
                tags.append({"name": name, "confidence": score, "category": "content_type", "description": CONTENT_TYPES.get(name, "")})
                seen.add(name)

    # Aggiungi tag dal sotto-tipo
    for name, score in sorted(step3["scores"].items(), key=lambda x: -x[1]):
        if score >= 0.45 and name not in seen:
            tags.append({"name": name, "confidence": score, "category": "sub_type", "description": SUB_TYPES.get(name, "")})
            seen.add(name)

    # Aggiungi mappatura a tag del sistema
    top_subtype = step3.get("top")
    top_content = step2.get("top")
    system_tag_map = {
        "invoice": "fattura", "contract": "contratto", "receipt": "ricevuta",
        "report": "relazione", "email": "email", "poetry": "poesia",
        "fiction": "narrativa", "spreadsheet": "foglio_calcolo",
        "java": "codice_sorgente", "python": "codice_sorgente",
        "javascript": "codice_sorgente", "manual": "documento_tecnico",
    }
    if not poetry_mode and top_subtype and top_subtype in system_tag_map:
        sys_tag = system_tag_map[top_subtype]
        if sys_tag not in seen:
            subtype_score = step3["scores"].get(top_subtype, 0.0)
            tags.append({"name": sys_tag, "confidence": subtype_score, "category": "system", "description": ""})
            seen.add(sys_tag)

    return sorted(tags, key=lambda x: -x["confidence"])


def is_ambiguous(step1: dict, step2: dict, step3: dict) -> bool:
    """
    Determina se la classificazione è ambigua.
    Ambigua = differenza < 0.15 tra i due punteggi più alti
    """
    def check_ambiguity(scores: dict) -> bool:
        if not scores:
            return False
        vals = sorted(scores.values(), reverse=True)
        if len(vals) < 2:
            return False
        return abs(vals[0] - vals[1]) < 0.15 and vals[0] > 0.3

    return check_ambiguity(step1["scores"]) or check_ambiguity(step2["scores"])


def map_to_folder(context: str, content_type: str, sub_type: str) -> str:
    """Suggerisce la cartella di destinazione basandosi sulla gerarchia."""
    folder_map = {
        ("work", "code", "java"): "Lavoro/Codice/Java",
        ("work", "code", "python"): "Lavoro/Codice/Python",
        ("work", "code", "javascript"): "Lavoro/Codice/JavaScript",
        ("work", "code", None): "Lavoro/Codice",
        ("work", "document", "invoice"): "Lavoro/Documenti/Fatture",
        ("work", "document", "contract"): "Lavoro/Documenti/Contratti",
        ("work", "document", "report"): "Lavoro/Documenti/Report",
        ("work", "document", None): "Lavoro/Documenti",
        ("work", "notes", None): "Lavoro/Note",
        ("work", "tutorial", None): "Lavoro/Guide",
        ("work", "data", None): "Lavoro/Dati",
        ("personal", "document", "identity_doc"): "Personale/Identità",
        ("personal", "document", None): "Personale/Documenti",
        ("personal", "notes", None): "Personale/Note",
        ("study", "notes", None): "Studio/Appunti",
        ("study", "tutorial", None): "Studio/Guide",
        ("study", "document", None): "Studio/Documenti",
        ("leisure", "literature", "poetry"): "Svago/Letteratura/Poesie",
        ("leisure", "literature", "fiction"): "Svago/Letteratura/Narrativa",
        ("leisure", "literature", None): "Svago/Letteratura",
    }
    key = (context, content_type, sub_type)
    if key in folder_map:
        return folder_map[key]
    key2 = (context, content_type, None)
    if key2 in folder_map:
        return folder_map[key2]
    key3 = (context, None, None)
    context_folder_map = {
        "work": "Lavoro", "personal": "Personale",
        "study": "Studio", "leisure": "Svago",
    }
    return context_folder_map.get(context, "Altro")


# =====================================================
# ENDPOINT API
# =====================================================

@app.route("/api/classify", methods=["POST"])
def classify_file():
    """
    Endpoint principale: classificazione gerarchica a 3 livelli.

    Input: multipart/form-data con:
        - file: documento da analizzare
        - custom_tags (opzionale): JSON con tipi personalizzati dell'utente
          formato: {"nome_tipo": "descrizione semantica", ...}

    Response:
    {
        "file_id": "uuid",
        "filename": "example.pdf",
        "hierarchical_classification": {
            "step1_context": { "scores": {...}, "top": "work" },
            "step2_content_type": { "scores": {...}, "top": "document" },
            "step3_sub_type": { "scores": {...}, "top": "invoice" }
        },
        "tags": [ {"name": "fattura", "confidence": 0.92, ...} ],
        "primary_tags": ["fattura", "document", "work"],
        "summary": "...",
        "suggested_folder": "Lavoro/Documenti/Fatture",
        "ambiguous": false,
        "extracted_data": {...},
        "metadata": {...}
    }
    """
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "File mancante", "code": "FILE_MISSING"}), 400

    filename = file.filename or "unknown"

    # Tipi personalizzati opzionali
    custom_tags_raw = request.form.get("custom_tags")
    custom_type_descriptions = None
    if custom_tags_raw:
        try:
            custom_type_descriptions = json.loads(custom_tags_raw)
        except Exception:
            pass

    tmp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{filename}")

    try:
        file.save(tmp_path)
        raw_text = extract_text_from_any(tmp_path)
        text = normalize_text(raw_text)

        if not text:
            return jsonify({"error": "Testo vuoto o non estraibile", "code": "EMPTY_TEXT"}), 400

        metadata = extract_metadata(tmp_path, filename)
        result = hierarchical_classify(text, filename, custom_type_descriptions)
        result["extracted_text"] = text[:2000]
        result["metadata"] = metadata

    except ValueError as ve:
        return jsonify({"error": str(ve), "code": "FILE_NOT_SUPPORTED"}), 400
    except requests.RequestException as re:
        return jsonify({"error": f"Servizio AI non disponibile: {str(re)}", "code": "ANALYSIS_FAILED"}), 503
    except Exception as e:
        return jsonify({"error": f"Errore interno: {str(e)}", "code": "INTERNAL_ERROR"}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return jsonify(result)


@app.route("/api/analyze", methods=["POST"])
def analyze_file_legacy():
    """Endpoint legacy compatibile col frontend Svelte."""
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
            return jsonify({"error": "Testo vuoto"}), 400

        result = hierarchical_classify(text, filename)
        h = result["hierarchical_classification"]

        # Risposta formato legacy
        extracted = result.get("extracted_data", {})
        top_tag = result["primary_tags"][0] if result["primary_tags"] else "altro"
        extracted["tipo_documento"] = top_tag
        extracted["descrizione_breve"] = result.get("summary", "")
        extracted["context"] = h["step1_context"]["top"]
        extracted["content_type"] = h["step2_content_type"]["top"]
        extracted["sub_type"] = h["step3_sub_type"]["top"]

    except Exception as e:
        return jsonify({"error": f"Errore: {str(e)}"}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return jsonify({"filename": filename, "extracted_data": extracted})


@app.route("/api/tags/default", methods=["GET"])
def get_default_tags():
    return jsonify({"tags": DEFAULT_TAGS, "count": len(DEFAULT_TAGS)})


@app.route("/api/contexts", methods=["GET"])
def get_contexts():
    """Restituisce i contesti del livello 1."""
    return jsonify({"contexts": CONTEXTS})


@app.route("/api/content-types", methods=["GET"])
def get_content_types():
    """Restituisce i tipi di contenuto del livello 2."""
    return jsonify({"content_types": CONTENT_TYPES, "context_map": CONTEXT_CONTENT_MAP})


@app.route("/api/sub-types", methods=["GET"])
def get_sub_types():
    """Restituisce i sotto-tipi del livello 3."""
    return jsonify({"sub_types": SUB_TYPES, "content_map": CONTENT_SUB_MAP})


@app.route("/api/health", methods=["GET"])
def health_check():
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
        "classification_levels": 3,
        "contexts": list(CONTEXTS.keys()),
        "content_types": list(CONTENT_TYPES.keys()),
        "supported_extensions": list(ALLOWED_EXTENSIONS),
    })


# =====================================================
# AVVIO SERVER
# =====================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"DocuMind Python AI Backend - Classificazione Gerarchica 3 livelli")
    print(f"Porta: {port} | Ollama: {OLLAMA_BASE_URL} | Modello: {OLLAMA_MODEL}")
    app.run(host="0.0.0.0", port=port, debug=debug)
