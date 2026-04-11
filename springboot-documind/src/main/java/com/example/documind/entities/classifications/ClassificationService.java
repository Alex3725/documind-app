package com.example.documind.entities.classifications;

import com.example.documind.configurations.exceptions.CustomException;
import com.example.documind.dto.classifications.*;
import com.example.documind.dto.requests.ConfirmClassificationRequest;
import com.example.documind.dto.responses.PythonTagResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * ClassificationService — logica multi-tag con confidence score.
 *
 * REGOLE DI ASSEGNAZIONE:
 *   confidence >= HIGH_THRESHOLD (0.75) → tag assegnato automaticamente
 *   confidence in [MID_THRESHOLD, HIGH_THRESHOLD) → DA CONFERMARE (popup)
 *   confidence < MID_THRESHOLD → non mostrato / ignorato
 *
 * Un file può avere MOLTI tag: le confidence sono indipendenti e NON sommano a 100%.
 */
@Service
public class ClassificationService {

    // Soglie di decisione
    private static final double HIGH_THRESHOLD   = 0.75;  // auto-accetta
    private static final double MID_THRESHOLD    = 0.45;  // chiede conferma
    private static final double MIN_SHOW_THRESHOLD = 0.20; // mostra nel popup

    @Value("${app.python.url:http://localhost:5001}")
    private String pythonBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Cache analisi pendenti (produzione: Redis / DB)
    private final Map<String, PythonTagResponse> pendingAnalyses = new ConcurrentHashMap<>();

    // =====================================================
    // ANALIZZA FILE
    // =====================================================

    public AnalysisResult analyzeFile(String authToken, MultipartFile file, String customTagsJson) throws IOException {
        // 1. Chiama Python AI
        PythonTagResponse pythonResult = callPythonClassify(file, customTagsJson);

        // 2. Separa tag in categorie
        List<TagEntry> allTags = pythonResult.getTags() != null
                ? pythonResult.getTags()
                : List.of();

        List<TagEntry> autoTags = allTags.stream()
                .filter(t -> t.getConfidence() != null && t.getConfidence() >= HIGH_THRESHOLD)
                .collect(Collectors.toList());

        List<TagEntry> confirmTags = allTags.stream()
                .filter(t -> t.getConfidence() != null
                        && t.getConfidence() >= MID_THRESHOLD
                        && t.getConfidence() < HIGH_THRESHOLD)
                .collect(Collectors.toList());

        List<TagEntry> showTags = allTags.stream()
                .filter(t -> t.getConfidence() != null && t.getConfidence() >= MIN_SHOW_THRESHOLD)
                .sorted(Comparator.comparingDouble(TagEntry::getConfidence).reversed())
                .collect(Collectors.toList());

        // 3. Determina tipo risultato
        if (!autoTags.isEmpty() && confirmTags.isEmpty()) {
            // Tutti i tag rilevanti sono sopra soglia alta → CLASSIFIED
            return buildAutoClassifiedResult(pythonResult, autoTags, showTags, authToken, file);
        }

        if (!autoTags.isEmpty() && !confirmTags.isEmpty()) {
            // Mix: alcuni auto, altri da confermare → PARTIAL_CONFIRMATION
            pendingAnalyses.put(pythonResult.getFileId(), pythonResult);
            return buildPartialConfirmationResult(pythonResult, autoTags, confirmTags, showTags);
        }

        if (!confirmTags.isEmpty()) {
            // Solo tag incerti → CONFIRMATION_REQUIRED
            pendingAnalyses.put(pythonResult.getFileId(), pythonResult);
            return buildConfirmationRequiredResult(pythonResult, confirmTags, showTags);
        }

        // Nessun tag significativo → LOW_CONFIDENCE
        return buildLowConfidenceResult(pythonResult);
    }

    // =====================================================
    // CONFERMA CLASSIFICAZIONE UTENTE
    // =====================================================

    public AnalysisResult confirmClassification(String authToken, ConfirmClassificationRequest request) throws IOException {
        PythonTagResponse cached = pendingAnalyses.remove(request.getFileId());
        if (cached == null) {
            throw new CustomException(
                HttpStatus.NOT_FOUND,
                "PENDING_NOT_FOUND",
                "Analisi pendente non trovata. Potrebbe essere scaduta o già confermata."
            );
        }

        // Valida tag confermati dall'utente
        List<String> confirmedTagNames = request.getConfirmedTags();
        if (confirmedTagNames == null || confirmedTagNames.isEmpty()) {
            throw new CustomException(
                HttpStatus.BAD_REQUEST,
                "TAG_INVALID",
                "Devi selezionare almeno un tag per confermare la classificazione."
            );
        }

        // Ricostruisce tag entry dai nomi confermati
        List<TagEntry> confirmedTags = confirmedTagNames.stream()
                .map(name -> {
                    TagEntry original = cached.getTags().stream()
                            .filter(t -> t.getName().equals(name))
                            .findFirst()
                            .orElse(null);
                    if (original != null) return original;
                    // Tag custom non presente nella risposta AI
                    TagEntry custom = new TagEntry();
                    custom.setName(name);
                    custom.setConfidence(1.0); // confermato manualmente = max confidence
                    custom.setCategory("custom");
                    return custom;
                })
                .collect(Collectors.toList());

        // Aggiunge tag addizionali se presenti
        if (request.getAdditionalTags() != null) {
            request.getAdditionalTags().stream()
                    .map(name -> {
                        TagEntry t = new TagEntry();
                        t.setName(name.trim().toLowerCase());
                        t.setConfidence(1.0);
                        t.setCategory("custom");
                        return t;
                    })
                    .forEach(confirmedTags::add);
        }

        // De-duplica
        List<TagEntry> finalTags = confirmedTags.stream()
                .collect(Collectors.toMap(TagEntry::getName, t -> t, (a, b) -> a))
                .values().stream()
                .collect(Collectors.toList());

        List<String> tagNames = finalTags.stream()
                .map(TagEntry::getName)
                .collect(Collectors.toList());

        AnalysisResult result = new AnalysisResult();
        result.setType("CLASSIFIED");
        result.setFileId(cached.getFileId());
        result.setFilename(cached.getFilename());
        result.setTags(finalTags);
        result.setAssignedTags(tagNames);
        result.setAllTags(cached.getTags());
        result.setExtractedData(cached.getExtractedData());
        result.setSuggestedFolder(mapTagsToFolder(tagNames));
        result.setMessage("Classificazione confermata con " + tagNames.size() + " tag.");
        return result;
    }

    // =====================================================
    // BUILDER RISULTATI
    // =====================================================

    private AnalysisResult buildAutoClassifiedResult(
            PythonTagResponse pythonResult,
            List<TagEntry> autoTags,
            List<TagEntry> allShowTags,
            String authToken,
            MultipartFile file
    ) throws IOException {
        List<String> tagNames = autoTags.stream()
                .map(TagEntry::getName)
                .collect(Collectors.toList());

        AnalysisResult result = new AnalysisResult();
        result.setType("CLASSIFIED");
        result.setFileId(pythonResult.getFileId());
        result.setFilename(pythonResult.getFilename());
        result.setTags(autoTags);
        result.setAssignedTags(tagNames);
        result.setAllTags(allShowTags);
        result.setExtractedData(pythonResult.getExtractedData());
        result.setSuggestedFolder(mapTagsToFolder(tagNames));
        result.setSummary(pythonResult.getSummary());

        String topTag = autoTags.get(0).getName();
        int pct = (int)(autoTags.get(0).getConfidence() * 100);
        result.setMessage(String.format(
            "File classificato automaticamente. Tag principale: %s (%d%%). Tag totali: %d.",
            topTag, pct, tagNames.size()
        ));
        return result;
    }

    private AnalysisResult buildPartialConfirmationResult(
            PythonTagResponse pythonResult,
            List<TagEntry> autoTags,
            List<TagEntry> confirmTags,
            List<TagEntry> allShowTags
    ) {
        List<String> autoTagNames = autoTags.stream()
                .map(TagEntry::getName)
                .collect(Collectors.toList());

        AnalysisResult result = new AnalysisResult();
        result.setType("PARTIAL_CONFIRMATION");
        result.setFileId(pythonResult.getFileId());
        result.setFilename(pythonResult.getFilename());
        result.setTags(autoTags);
        result.setAssignedTags(autoTagNames);
        result.setPendingTags(confirmTags);
        result.setAllTags(allShowTags);
        result.setExtractedData(pythonResult.getExtractedData());
        result.setSummary(pythonResult.getSummary());
        result.setMessage(String.format(
            "Trovati %d tag certi e %d da confermare. Confermi i tag incerti?",
            autoTags.size(), confirmTags.size()
        ));
        return result;
    }

    private AnalysisResult buildConfirmationRequiredResult(
            PythonTagResponse pythonResult,
            List<TagEntry> confirmTags,
            List<TagEntry> allShowTags
    ) {
        AnalysisResult result = new AnalysisResult();
        result.setType("CONFIRMATION_REQUIRED");
        result.setFileId(pythonResult.getFileId());
        result.setFilename(pythonResult.getFilename());
        result.setTags(List.of());
        result.setAssignedTags(List.of());
        result.setPendingTags(confirmTags);
        result.setAllTags(allShowTags);
        result.setExtractedData(pythonResult.getExtractedData());
        result.setSummary(pythonResult.getSummary());
        result.setMessage("Non siamo sicuri della classificazione. Seleziona i tag corretti.");
        return result;
    }

    private AnalysisResult buildLowConfidenceResult(PythonTagResponse pythonResult) {
        List<TagEntry> lowTags = pythonResult.getTags() != null
                ? pythonResult.getTags().stream()
                        .filter(t -> t.getConfidence() != null && t.getConfidence() > 0.05)
                        .sorted(Comparator.comparingDouble(TagEntry::getConfidence).reversed())
                        .limit(5)
                        .collect(Collectors.toList())
                : List.of();

        AnalysisResult result = new AnalysisResult();
        result.setType("LOW_CONFIDENCE");
        result.setFileId(pythonResult.getFileId());
        result.setFilename(pythonResult.getFilename());
        result.setTags(List.of());
        result.setAssignedTags(List.of("non-classificato"));
        result.setAllTags(lowTags);
        result.setExtractedData(pythonResult.getExtractedData());
        result.setSummary(pythonResult.getSummary());
        result.setSuggestedFolder("Non classificati");
        result.setMessage("Confidenza troppo bassa per classificare automaticamente. File spostato in 'Non classificati'.");
        return result;
    }

    // =====================================================
    // MAPPING TAG → CARTELLA
    // =====================================================

    private String mapTagsToFolder(List<String> tags) {
        if (tags == null || tags.isEmpty()) return "Non classificati";

        // Mappa tag → cartella con priorità
        Map<String, String> tagToFolder = Map.ofEntries(
            Map.entry("fattura", "Finanza"),
            Map.entry("ricevuta", "Finanza"),
            Map.entry("busta_paga", "Finanza"),
            Map.entry("documento_finanziario", "Finanza"),
            Map.entry("contratto", "Legale"),
            Map.entry("documento_legale", "Legale"),
            Map.entry("documento_identita", "Personale"),
            Map.entry("curriculum", "HR"),
            Map.entry("documento_medico", "Salute"),
            Map.entry("ricetta_medica", "Salute"),
            Map.entry("codice_sorgente", "Tech"),
            Map.entry("documento_tecnico", "Tech"),
            Map.entry("email", "Comunicazioni"),
            Map.entry("verbale", "Business"),
            Map.entry("relazione", "Business"),
            Map.entry("presentazione", "Business"),
            Map.entry("poesia", "Letteratura"),
            Map.entry("narrativa", "Letteratura"),
            Map.entry("foglio_calcolo", "Dati")
        );

        for (String tag : tags) {
            String folder = tagToFolder.get(tag);
            if (folder != null) return folder;
        }
        return "Altro";
    }

    // =====================================================
    // CHIAMATA PYTHON BACKEND
    // =====================================================

    private PythonTagResponse callPythonClassify(MultipartFile file, String customTagsJson) throws IOException {
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
        if (customTagsJson != null) {
            body.add("custom_tags", customTagsJson);
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<PythonTagResponse> response = restTemplate.postForEntity(
                    url,
                    requestEntity,
                    PythonTagResponse.class
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
                "ANALYSIS_FAILED",
                "Servizio AI non disponibile: " + e.getMessage()
            );
        }
    }
}
