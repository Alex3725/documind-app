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
     * CLASSIFIED            → classificazione automatica completata
     * PARTIAL_CONFIRMATION  → alcuni tag certi, altri da confermare
     * CONFIRMATION_REQUIRED → tutti i tag sono incerti, utente deve scegliere
     * LOW_CONFIDENCE        → nessun tag significativo
     */
    private String type;

    @JsonProperty("file_id")
    private String fileId;

    private String filename;

    /** Tag assegnati automaticamente (confidence >= 0.75) */
    private List<TagEntry> tags;

    /** Nomi dei tag assegnati */
    @JsonProperty("assigned_tags")
    private List<String> assignedTags;

    /** Tag in attesa di conferma (confidence 0.45-0.75) */
    @JsonProperty("pending_tags")
    private List<TagEntry> pendingTags;

    /** Tutti i tag con score > 0.20 (per mostrare nel popup) */
    @JsonProperty("all_tags")
    private List<TagEntry> allTags;

    private String summary;

    /**
     * Messaggio da mostrare all'utente
     */
    private String message;

    /**
     * Dati estratti dal documento
     */
    @JsonProperty("extracted_data")
    private Map<String, Object> extractedData;

    /** Cartella suggerita */
    @JsonProperty("suggested_folder")
    private String suggestedFolder;

    /**
     * ID del file salvato nel DB (dopo createFile)
     */
    @JsonProperty("saved_file_id")
    private Long savedFileId;
}
