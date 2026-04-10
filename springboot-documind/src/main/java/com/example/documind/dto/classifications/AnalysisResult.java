package com.example.documind.dto.classifications;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResult {

    /**
     * CLASSIFIED       → classificazione automatica accettata (confidence > 0.6)
     * CONFIRMATION_REQUIRED → confidenza 0.5-0.6, l'utente deve confermare
     * LOW_CONFIDENCE   → confidenza < 0.5, file in "Uncategorized"
     */
    private String type;

    @JsonProperty("file_id")
    private String fileId;

    private String filename;

    /**
     * Classificazioni top (solo quelle con confidence > 0.4)
     */
    private List<ClassificationEntry> classifications;

    /**
     * Tag assegnati automaticamente (confidence > 0.6)
     */
    private List<String> assignedTags;

    /**
     * Opzioni da mostrare all'utente nel popup di conferma
     */
    private List<ClassificationEntry> options;

    /**
     * Messaggio da mostrare all'utente
     */
    private String message;

    /**
     * Dati estratti dal documento
     */
    @JsonProperty("extracted_data")
    private Map<String, Object> extractedData;

    /**
     * Cartella suggerita
     */
    private String suggestedFolder;

    /**
     * ID del file salvato nel DB (dopo createFile)
     */
    @JsonProperty("saved_file_id")
    private Long savedFileId;
}
