package com.example.documind.dto.requests;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ConfirmClassificationRequest {

    @JsonProperty("file_id")
    private String fileId;

    /** Tag confermati dall'utente */
    @JsonProperty("confirmed_tags")
    private List<String> confirmedTags;

    /**
     * Tag custom aggiuntivi (opzionale)
     */
    @JsonProperty("additional_tags")
    private List<String> additionalTags;
}
