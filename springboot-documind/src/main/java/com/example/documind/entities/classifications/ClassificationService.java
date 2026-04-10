package com.example.documind.entities.classifications;

import com.example.documind.configurations.exceptions.CustomException;
import com.example.documind.dto.classifications.AnalysisResult;
import com.example.documind.dto.classifications.ClassificationEntry;
import com.example.documind.dto.classifications.ConfirmClassificationRequest;
import com.example.documind.dto.classifications.PythonClassificationResponse;
import com.example.documind.dto.requests.FileCreateRequest;
import com.example.documind.dto.responses.FileResponse;
import com.example.documind.entities.files.FileService;
import com.example.documind.entities.files.type.FileCategory;
import com.example.documind.entities.files.type.FileSemanticType;
import com.example.documind.entities.files.type.FileSubType;
import com.example.documind.security.tokens.TokenRepository;
import com.example.documind.security.tokens.TokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ClassificationService {

    private static final double AUTO_ACCEPT_THRESHOLD = 0.60;
    private static final double CONFIRMATION_LOWER = 0.50;
    private static final double CONFIRMATION_UPPER = 0.60;
    private static final double MIN_SHOW_THRESHOLD = 0.35;

    @Value("${app.python.url:http://localhost:5001}")
    private String pythonBaseUrl;

    private final FileService fileService;
    private final TokenRepository tokenRepository;
    private final TokenService tokenService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Cache in-memory delle analisi pendenti (in produzione usare Redis/DB)
    private final Map<String, PythonClassificationResponse> pendingAnalyses = new ConcurrentHashMap<>();

    public ClassificationService(
            FileService fileService,
            TokenRepository tokenRepository,
            TokenService tokenService
    ) {
        this.fileService = fileService;
        this.tokenRepository = tokenRepository;
        this.tokenService = tokenService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Analizza un file:
     * 1. Invia al backend Python per classificazione AI
     * 2. Applica logica threshold
     * 3. Se confidence > 0.6 → auto-accetta e salva
     * 4. Se 0.5-0.6 → chiede conferma all'utente
     * 5. Se < 0.5 → folder "Uncategorized"
     */
    public AnalysisResult analyzeFile(String authToken, MultipartFile file) throws IOException {
        // 1. Chiama Python AI
        PythonClassificationResponse pythonResult = callPythonClassify(file);

        // 2. Filtra classificazioni rilevanti (> MIN_SHOW_THRESHOLD)
        List<ClassificationEntry> relevant = pythonResult.getClassifications().stream()
                .filter(c -> c.getConfidence() != null && c.getConfidence() >= MIN_SHOW_THRESHOLD)
                .sorted(Comparator.comparingDouble(ClassificationEntry::getConfidence).reversed())
                .collect(Collectors.toList());

        if (relevant.isEmpty()) {
            return buildLowConfidenceResult(pythonResult, authToken, file);
        }

        ClassificationEntry top = relevant.get(0);
        double topConfidence = top.getConfidence();

        // 3. Auto-accept se confidence > 60%
        if (topConfidence > AUTO_ACCEPT_THRESHOLD) {
            return buildAutoClassifiedResult(pythonResult, relevant, authToken, file);
        }

        // 4. Chiedi conferma se 50-60%
        if (topConfidence >= CONFIRMATION_LOWER) {
            pendingAnalyses.put(pythonResult.getFileId(), pythonResult);
            return buildConfirmationRequiredResult(pythonResult, relevant);
        }

        // 5. Low confidence
        return buildLowConfidenceResult(pythonResult, authToken, file);
    }

    /**
     * Conferma la classificazione scelta dall'utente per file incerti.
     */
    public AnalysisResult confirmClassification(String authToken, ConfirmClassificationRequest request) throws IOException {
        PythonClassificationResponse cached = pendingAnalyses.remove(request.getFileId());
        if (cached == null) {
            throw new CustomException(
                HttpStatus.NOT_FOUND,
                "PENDING_NOT_FOUND",
                "Analisi pendente non trovata. Potrebbe essere scaduta."
            );
        }

        // Trova la classificazione confermata
        List<ClassificationEntry> relevant = cached.getClassifications().stream()
                .filter(c -> c.getConfidence() != null && c.getConfidence() >= MIN_SHOW_THRESHOLD)
                .sorted(Comparator.comparingDouble(ClassificationEntry::getConfidence).reversed())
                .collect(Collectors.toList());

        // Costruisci result con il tipo confermato dall'utente
        List<String> tags = buildTagsFromType(request.getConfirmedType(), 1.0);
        if (request.getAdditionalTags() != null) {
            request.getAdditionalTags().stream()
                    .map(t -> t.trim().toLowerCase())
                    .filter(t -> !t.isEmpty())
                    .forEach(tags::add);
        }

        AnalysisResult result = new AnalysisResult();
        result.setType("CLASSIFIED");
        result.setFileId(cached.getFileId());
        result.setFilename(cached.getFilename());
        result.setClassifications(relevant);
        result.setAssignedTags(tags);
        result.setExtractedData(cached.getExtractedData());
        result.setSuggestedFolder(mapTypeToFolder(request.getConfirmedType()));
        result.setMessage("Classificazione confermata: " + request.getConfirmedType());

        return result;
    }

    // =====================================================
    // HELPER: costruzione risultati
    // =====================================================

    private AnalysisResult buildAutoClassifiedResult(
            PythonClassificationResponse pythonResult,
            List<ClassificationEntry> relevant,
            String authToken,
            MultipartFile file
    ) throws IOException {
        ClassificationEntry top = relevant.get(0);
        List<String> tags = buildTagsFromClassifications(relevant);

        AnalysisResult result = new AnalysisResult();
        result.setType("CLASSIFIED");
        result.setFileId(pythonResult.getFileId());
        result.setFilename(pythonResult.getFilename());
        result.setClassifications(relevant);
        result.setAssignedTags(tags);
        result.setExtractedData(pythonResult.getExtractedData());
        result.setSuggestedFolder(mapTypeToFolder(top.getType()));
        result.setMessage("File classificato automaticamente come: " + top.getType()
                + " (" + String.format("%.0f%%", top.getConfidence() * 100) + " confidenza)");
        return result;
    }

    private AnalysisResult buildConfirmationRequiredResult(
            PythonClassificationResponse pythonResult,
            List<ClassificationEntry> relevant
    ) {
        // Top 3 opzioni per il popup
        List<ClassificationEntry> topOptions = relevant.stream()
                .limit(3)
                .collect(Collectors.toList());

        AnalysisResult result = new AnalysisResult();
        result.setType("CONFIRMATION_REQUIRED");
        result.setFileId(pythonResult.getFileId());
        result.setFilename(pythonResult.getFilename());
        result.setClassifications(relevant);
        result.setOptions(topOptions);
        result.setExtractedData(pythonResult.getExtractedData());
        result.setMessage("Non siamo sicuri della classificazione. Puoi confermare il tipo corretto?");
        return result;
    }

    private AnalysisResult buildLowConfidenceResult(
            PythonClassificationResponse pythonResult,
            String authToken,
            MultipartFile file
    ) {
        AnalysisResult result = new AnalysisResult();
        result.setType("LOW_CONFIDENCE");
        result.setFileId(pythonResult.getFileId());
        result.setFilename(pythonResult.getFilename());
        result.setClassifications(pythonResult.getClassifications().stream()
                .filter(c -> c.getConfidence() != null && c.getConfidence() >= 0.1)
                .sorted(Comparator.comparingDouble(ClassificationEntry::getConfidence).reversed())
                .limit(5)
                .collect(Collectors.toList()));
        result.setAssignedTags(List.of("uncategorized"));
        result.setExtractedData(pythonResult.getExtractedData());
        result.setSuggestedFolder("Uncategorized");
        result.setMessage("Confidenza troppo bassa. File spostato in 'Senza categoria'.");
        return result;
    }

    // =====================================================
    // HELPER: tag e cartelle
    // =====================================================

    private List<String> buildTagsFromClassifications(List<ClassificationEntry> classifications) {
        List<String> tags = new ArrayList<>();
        for (ClassificationEntry c : classifications) {
            if (c.getConfidence() != null && c.getConfidence() > AUTO_ACCEPT_THRESHOLD) {
                tags.addAll(buildTagsFromType(c.getType(), c.getConfidence()));
            }
        }
        // Deduplication
        return tags.stream().distinct().collect(Collectors.toList());
    }

    private List<String> buildTagsFromType(String type, double confidence) {
        List<String> tags = new ArrayList<>();
        if (type == null) return tags;

        String slug = type.toLowerCase().replace(" ", "-");
        tags.add(slug);

        // Tag aggiuntivi per categoria
        switch (type) {
            case "Invoice", "Receipt" -> tags.add("finance");
            case "Contract", "Legal Document" -> tags.add("legal");
            case "Resume" -> tags.add("hr");
            case "Personal Document" -> tags.add("personal");
            case "Medical Document" -> tags.add("health");
            case "Financial Document" -> { tags.add("finance"); tags.add("accounting"); }
            case "Technical Document", "Code" -> tags.add("tech");
        }

        return tags;
    }

    private String mapTypeToFolder(String type) {
        if (type == null) return "Uncategorized";
        return switch (type) {
            case "Invoice", "Receipt", "Financial Document" -> "Finance";
            case "Contract", "Legal Document" -> "Legal";
            case "Resume" -> "HR";
            case "Personal Document" -> "Personal";
            case "Medical Document" -> "Health";
            case "Code", "Technical Document" -> "Tech";
            case "Email" -> "Email";
            case "Report", "Presentation" -> "Reports";
            case "Poetry", "Literature" -> "Literature";
            default -> "Other";
        };
    }

    // =====================================================
    // CHIAMATA PYTHON BACKEND
    // =====================================================

    private PythonClassificationResponse callPythonClassify(MultipartFile file) throws IOException {
        String url = pythonBaseUrl + "/api/classify";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
        body.add("file", resource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<PythonClassificationResponse> response = restTemplate.postForEntity(
                    url,
                    requestEntity,
                    PythonClassificationResponse.class
            );

            if (response.getBody() == null) {
                throw new CustomException(
                    HttpStatus.BAD_GATEWAY,
                    "PYTHON_EMPTY_RESPONSE",
                    "Il servizio AI non ha restituito risultati."
                );
            }
            return response.getBody();

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "PYTHON_UNAVAILABLE",
                "Servizio AI non disponibile: " + e.getMessage()
            );
        }
    }

    // =====================================================
    // UTILITY: calcola hash SHA-256
    // =====================================================

    private String computeHash(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    // =====================================================
    // MAPPING tipi AI → FileSemanticType Spring
    // =====================================================

    private FileSemanticType mapToSemanticType(String type) {
        if (type == null) return FileSemanticType.UNKNOWN;
        return switch (type) {
            case "Invoice" -> FileSemanticType.INVOICE;
            case "Receipt" -> FileSemanticType.RECEIPT;
            case "Contract" -> FileSemanticType.CONTRACT;
            case "Resume" -> FileSemanticType.CV;
            case "Legal Document" -> FileSemanticType.LEGAL_DOCUMENT;
            case "Financial Document" -> FileSemanticType.FINANCIAL_DOCUMENT;
            case "Report" -> FileSemanticType.REPORT;
            case "Email" -> FileSemanticType.EMAIL;
            case "Presentation" -> FileSemanticType.PRESENTATION;
            default -> FileSemanticType.OTHER;
        };
    }

    private FileCategory mapToCategory(String type) {
        if (type == null) return FileCategory.OTHER;
        return switch (type) {
            case "Code" -> FileCategory.CODE;
            case "Spreadsheet" -> FileCategory.DATA;
            default -> FileCategory.DOCUMENT;
        };
    }

    private FileSubType mapToSubType(String mimeType) {
        if (mimeType == null) return FileSubType.UNKNOWN;
        return switch (mimeType) {
            case "application/pdf" -> FileSubType.PDF;
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> FileSubType.WORD;
            case "text/plain", "text/markdown" -> FileSubType.TEXT;
            case "text/csv" -> FileSubType.DATA_CSV;
            default -> FileSubType.UNKNOWN;
        };
    }
}
