package com.example.documind.dto.classifications;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ConfirmClassificationRequest {

    @JsonProperty("file_id")
    private String fileId;

    /**
     * Il tipo confermato dall'utente
     */
    @JsonProperty("confirmed_type")
    private String confirmedType;

    /**
     * Tag custom aggiuntivi (opzionale)
     */
    private java.util.List<String> additionalTags;
}
