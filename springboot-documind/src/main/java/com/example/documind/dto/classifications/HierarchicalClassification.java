package com.example.documind.dto.classifications;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * HierarchicalClassification — Risultato della classificazione gerarchica a 3 livelli.
 *
 * Contiene i punteggi e il risultato top per ognuno dei 3 livelli:
 *   1. Contesto (work, personal, study, leisure)
 *   2. Tipo di contenuto (code, document, notes, ...)
 *   3. Sotto-tipo (java, invoice, poetry, ...)
 */
@Getter
@Setter
@NoArgsConstructor
public class HierarchicalClassification {

    @JsonProperty("step1_context")
    private ClassificationLevel step1Context;

    @JsonProperty("step2_content_type")
    private ClassificationLevel step2ContentType;

    @JsonProperty("step3_sub_type")
    private ClassificationLevel step3SubType;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ClassificationLevel {
        /** Punteggi per ogni categoria di questo livello */
        private Map<String, Double> scores;

        /** Categoria con punteggio più alto */
        private String top;

        /** Motivazione (dal modello AI) */
        private String reasoning;
    }
}
