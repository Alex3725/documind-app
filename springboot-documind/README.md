# DocuMind - File Module (metadata API)

Questo progetto ora include un primo modulo `files` orientato ai **metadati** (non upload binario).

## Credenziali di test login

Nel profilo `dev` viene fatto il seed automatico di un utente di test (solo se non esiste gia').

- Email: `test@documind.local`
- Telefono: `+391111111111`
- Password: `test123`

I valori sono configurabili in `src/main/resources/application-dev.properties` con le chiavi `app.seed.user.*`.

## Profili Spring

- `dev` (default): security aperta per test locale e seed utente attivo.
- `prod`: regole security piu restrittive e nessun seed automatico.

Avvio `prod`:

```bash
SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run
```

## Flusso architetturale

1. `FileController` riceve HTTP request e cookie `authentication-token`.
2. `FileService` valida token, applica regole business, aggiorna timestamp e ownership.
3. `FileRepository` esegue query JPA owner-scoped.
4. `FileMapper` converte tra entity `File` e DTO `FileResponse`.
5. `FileValidator` valida i payload (`create`/`update`) e normalizza i tag.

## Endpoints disponibili

- `POST /api/v1/files` crea metadati file.
- `GET /api/v1/files` lista file dell'utente loggato.
- `GET /api/v1/files/{fileId}` dettaglio file (solo owner).
- `PATCH /api/v1/files/{fileId}` update parziale (solo owner).
- `DELETE /api/v1/files/{fileId}` cancellazione (solo owner).

### Filtri su lista

`GET /api/v1/files` supporta:

- `category`
- `subType`
- `semanticType`
- `tag`
- `uploadedFrom` (ISO datetime)
- `uploadedTo` (ISO datetime)

Esempio:

```http
GET /api/v1/files?category=DOCUMENT&tag=invoice&uploadedFrom=2026-01-01T00:00:00
```

## Note importanti

- Ownership attuale: `File.owner` e` una stringa (email utente).
- Quando l'utente cambia email, viene eseguita una migrazione ownership sui file.
- La regola hash e` **globale** (`hash` unico), quindi due utenti non possono avere lo stesso hash.
- `createDefaultSpace` e` un hook preparato per future cartelle/spazi iniziali.

## Test

E' stato aggiunto un test unitario per `FileValidator`:

- `src/test/java/com/example/documind/configurations/globals/validators/FileValidatorTest.java`

Copre:

- incoerenza `category/subType`
- hash troppo corta
- normalizzazione tag (trim/lowercase/dedup)

