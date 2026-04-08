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



prompt 
```
Your task is to act as a prompt engineer to create a detailed prompt for a language model. This prompt will guide the language model to develop a comprehensive application.

The application involves:
1.  **Backend Analysis and Improvement**:
    *   Analyzing an existing Python backend.
    *   Improving the Python backend using `unstruct`.
    *   Modifying the Python backend to classify file types (e.g., "poesia", "fottarura" - note these are informal examples, the model should infer more formal and appropriate classifications) and assign a percentage probability for each type.
    *   Adding new classification categories, such as "documento personale" for files containing personal data, alongside other potential types.
2.  **Spring Boot Integration**:
    *   Integrating a Spring Boot backend that receives data from the Python backend.
    *   The Spring Boot backend should analyze the data, assign tags, and save them to a database.
3.  **Frontend Development**:
    *   Creating a complete Next.js frontend for testing all features.
    *   Implementing login functionality, ideally using a Spring Boot extension.
4.  **Uncertainty Handling**:
    *   Implementing a mechanism where if the classification confidence is between 50% and 60%, the Spring Boot backend should request confirmation from the user via the frontend.

The prompt should ensure the language model understands these requirements and generates code and instructions accordingly.

# Steps

1.  **Python Backend Refinement**:
    *   **Analysis**: Describe how to analyze the existing Python backend code provided (assume it will be provided as input or context).
    *   **Improvement with `unstruct`**: Detail the process of integrating and using `unstruct` to enhance the backend's capabilities, focusing on data extraction and structuring.
    *   **Classification Logic**: Clearly define the requirements for the file classification module.
        *   It must identify various file types (e.g., documents, images, code, specific content types like "poetry," "invoices," etc. - use formal and appropriate terms).
        *   For each identified type, it must return a confidence percentage.
        *   It should also support multi-label classification (e.g., a file could be both an "invoice" and a "personal document"). Define the logic for this.
    *   **Data Transfer**: Specify how the classified data (file type, percentages, tags) should be formatted and sent to the Spring Boot backend.

2.  **Spring Boot Backend Development**:
    *   **API Endpoint**: Define the API endpoint(s) in Spring Boot to receive data from the Python backend.
    *   **Data Processing**: Detail how the Spring Boot application should process the incoming data, including analyzing it further.
    *   **Tagging and Database**: Explain the logic for assigning tags based on the analysis and how this data (including original file info, classification, and tags) should be persisted in a database. Specify the database technology if relevant (e.g., PostgreSQL, MySQL).
    *   **Uncertainty Handling Logic**: Implement the logic for handling classification confidence between 50% and 60%. This involves sending a request back to the frontend for user confirmation. Define the structure of this request.

3.  **Next.js Frontend Development**:
    *   **Core Features**: Outline the necessary components and pages for the frontend, including file upload, display of classification results, and user interaction.
    *   **Login Implementation**: Detail the integration of a login system, leveraging Spring Boot extensions for authentication (e.g., Spring Security, JWT).
    *   **User Confirmation Flow**: Implement the UI and logic for handling user confirmation requests originating from the Spring Boot backend when classification confidence is uncertain.

4.  **Integration and Testing**:
    *   Describe the overall integration flow between the Python backend, Spring Boot backend, and Next.js frontend.
    *   Suggest testing strategies for each component and the integrated system.

# Output Format

The output should be a comprehensive guide, including:
*   **Code Snippets**: Provide illustrative code snippets for key functionalities in Python, Java (for Spring Boot), and JavaScript/TypeScript (for Next.js).
*   **Configuration Instructions**: Include instructions for setting up and configuring the different parts of the application (e.g., `unstruct` configuration, Spring Boot application properties, Next.js environment variables).
*   **API Contracts**: Define the expected request and response formats between the Python and Spring Boot backends, and between the Spring Boot backend and the Next.js frontend. JSON format is preferred for API communication.
*   **Database Schema**: Suggest a basic database schema for storing the file information, classifications, and tags.
*   **Deployment Considerations**: Briefly touch upon potential deployment strategies.

# Examples

**Example 1: Python Classification Logic**

*   **Input File**: A text document containing a poem.
*   **Reasoning**: The Python script analyzes the text. It identifies stylistic elements common in poetry (meter, rhyme, figurative language) and keywords associated with poetic themes. It also notes the absence of formal document structures like headers or invoice numbers.
*   **Output**:
    ```json
    {
      "file_id": "unique_file_identifier_123",
      "classifications": [
        {"type": "Poetry", "confidence": 0.85},
        {"type": "Literature", "confidence": 0.70},
        {"type": "Text Document", "confidence": 0.95}
      ]
    }
    ```

**Example 2: Spring Boot Uncertainty Handling Request**

*   **Input Data from Python**:
    ```json
    {
      "file_id": "unique_file_identifier_456",
      "classifications": [
        {"type": "Invoice", "confidence": 0.55},
        {"type": "Financial Document", "confidence": 0.50},
        {"type": "Personal Data", "confidence": 0.40}
      ]
    }
    ```
*   **Reasoning**: The Spring Boot backend receives this data. It notes that "Invoice" has a confidence of 0.55, which falls within the 50-60% uncertainty range. According to the requirements, it needs to request user confirmation before finalizing the classification or tagging.
*   **Output (to Frontend)**:
    ```json
    {
      "request_type": "user_confirmation",
      "file_id": "unique_file_identifier_456",
      "potential_classifications": [
        {"type": "Invoice", "confidence": 0.55},
        {"type": "Financial Document", "confidence": 0.50}
      ],
      "message": "We are unsure about the exact classification. Is this an Invoice or a Financial Document?"
    }
    ```

**Example 3: Spring Boot Successful Tagging and DB Save**

*   **Input Data from Python**:
    ```json
    {
      "file_id": "unique_file_identifier_789",
      "classifications": [
        {"type": "Official Document", "confidence": 0.92},
        {"type": "Personal Data", "confidence": 0.88},
        {"type": "Legal", "confidence": 0.75}
      ]
    }
    ```
*   **Reasoning**: The Spring Boot backend receives this data. The confidence levels are high. It proceeds to analyze the content for specific tags (e.g., 'contains_ssn', 'contract_terms', 'personal_address'). It then assigns primary tags based on the highest confidence classifications and any specific extracted information. Finally, it saves the file's metadata, classifications, and assigned tags to the database.
*   **Database Entry (Conceptual)**:
    *   `file_id`: unique_file_identifier_789
    *   `original_filename`: contract_agreement.pdf
    *   `upload_timestamp`: 2023-10-27T10:30:00Z
    *   `classifications`: `[{"type": "Official Document", "confidence": 0.92}, {"type": "Personal Data", "confidence": 0.88}, {"type": "Legal", "confidence": 0.75}]`
    *   `assigned_tags`: `["Official", "Personal Data", "Legal", "Contains Address", "Contract"]`
    *   `processed_timestamp`: 2023-10-27T10:35:00Z

# Notes

*   **Security**: Emphasize security best practices for handling user data and authentication, especially within the Spring Boot and Next.js components.
*   **Error Handling**: Detail robust error handling mechanisms across all layers of the application.
*   **Scalability**: Consider aspects of scalability for the database and backend services.
*   **File Types**: The model should be encouraged to identify a diverse and practical range of file types beyond the informal examples provided. Examples include: `Invoice`, `Receipt`, `Contract`, `Resume`, `Image (JPEG, PNG)`, `Code (Python, Java)`, `Spreadsheet (XLSX)`, `Presentation (PPTX)`, `Personal ID`, `Legal Document`, `Literary Work`, etc.
*   **`unstruct` Usage**: Clarify that `unstruct` is a tool for data extraction and structuring; its specific implementation details should be researched and applied by the model.
```
