# DocuMind

## Avvio backend Spring Boot

Il backend e' nella cartella `springboot-documind`.

### Prerequisiti

- Java 17+ installato
- Database MariaDB avviato (config in `springboot-documind/src/main/resources/application.properties`)

### Avvio rapido (sviluppo)

Da Linux/macOS:

```bash
cd springboot-documind
./mvnw spring-boot:run
```

Da Windows (PowerShell/CMD):

```bat
cd springboot-documind
mvnw.cmd spring-boot:run
```

Se parte correttamente, l'app risponde su `http://localhost:8080`.

Profilo usato di default: `dev`.

### Avvio profilo produzione

Da Linux/macOS:

```bash
cd springboot-documind
SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run
```

Da Windows (PowerShell):

```powershell
cd springboot-documind
$env:SPRING_PROFILES_ACTIVE="prod"
mvnw.cmd spring-boot:run
```

### Credenziali di test login (seed automatico)

Nel profilo `dev` viene creato automaticamente un utente di test se non esiste gia' (e viene riallineata la password di test).

- Email: `test@documind.local`
- Telefono: `+391111111111`
- Password: `test123`

Puoi usare email oppure telefono nel form login.

### Build e avvio da jar

```bash
cd springboot-documind
./mvnw clean package
java -jar target/springboot-documind-0.0.1-SNAPSHOT.jar
```

### Test backend

```bash
cd springboot-documind
./mvnw test
```
