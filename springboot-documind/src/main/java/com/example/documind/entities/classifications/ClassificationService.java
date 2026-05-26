package com.example.documind.entities.classifications;

import com.example.documind.configurations.exceptions.CustomException;
import com.example.documind.dto.classifications.*;
import com.example.documind.dto.requests.ConfirmClassificationRequest;
import com.example.documind.dto.responses.PythonTagResponse;
import com.example.documind.entities.folders.FolderTypeRepository;
import com.example.documind.security.tokens.Token;
import com.example.documind.security.tokens.TokenRepository;
import com.example.documind.security.tokens.TokenService;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import com.example.documind.dto.requests.FileCreateRequest;
import com.example.documind.entities.files.FileService;
import com.example.documind.dto.responses.FileResponse;

/**
 * ClassificationService — Classificazione gerarchica a 3 livelli.
 *
 * Flusso:
 * 1. Riceve il file dal frontend
 * 2. Recupera le descrizioni cartelle/tipi dell'utente
 * 3. Invia file + contesto tipi al backend Python
 * 4. Python esegue classificazione gerarchica (contesto → tipo → sotto-tipo)
 * 5. Spring Boot determina il risultato finale:
 *    - CLASSIFIED: confidenza alta → auto-classificato
 *    - PARTIAL_CONFIRMATION: mix auto + incerto
 *    - CONFIRMATION_REQUIRED: tutto incerto → popup all'utente
 *    - LOW_CONFIDENCE: nessun tag significativo
 *
 * REGOLA AMBIGUITÀ: se i due punteggi più alti differiscono < 15%
 * viene forzato il popup di conferma.
 */
@Service
public class ClassificationService {

    private static final Logger logger = LoggerFactory.getLogger(ClassificationService.class);

    private static final double HIGH_THRESHOLD = 0.75;
    private static final double MID_THRESHOLD = 0.45;
    private static final double MIN_SHOW = 0.20;
    private static final double AMBIGUITY_DELTA = 0.15;

    @Value("${app.python.url:http://localhost:5001}")
    private String pythonBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Cache analisi pendenti (produzione → Redis)
    private final Map<String, HierarchicalPendingAnalysis> pendingAnalyses = new ConcurrentHashMap<>();

    private final FolderTypeRepository folderTypeRepository;
    private final TokenRepository tokenRepository;
    private final TokenService tokenService;
    private final FileService fileService;

    @Value("${app.storage.path:user-data/outputs/springboot-files}")
    private String storagePath;

    public ClassificationService(
            FolderTypeRepository folderTypeRepository,
            TokenRepository tokenRepository,
            TokenService tokenService,
            FileService fileService
    ) {
        this.folderTypeRepository = folderTypeRepository;
        this.tokenRepository = tokenRepository;
        this.tokenService = tokenService;
        this.fileService = fileService;
    }

    // =====================================================
    // ANALIZZA FILE — punto d'ingresso
    // =====================================================

    public AnalysisResult analyzeFile(String authToken, MultipartFile file, String customTagsJson, String clientIp) throws IOException {
        String owner = extractOwner(authToken);
        // If no authenticated owner, use client IP as owner identifier
        if (!StringUtils.hasText(owner)) {
            owner = clientIp != null ? clientIp : "anonymous";
        }

        // Recupera descrizioni cartelle utente per arricchire il prompt AI
        Map<String, String> userTypeDescriptions = buildUserTypeDescriptions(owner);

        // Serializza per invio all'AI Python
        String customTypesForAI = null;
        if (!userTypeDescriptions.isEmpty()) {
            try {
                customTypesForAI = objectMapper.writeValueAsString(userTypeDescriptions);
            } catch (Exception ignored) {}
        }

        // Merge con custom tags del frontend (se presenti)
        String finalCustomTags = mergeCustomTags(customTagsJson, customTypesForAI);

        // Chiama Python AI con classificazione gerarchica
        PythonHierarchicalResponse pythonResult = callPythonHierarchical(file, finalCustomTags);

        // Processa il risultato gerarchico
        AnalysisResult result = processHierarchicalResult(pythonResult, authToken, file);
        result = applyFolderMatching(owner, result, pythonResult);

        // Salva file bytes su disco e persisti metadati nel DB (owner = authenticated owner o IP)
        // Gestione robusto degli errori con logging
        try {
            String truncatedToken = truncateTokenForAudit(authToken);
            var saved = storeFileAndMetadata(owner, clientIp, truncatedToken, file, result, pythonResult);
            if (saved != null) {
                result.setSavedFileId(saved.getId());
                logger.info("File {} successfully persisted with id={}, owner={}, uploaderIp={}", 
                    file.getOriginalFilename(), saved.getId(), owner, clientIp);
            }
        } catch (CustomException ce) {
            logger.warn("File persistence failed with custom exception for {}: {}", file.getOriginalFilename(), ce.getMessage());
            throw ce;
        } catch (Exception e) {
            logger.error("Unexpected error during file persistence for {}: {}", file.getOriginalFilename(), e.getMessage(), e);
            throw new CustomException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "FILE_SAVE_FAILED", "Failed to save file: " + e.getMessage());
        }

        return result;
    }

    // =====================================================
    // CONFERMA CLASSIFICAZIONE UTENTE
    // =====================================================

    public AnalysisResult confirmClassification(String authToken, ConfirmClassificationRequest request) {
        HierarchicalPendingAnalysis pending = pendingAnalyses.remove(request.getFileId());
        if (pending == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "PENDING_NOT_FOUND",
                    "Analisi pendente non trovata. Potrebbe essere scaduta o già confermata.");
        }

        List<String> confirmedTagNames = request.getConfirmedTags();
        if (confirmedTagNames == null || confirmedTagNames.isEmpty()) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "TAG_INVALID",
                    "Devi selezionare almeno un tag per confermare la classificazione.");
        }

        // Ricostruisce TagEntry dai nomi confermati
        List<TagEntry> confirmedTags = buildConfirmedTagEntries(confirmedTagNames, pending, request.getAdditionalTags());

        List<String> tagNames = confirmedTags.stream()
                .map(TagEntry::getName)
                .collect(Collectors.toList());

        AnalysisResult result = new AnalysisResult();
        result.setType("CLASSIFIED");
        result.setFileId(pending.getFileId());
        result.setFilename(pending.getFilename());
        result.setTags(confirmedTags);
        result.setAssignedTags(tagNames);
        result.setAllTags(pending.getAllTags());
        result.setExtractedData(pending.getExtractedData());
        result.setSuggestedFolder(pending.getSuggestedFolder());
        result.setSummary(pending.getSummary());
        result.setMessage("Classificazione confermata dall'utente con " + tagNames.size() + " tag.");
        return result;
    }

    // =====================================================
    // ELABORAZIONE RISULTATO GERARCHICO
    // =====================================================

    private AnalysisResult processHierarchicalResult(PythonHierarchicalResponse pythonResult, String authToken, MultipartFile file) {
        List<TagEntry> allTags = pythonResult.getTags() != null ? pythonResult.getTags() : List.of();

        List<TagEntry> autoTags = allTags.stream()
                .filter(t -> t.getConfidence() != null && t.getConfidence() >= HIGH_THRESHOLD)
                .collect(Collectors.toList());

        List<TagEntry> confirmTags = allTags.stream()
                .filter(t -> t.getConfidence() != null
                        && t.getConfidence() >= MID_THRESHOLD
                        && t.getConfidence() < HIGH_THRESHOLD)
                .collect(Collectors.toList());

        List<TagEntry> showTags = allTags.stream()
                .filter(t -> t.getConfidence() != null && t.getConfidence() >= MIN_SHOW)
                .sorted(Comparator.comparingDouble(TagEntry::getConfidence).reversed())
                .collect(Collectors.toList());

        boolean isAmbiguous = Boolean.TRUE.equals(pythonResult.getAmbiguous())
                || isLocallyAmbiguous(allTags);

        // Se ambiguo, forza conferma anche se confidence è alta
        if (isAmbiguous && !autoTags.isEmpty()) {
            pendingAnalyses.put(pythonResult.getFileId(),
                    buildPending(pythonResult, autoTags, showTags));
            return buildAmbiguousResult(pythonResult, autoTags, confirmTags, showTags);
        }

        if (!autoTags.isEmpty() && confirmTags.isEmpty()) {
            return buildAutoClassifiedResult(pythonResult, autoTags, showTags);
        }

        if (!autoTags.isEmpty()) {
            pendingAnalyses.put(pythonResult.getFileId(),
                    buildPending(pythonResult, autoTags, showTags));
            return buildPartialConfirmationResult(pythonResult, autoTags, confirmTags, showTags);
        }

        if (!confirmTags.isEmpty()) {
            pendingAnalyses.put(pythonResult.getFileId(),
                    buildPending(pythonResult, List.of(), showTags));
            return buildConfirmationRequiredResult(pythonResult, confirmTags, showTags);
        }

        return buildLowConfidenceResult(pythonResult);
    }

    // =====================================================
    // BUILDER RISULTATI
    // =====================================================

    private AnalysisResult buildAutoClassifiedResult(PythonHierarchicalResponse p,
                                                      List<TagEntry> autoTags, List<TagEntry> allTags) {
        List<String> tagNames = autoTags.stream().map(TagEntry::getName).collect(Collectors.toList());
        HierarchicalClassification hier = p.getHierarchicalClassification();

        AnalysisResult r = new AnalysisResult();
        r.setType("CLASSIFIED");
        r.setFileId(p.getFileId());
        r.setFilename(p.getFilename());
        r.setTags(autoTags);
        r.setAssignedTags(tagNames);
        r.setAllTags(allTags);
        r.setExtractedData(p.getExtractedData());
        r.setSuggestedFolder(p.getSuggestedFolder());
        r.setSummary(p.getSummary());
        r.setHierarchicalClassification(hier);

        String top = autoTags.get(0).getName();
        int pct = (int)(autoTags.get(0).getConfidence() * 100);
        r.setMessage(String.format("Classificato automaticamente: %s (%d%%). %d tag assegnati.",
                top, pct, tagNames.size()));
        return r;
    }

    private AnalysisResult buildAmbiguousResult(PythonHierarchicalResponse p,
                                                 List<TagEntry> autoTags, List<TagEntry> confirmTags,
                                                 List<TagEntry> allTags) {
        AnalysisResult r = new AnalysisResult();
        r.setType("CONFIRMATION_REQUIRED");
        r.setFileId(p.getFileId());
        r.setFilename(p.getFilename());
        r.setTags(List.of());
        r.setAssignedTags(List.of());
        r.setPendingTags(allTags.stream().limit(8).collect(Collectors.toList()));
        r.setAllTags(allTags);
        r.setExtractedData(p.getExtractedData());
        r.setSuggestedFolder(p.getSuggestedFolder());
        r.setSummary(p.getSummary());
        r.setHierarchicalClassification(p.getHierarchicalClassification());
        r.setMessage("La classificazione è ambigua (confidenze simili). Seleziona il tipo corretto.");
        return r;
    }

    private AnalysisResult buildPartialConfirmationResult(PythonHierarchicalResponse p,
                                                           List<TagEntry> autoTags, List<TagEntry> confirmTags,
                                                           List<TagEntry> allTags) {
        List<String> autoNames = autoTags.stream().map(TagEntry::getName).collect(Collectors.toList());
        AnalysisResult r = new AnalysisResult();
        r.setType("PARTIAL_CONFIRMATION");
        r.setFileId(p.getFileId());
        r.setFilename(p.getFilename());
        r.setTags(autoTags);
        r.setAssignedTags(autoNames);
        r.setPendingTags(confirmTags);
        r.setAllTags(allTags);
        r.setExtractedData(p.getExtractedData());
        r.setSuggestedFolder(p.getSuggestedFolder());
        r.setSummary(p.getSummary());
        r.setHierarchicalClassification(p.getHierarchicalClassification());
        r.setMessage(String.format("%d tag certi, %d da confermare. Vuoi confermare i tag incerti?",
                autoTags.size(), confirmTags.size()));
        return r;
    }

    private AnalysisResult buildConfirmationRequiredResult(PythonHierarchicalResponse p,
                                                            List<TagEntry> confirmTags, List<TagEntry> allTags) {
        AnalysisResult r = new AnalysisResult();
        r.setType("CONFIRMATION_REQUIRED");
        r.setFileId(p.getFileId());
        r.setFilename(p.getFilename());
        r.setTags(List.of());
        r.setAssignedTags(List.of());
        r.setPendingTags(confirmTags);
        r.setAllTags(allTags);
        r.setExtractedData(p.getExtractedData());
        r.setSuggestedFolder(p.getSuggestedFolder());
        r.setSummary(p.getSummary());
        r.setHierarchicalClassification(p.getHierarchicalClassification());
        r.setMessage("Classificazione incerta. Seleziona i tag corretti per questo documento.");
        return r;
    }

    private AnalysisResult buildLowConfidenceResult(PythonHierarchicalResponse p) {
        List<TagEntry> lowTags = Optional.ofNullable(p.getTags())
                .orElse(List.of()).stream()
                .filter(t -> t.getConfidence() != null && t.getConfidence() > 0.05)
                .sorted(Comparator.comparingDouble(TagEntry::getConfidence).reversed())
                .limit(5)
                .collect(Collectors.toList());

        AnalysisResult r = new AnalysisResult();
        r.setType("LOW_CONFIDENCE");
        r.setFileId(p.getFileId());
        r.setFilename(p.getFilename());
        r.setTags(List.of());
        r.setAssignedTags(List.of("non-classificato"));
        r.setAllTags(lowTags);
        r.setExtractedData(p.getExtractedData());
        r.setSuggestedFolder("Non classificati");
        r.setSummary(p.getSummary());
        r.setHierarchicalClassification(p.getHierarchicalClassification());
        r.setMessage("Confidenza troppo bassa. File spostato in 'Non classificati'. Puoi classificarlo manualmente.");
        return r;
    }

    // =====================================================
    // CHIAMATA PYTHON BACKEND
    // =====================================================

    private PythonHierarchicalResponse callPythonHierarchical(MultipartFile file, String customTags) throws IOException {
        String url = pythonBaseUrl + "/api/classify";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override public String getFilename() { return file.getOriginalFilename(); }
        };
        body.add("file", resource);
        if (customTags != null) {
            body.add("custom_tags", customTags);
        }

        try {
            ResponseEntity<PythonHierarchicalResponse> response = restTemplate.postForEntity(
                    url, new HttpEntity<>(body, headers), PythonHierarchicalResponse.class);

            if (response.getBody() == null) {
                throw new CustomException(HttpStatus.BAD_GATEWAY, "PYTHON_EMPTY",
                        "Il servizio AI non ha restituito risultati.");
            }
            return response.getBody();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException(HttpStatus.SERVICE_UNAVAILABLE, "ANALYSIS_FAILED",
                    "Servizio AI non disponibile: " + e.getMessage());
        }
    }

    // =====================================================
    // HELPER
    // =====================================================

    private Map<String, String> buildUserTypeDescriptions(String owner) {
        if (!StringUtils.hasText(owner)) return Map.of();
        return folderTypeRepository.findAllByOwnerAndTrashedFalseOrderByFullPathAsc(owner)
                .stream()
                .filter(f -> StringUtils.hasText(f.getDescription()))
                .collect(Collectors.toMap(
                        f -> f.getFullPath(),
                        f -> {
                            String d = f.getDescription();
                            if (StringUtils.hasText(f.getSemanticRules())) {
                                d += " | " + f.getSemanticRules();
                            }
                            return d;
                        },
                        (a, b) -> a
                ));
    }

                private AnalysisResult applyFolderMatching(String owner, AnalysisResult result, PythonHierarchicalResponse pythonResult) {
                    if (!StringUtils.hasText(owner) || result == null) {
                        return result;
                    }

                    List<com.example.documind.entities.folders.FolderType> folders = folderTypeRepository.findAllByOwnerAndTrashedFalseOrderByFullPathAsc(owner)
                            .stream()
                            .filter(folder -> !folder.isSystem())
                            .collect(Collectors.toList());

                    if (folders.isEmpty()) {
                        return result;
                    }

                    String documentText = normalizeForMatch(buildDocumentMatchText(result, pythonResult));
                    if (!StringUtils.hasText(documentText)) {
                        return result;
                    }

                    com.example.documind.entities.folders.FolderType bestFolder = null;
                    double bestScore = 0.0;

                    for (com.example.documind.entities.folders.FolderType folder : folders) {
                        double score = scoreFolderMatch(folder, documentText, result);
                        if (score > bestScore) {
                            bestScore = score;
                            bestFolder = folder;
                        }
                    }

                    if (bestFolder == null || bestScore < 3.0) {
                        return result;
                    }

                    String suggestedFolder = bestFolder.getFullPath();
                    result.setSuggestedFolder(suggestedFolder);

                    String primaryTag = resolvePrimaryFolderTag(bestFolder);
                    if (StringUtils.hasText(primaryTag)) {
                        mergeFolderTag(result, bestFolder, primaryTag);
                    }

                    if (StringUtils.hasText(result.getMessage())) {
                        result.setMessage(result.getMessage() + " Cartella suggerita: " + suggestedFolder + ".");
                    }

                    return result;
                }

                private String buildDocumentMatchText(AnalysisResult result, PythonHierarchicalResponse pythonResult) {
                    StringBuilder builder = new StringBuilder();

                    if (result != null) {
                        appendIfPresent(builder, result.getFilename());
                        appendIfPresent(builder, result.getSummary());
                        appendIfPresent(builder, result.getSuggestedFolder());
                        if (result.getAssignedTags() != null) {
                            result.getAssignedTags().forEach(tag -> appendIfPresent(builder, tag));
                        }
                        if (result.getTags() != null) {
                            result.getTags().forEach(tag -> {
                                if (tag != null) {
                                    appendIfPresent(builder, tag.getName());
                                    appendIfPresent(builder, tag.getDescription());
                                    appendIfPresent(builder, tag.getCategory());
                                }
                            });
                        }
                        if (result.getExtractedData() != null) {
                            flattenObject(result.getExtractedData(), builder);
                        }
                    }

                    if (pythonResult != null) {
                        appendIfPresent(builder, pythonResult.getSummary());
                        appendIfPresent(builder, pythonResult.getFilename());
                        if (pythonResult.getPrimaryTags() != null) {
                            pythonResult.getPrimaryTags().forEach(tag -> appendIfPresent(builder, tag));
                        }
                        if (pythonResult.getTags() != null) {
                            pythonResult.getTags().forEach(tag -> {
                                if (tag != null) {
                                    appendIfPresent(builder, tag.getName());
                                    appendIfPresent(builder, tag.getDescription());
                                    appendIfPresent(builder, tag.getCategory());
                                }
                            });
                        }
                        if (pythonResult.getExtractedData() != null) {
                            flattenObject(pythonResult.getExtractedData(), builder);
                        }
                    }

                    return builder.toString();
                }

                private double scoreFolderMatch(com.example.documind.entities.folders.FolderType folder, String documentText, AnalysisResult result) {
                    double score = 0.0;

                    String fullPath = normalizeForMatch(folder.getFullPath());
                    String name = normalizeForMatch(folder.getName());
                    String description = normalizeForMatch(folder.getDescription());
                    String rules = normalizeForMatch(folder.getSemanticRules());

                    if (StringUtils.hasText(fullPath) && documentText.contains(fullPath)) {
                        score += 5.5;
                    }
                    if (StringUtils.hasText(name) && documentText.contains(name)) {
                        score += 4.0;
                    }

                    score += tokenOverlapScore(documentText, fullPath, 1.25);
                    score += tokenOverlapScore(documentText, name, 1.75);
                    score += tokenOverlapScore(documentText, description, 0.5);
                    score += tokenOverlapScore(documentText, rules, 0.6);

                    if (folder.getAutoTags() != null) {
                        for (String tag : folder.getAutoTags()) {
                            String normalizedTag = normalizeForMatch(tag);
                            if (StringUtils.hasText(normalizedTag) && documentText.contains(normalizedTag)) {
                                score += 4.25;
                            }
                        }
                    }

                    if (result != null && result.getAssignedTags() != null && folder.getAutoTags() != null) {
                        Set<String> assigned = result.getAssignedTags().stream()
                                .filter(StringUtils::hasText)
                                .map(this::normalizeForMatch)
                                .collect(Collectors.toSet());
                        for (String tag : folder.getAutoTags()) {
                            if (assigned.contains(normalizeForMatch(tag))) {
                                score += 3.0;
                            }
                        }
                    }

                    return score;
                }

                private void mergeFolderTag(AnalysisResult result, com.example.documind.entities.folders.FolderType folder, String primaryTag) {
                    List<TagEntry> tags = new ArrayList<>(Optional.ofNullable(result.getTags()).orElse(List.of()));
                    List<String> assignedTags = new ArrayList<>(Optional.ofNullable(result.getAssignedTags()).orElse(List.of()));

                    boolean alreadyPresent = assignedTags.stream()
                            .filter(StringUtils::hasText)
                            .map(this::normalizeForMatch)
                            .anyMatch(tag -> tag.equals(normalizeForMatch(primaryTag)));

                    if (!alreadyPresent) {
                        TagEntry folderTag = new TagEntry();
                        folderTag.setName(primaryTag);
                        folderTag.setConfidence(1.0);
                        folderTag.setCategory("folder");
                        folderTag.setDescription(folder.getDescription());
                        folderTag.setIsDefault(false);
                        tags.add(0, folderTag);
                        assignedTags.add(0, primaryTag);
                    }

                    result.setTags(tags);
                    result.setAssignedTags(assignedTags);
                }

                private String resolvePrimaryFolderTag(com.example.documind.entities.folders.FolderType folder) {
                    if (folder == null) {
                        return null;
                    }
                    if (!folder.isAutoUpdateType() || folder.getAutoTags() == null) {
                        return null;
                    }
                    for (String tag : folder.getAutoTags()) {
                        if (StringUtils.hasText(tag)) {
                            return tag.trim();
                        }
                    }
                    return null;
                }

                private String normalizeForMatch(String input) {
                    if (!StringUtils.hasText(input)) {
                        return "";
                    }
                    return input.toLowerCase(Locale.ROOT)
                            .replaceAll("[^a-z0-9à-öø-ÿ]+", " ")
                            .trim();
                }

                private double tokenOverlapScore(String documentText, String candidate, double weight) {
                    if (!StringUtils.hasText(candidate)) {
                        return 0.0;
                    }

                    double score = 0.0;
                    for (String token : candidate.split("\\s+")) {
                        if (token.length() < 4) {
                            continue;
                        }
                        if (documentText.contains(token)) {
                            score += weight;
                        }
                    }
                    return score;
                }

                private void appendIfPresent(StringBuilder builder, String value) {
                    if (StringUtils.hasText(value)) {
                        builder.append(' ').append(value).append(' ');
                    }
                }

                private void flattenObject(Object value, StringBuilder builder) {
                    if (value == null) {
                        return;
                    }
                    if (value instanceof Map<?, ?> map) {
                        for (Map.Entry<?, ?> entry : map.entrySet()) {
                            appendIfPresent(builder, entry.getKey() != null ? String.valueOf(entry.getKey()) : null);
                            flattenObject(entry.getValue(), builder);
                        }
                        return;
                    }
                    if (value instanceof Collection<?> collection) {
                        for (Object item : collection) {
                            flattenObject(item, builder);
                        }
                        return;
                    }
                    appendIfPresent(builder, String.valueOf(value));
                }


    private String mergeCustomTags(String frontendTags, String userTypes) throws IOException {
        if (!StringUtils.hasText(frontendTags) && !StringUtils.hasText(userTypes)) return null;
        Map<String, Object> merged = new LinkedHashMap<>();
        if (StringUtils.hasText(userTypes)) {
            try {
                Map<?, ?> ut = objectMapper.readValue(userTypes, Map.class);
                for (Map.Entry<?, ?> entry : ut.entrySet()) {
                    if (entry.getKey() != null) {
                        merged.put(String.valueOf(entry.getKey()), entry.getValue());
                    }
                }
            } catch (Exception ignored) {}
        }
        if (StringUtils.hasText(frontendTags)) {
            try {
                Object ft = objectMapper.readValue(frontendTags, Object.class);
                if (ft instanceof Map<?, ?> map) {
                    for (Map.Entry<?, ?> entry : map.entrySet()) {
                        if (entry.getKey() != null) {
                            merged.put(String.valueOf(entry.getKey()), entry.getValue());
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return objectMapper.writeValueAsString(merged);
    }

    private boolean isLocallyAmbiguous(List<TagEntry> tags) {
        if (tags == null || tags.size() < 2) return false;
        List<Double> vals = tags.stream()
                .filter(t -> t.getConfidence() != null)
                .map(TagEntry::getConfidence)
                .sorted(Comparator.reverseOrder())
                .limit(2)
                .collect(Collectors.toList());
        if (vals.size() < 2) return false;
        return Math.abs(vals.get(0) - vals.get(1)) < AMBIGUITY_DELTA && vals.get(0) > 0.3;
    }

    private HierarchicalPendingAnalysis buildPending(PythonHierarchicalResponse p,
                                                      List<TagEntry> autoTags, List<TagEntry> allTags) {
        HierarchicalPendingAnalysis pending = new HierarchicalPendingAnalysis();
        pending.setFileId(p.getFileId());
        pending.setFilename(p.getFilename());
        pending.setAllTags(allTags);
        pending.setAutoTags(autoTags);
        pending.setExtractedData(p.getExtractedData());
        pending.setSuggestedFolder(p.getSuggestedFolder());
        pending.setSummary(p.getSummary());
        return pending;
    }

    private FileResponse storeFileAndMetadata(String owner, String uploaderIp, String uploaderToken, MultipartFile file, AnalysisResult result, PythonHierarchicalResponse pythonResult) throws Exception {
        if (file == null || file.isEmpty()) return null;

        byte[] bytes = file.getBytes();
        Path dir = Paths.get(storagePath);
        if (!Files.exists(dir)) Files.createDirectories(dir);

        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String saveName = (pythonResult != null && pythonResult.getFileId() != null ? pythonResult.getFileId() + "_" : "") + original;
        Path target = dir.resolve(saveName);
        Files.write(target, bytes);
        logger.debug("File bytes written to disk: {}", target.toAbsolutePath());

        // compute sha-256
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) sb.append(String.format("%02x", b));
        String hex = sb.toString();

        // determine tags to persist
        List<String> tags = new ArrayList<>();
        if (result.getAssignedTags() != null && !result.getAssignedTags().isEmpty()) {
            tags.addAll(result.getAssignedTags());
        } else if (result.getAllTags() != null && !result.getAllTags().isEmpty()) {
            for (TagEntry t : result.getAllTags()) {
                if (t != null && t.getName() != null) tags.add(t.getName());
            }
        }

        FileCreateRequest req = new FileCreateRequest();
        req.setName(original);
        req.setPath(target.toAbsolutePath().toString());
            req.setFolderPath(StringUtils.hasText(result.getSuggestedFolder()) ? result.getSuggestedFolder() : "Non classificati");
        req.setMimeType(file.getContentType());
        req.setSize(file.getSize());
        req.setHash(hex);
        req.setTags(tags);
        // semantic info if available
        if (result.getHierarchicalClassification() != null) {
            // no direct mapping here; leave semantic fields null for now
        }

        try {
            return fileService.createFileWithOwner(owner, uploaderIp, uploaderToken, req);
        } catch (CustomException ce) {
            // rethrow to allow upper level to handle
            logger.warn("FileService.createFileWithOwner failed: {}", ce.getMessage());
            throw ce;
        }
    }

    private String truncateTokenForAudit(String token) {
        if (!StringUtils.hasText(token)) return null;
        // Store only first 50 chars for audit trail (security best practice)
        return token.length() > 50 ? token.substring(0, 50) : token;
    }

    private List<TagEntry> buildConfirmedTagEntries(List<String> names,
                                                     HierarchicalPendingAnalysis pending,
                                                     List<String> additionalTags) {
        Map<String, TagEntry> byName = new LinkedHashMap<>();
        if (pending.getAllTags() != null) {
            for (TagEntry t : pending.getAllTags()) {
                byName.put(t.getName(), t);
            }
        }

        List<TagEntry> result = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        for (String name : names) {
            if (seen.add(name)) {
                TagEntry t = byName.getOrDefault(name, makeCustomTag(name));
                result.add(t);
            }
        }
        if (additionalTags != null) {
            for (String name : additionalTags) {
                String n = name.trim().toLowerCase();
                if (seen.add(n)) {
                    result.add(makeCustomTag(n));
                }
            }
        }
        return result;
    }

    private TagEntry makeCustomTag(String name) {
        TagEntry t = new TagEntry();
        t.setName(name);
        t.setConfidence(1.0);
        t.setCategory("custom");
        t.setIsDefault(false);
        return t;
    }

    private String extractOwner(String token) {
        if (!StringUtils.hasText(token)) return null;
        if (!tokenService.isValidToken(token)) return null;
        Optional<Token> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) return null;
        var user = tokenOpt.get().getUser();
        return user != null ? user.getEmail() : null;
    }

    // =====================================================
    // INNER CLASSES
    // =====================================================

    /** Risposta estesa del backend Python con classificazione gerarchica. */
    public static class PythonHierarchicalResponse extends PythonTagResponse {
        private HierarchicalClassification hierarchicalClassification;
        private String suggestedFolder;
        private Boolean ambiguous;

        public HierarchicalClassification getHierarchicalClassification() { return hierarchicalClassification; }
        public void setHierarchicalClassification(HierarchicalClassification h) { this.hierarchicalClassification = h; }
        public String getSuggestedFolder() { return suggestedFolder; }
        public void setSuggestedFolder(String s) { this.suggestedFolder = s; }
        public Boolean getAmbiguous() { return ambiguous; }
        public void setAmbiguous(Boolean a) { this.ambiguous = a; }
    }

    /** Analisi pendente in cache. */
    public static class HierarchicalPendingAnalysis {
        private String fileId, filename, suggestedFolder, summary;
        private List<TagEntry> allTags, autoTags;
        private Map<String, Object> extractedData;

        public String getFileId() { return fileId; }
        public void setFileId(String v) { this.fileId = v; }
        public String getFilename() { return filename; }
        public void setFilename(String v) { this.filename = v; }
        public String getSuggestedFolder() { return suggestedFolder; }
        public void setSuggestedFolder(String v) { this.suggestedFolder = v; }
        public String getSummary() { return summary; }
        public void setSummary(String v) { this.summary = v; }
        public List<TagEntry> getAllTags() { return allTags; }
        public void setAllTags(List<TagEntry> v) { this.allTags = v; }
        public List<TagEntry> getAutoTags() { return autoTags; }
        public void setAutoTags(List<TagEntry> v) { this.autoTags = v; }
        public Map<String, Object> getExtractedData() { return extractedData; }
        public void setExtractedData(Map<String, Object> v) { this.extractedData = v; }
    }
}
