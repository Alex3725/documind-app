package com.example.documind.entities.classifications;

import com.example.documind.dto.classifications.AnalysisResult;
import com.example.documind.dto.classifications.ConfirmClassificationRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/classify")
public class ClassificationController {

    private final ClassificationService classificationService;

    public ClassificationController(ClassificationService classificationService) {
        this.classificationService = classificationService;
    }

    /**
     * Carica e analizza un file.
     * Ritorna:
     * - CLASSIFIED: classificazione automatica (confidence > 60%)
     * - CONFIRMATION_REQUIRED: confidenza 50-60%, utente deve confermare
     * - LOW_CONFIDENCE: confidenza < 50%, file in "Uncategorized"
     */
    @PostMapping("/analyze")
    public ResponseEntity<AnalysisResult> analyzeFile(
            @CookieValue(name = "authentication-token", required = false) String token,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        AnalysisResult result = classificationService.analyzeFile(token, file);
        return ResponseEntity.ok(result);
    }

    /**
     * Conferma la classificazione scelta dall'utente
     * (usato dopo CONFIRMATION_REQUIRED).
     */
    @PostMapping("/confirm")
    public ResponseEntity<AnalysisResult> confirmClassification(
            @CookieValue(name = "authentication-token", required = false) String token,
            @RequestBody ConfirmClassificationRequest request
    ) throws IOException {
        AnalysisResult result = classificationService.confirmClassification(token, request);
        return ResponseEntity.ok(result);
    }
}
