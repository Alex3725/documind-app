package com.example.documind.dto.requests;

import com.example.documind.entities.files.type.FileCategory;
import com.example.documind.entities.files.type.FileSemanticType;
import com.example.documind.entities.files.type.FileSubType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class FileUpdateRequest {
    private String name;
    private String path;
    private FileCategory category;
    private FileSubType subType;
    private String mimeType;
    private Long size;
    private List<String> tags;
    private FileSemanticType semanticType;
    private Double semanticConfidence;
    private Map<FileSemanticType, Double> semanticScores;
    private Boolean compressed;
    private Boolean encrypted;
}

