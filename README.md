![logo_documind](images/logo.png)

---

## 📋 Overview

**DocuMind** is a full-stack, multi-service application for uploading, classifying, and organizing documents using **local AI inference with Ollama**. The project is split into three runtime modules: a **Spring Boot backend** for business/API logic, a **Python Flask AI service** for document analysis, and a **Next.js frontend** for user workflows.

The platform is designed to support a real classification lifecycle: file ingestion, multi-label confidence scoring, human confirmation for uncertain predictions, and user-scoped archive management.

- 🧠 **AI-assisted classification** — multi-tag analysis with confidence thresholds and fallback keyword rules
- 🧩 **Modular architecture** — Spring API + Python AI engine + Next.js UI
- 🔐 **Session-based auth** — token persisted in DB and sent via HttpOnly cookie
- 📂 **Metadata archive** — owner-scoped file metadata with filters, update, and delete
- 🐳 **Container-ready** — docker-compose for DB + API + AI + Ollama runtime

---

## ✨ Features

### Task Management

| Feature | Description |
|---|---|
| 📤 Upload and analyze documents | Files are analyzed through the AI service and returned with semantic tags and confidence |
| 🏷️ Multi-label tagging | A document can receive multiple tags (independent confidence scores) |
| 🤔 Human confirmation flow | Medium-confidence predictions are marked for manual confirmation |
| 📁 Suggested folders | Spring maps confirmed/automatic tags to domain folders (Finance, Legal, Tech, etc.) |
| 🗂️ Archive views | Dashboard supports search, sorting, folder navigation, and state filters |
| ✏️ Metadata update | File metadata can be patched (name, tags, semantic attributes, flags) |
| 🗑️ Metadata deletion | Owner can delete file records from personal archive |

### User Management

| Feature | Description |
|---|---|
| 📝 Registration | Create a user via `/api/v1/user` |
| 🔑 Login / Logout | Authenticate with email or telephone; receive `authentication-token` cookie |
| 👤 Profile update | Update account fields (`telephone` / `email`) via `/api/v1/user/me` |
| 🔒 Password verify/change | Verify old password then update password via dedicated endpoints |
| ⏱️ Session extension | Extend active token expiration via `/api/v1/user/me/extend-session` |
| 💀 Account deletion | Remove user account and related owned file metadata |
| 🧪 Dev seed user | Auto-seeded test user in `dev` profile for local testing |

### UI / UX

| Feature | Description |
|---|---|
| 🖥️ Modern web UI | Next.js app with dedicated login, signup, dashboard, and tags pages |
| 🧭 Guided onboarding | Privacy consent and onboarding state persisted in browser `localStorage` |
| 📊 Classification feedback | Rich result cards, pending confirmation popup, and archive statistics |
| 🏷️ Tag management UI | Custom tag creation/edit/delete flow in frontend state |
| 🔁 API proxy layer | Next API routes proxy auth/classification requests to Spring backend |

---

## 🛠 Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Core language for Spring backend |
| Spring Boot | 4.0.2 | REST API and application runtime |
| Spring Data JPA | (via starter) | Persistence and repository abstraction |
| Spring Security | (via starter) | Security configuration and auth rules |
| MariaDB JDBC Driver | Runtime | Database connectivity |
| MapStruct | 1.5.5.Final | DTO/entity mapping |
| Python | 3.11 | AI service runtime |
| Flask | Latest (requirements) | AI HTTP service |
| Requests | Latest (requirements) | Ollama HTTP integration |
| PyPDF2 / python-docx | Latest (requirements) | Text extraction from PDF/DOCX |
| Ollama | Local runtime | LLM inference engine for classification |
| Maven Wrapper | Included | Build/test/run for Spring module |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.1 | Frontend framework and API routes |
| React | 19.2.4 | UI components |
| TypeScript | 5.x | Static typing |
| Redux Toolkit | 2.11.2 | Client-side state management |
| styled-components | 6.3.12 | Component-scoped styling |
| ESLint | 9.x | Linting |

---

## 🚀 Quick Start

### Prerequisites

- **Java 21+**
- **Python 3.11+**
- **Node.js 20+**
- **pnpm or npm**
- **MariaDB** reachable by Spring backend
- **Ollama** installed and running locally (or in Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/Alex3725/documind-app.git
cd documind-app
```

### 2. Set Up AI Model (Ollama)

```bash
ollama serve
ollama pull qwen2.5:1.5b
```

> The Python service can also attempt model pull automatically if missing, but pre-pulling is recommended.

### 3. Configure the Application

**Spring config** is in:

```properties
/home/runner/work/documind-app/documind-app/springboot-documind/src/main/resources/application.properties
/home/runner/work/documind-app/documind-app/springboot-documind/src/main/resources/application-dev.properties
```

Key values:

```properties
spring.datasource.url=jdbc:mariadb://localhost:3306/documind_app
spring.datasource.username=alex
app.python.url=http://localhost:5002
```

> ⚠️ **Important:** Python backend runs on **5001** by default (`backandpy-documind/app.py`), while `application-dev.properties` currently points to `5002`.
> Use runtime override when starting Spring locally:
>
> ```bash
> APP_PYTHON_URL=http://localhost:5001 ./mvnw spring-boot:run
> ```

### 4. Build and Run

Run the 3 modules in separate terminals:

```bash
# 1) Python AI backend
cd backandpy-documind
pip install -r requirements.txt
python app.py

# 2) Spring backend
cd ../springboot-documind
./mvnw spring-boot:run

# 3) Next.js frontend
cd ../frontend-documind
pnpm install
pnpm dev
```

### 5. Open in Browser

```
http://localhost:3000
```

Use dev seeded credentials (Spring `dev` profile):

- Email: `test@documind.local`
- Password: `test123`

---

## 🗂 Project Structure

```text
documind-app/
│
├── README.md
├── docker-compose.yml
├── images/
│   ├── Mappa_innovetion_week.png
│   └── proxy-image.jpg
│
├── springboot-documind/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
│       ├── main/java/com/example/documind/
│       │   ├── DocumindApplication.java
│       │   ├── entities/
│       │   │   ├── users/
│       │   │   ├── files/
│       │   │   └── classifications/
│       │   ├── security/tokens/
│       │   └── configurations/
│       └── main/resources/
│           ├── application.properties
│           ├── application-dev.properties
│           └── application-prod.properties
│
├── backandpy-documind/
│   ├── app.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
└── frontend-documind/
    ├── package.json
    ├── app/
    │   ├── page.tsx
    │   ├── dashboard/
    │   ├── signup/
    │   └── api/
    └── lib/
        ├── components/
        └── features/
```

---

## 📡 API Reference

Spring endpoints are prefixed with `/api/v1`. Authentication is carried in the HttpOnly cookie `authentication-token`.

### 👤 User Endpoints — `/api/v1/user`

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/user` | ❌ | Register a new user |
| `POST` | `/api/v1/user/in` | ❌ | Login and issue session cookie |
| `POST` | `/api/v1/user/out` | ✅ | Logout and clear session cookie |
| `POST` | `/api/v1/user/me/extend-session` | ✅ | Extend current token validity |
| `PUT` | `/api/v1/user/me` | ✅ | Update telephone/email |
| `POST` | `/api/v1/user/me/verify-password` | ✅ | Verify current password |
| `PUT` | `/api/v1/user/me/password` | ✅ | Update password |
| `DELETE` | `/api/v1/user/me` | ✅ | Delete account |

### 📁 File Endpoints — `/api/v1/files`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/files` | Create file metadata |
| `GET` | `/api/v1/files` | List authenticated user files |
| `GET` | `/api/v1/files/{fileId}` | Get one file metadata |
| `PATCH` | `/api/v1/files/{fileId}` | Partial metadata update |
| `DELETE` | `/api/v1/files/{fileId}` | Delete file metadata |

`GET /api/v1/files` filters:

- `category`
- `subType`
- `semanticType`
- `tag`
- `uploadedFrom`
- `uploadedTo`

### 🧠 Classification Endpoints — `/api/v1/classify`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/classify/analyze` | Analyze uploaded file via Python AI |
| `POST` | `/api/v1/classify/confirm` | Confirm uncertain tags |

### 🤖 Python AI Endpoints (Flask)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/classify` | Main multi-label classification endpoint |
| `POST` | `/api/analyze` | Legacy structured extraction endpoint |
| `GET` | `/api/tags/default` | Return built-in default tags |
| `GET` | `/api/health` | Service + Ollama status |

---

## ⚙️ Configuration

Main Spring settings:

```properties
spring.application.name=documind
spring.profiles.default=dev
spring.datasource.url=jdbc:mariadb://localhost:3306/documind_app
spring.datasource.username=alex
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Dev profile extras:

```properties
app.seed.user.email=test@documind.local
app.seed.user.telephone=+391111111111
app.python.url=http://localhost:5002
spring.servlet.multipart.max-file-size=200MB
spring.servlet.multipart.max-request-size=200MB
```

Python `.env` (AI backend):

```properties
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:1.5b
```

### Recommended Changes for Production

| Setting | Recommended Value |
|---|---|
| `spring.jpa.hibernate.ddl-auto` | `validate` (or controlled migration strategy) |
| `spring.jpa.show-sql` | `false` |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `app.python.url` | Internal/private service URL |
| Cookie `secure` flag | `true` under HTTPS |

---

## 🔒 Security

The current implementation includes the following controls and constraints:

### Authentication & Sessions

- **DB-backed token sessions** — token records are persisted in `token` table with expiration.
- **HttpOnly cookie transport** — `authentication-token` is set as HttpOnly cookie.
- **SameSite cookie setting** — cookie is issued with `SameSite=Lax` in login flow.
- **Session extension endpoint** — explicit API to prolong token validity.

### Request and Domain Validation

- **File payload validation** — `FileValidator` enforces required metadata, hash length, confidence range, and category/subtype coherence.
- **Centralized API error handling** — `GlobalExceptionHandler` returns structured API errors with status/code/path.
- **Owner-scoped access checks** — file operations resolve owner from valid token before read/write/delete.

### AI Pipeline Controls

- **Allowed file extensions** on Python service (`.txt`, `.pdf`, `.docx`, `.md`, `.csv`, `.html`).
- **Max upload size** configured both in Python and Spring profile config.
- **Fallback keyword scoring** when Ollama output lacks usable tag scores.
