package com.example.documind.dto.classifications;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TagEntry {
    private String name;
    private Double confidence;
    private String description;
    private String category;
    private Boolean isDefault;
}
