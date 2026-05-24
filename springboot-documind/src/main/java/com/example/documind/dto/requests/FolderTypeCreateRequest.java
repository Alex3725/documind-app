package com.example.documind.dto.requests;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class FolderTypeCreateRequest {
    private String name;
    private String fullPath;
    private String parentPath;
    private String description;
    private String semanticRules;
    private String icon;
    private String color;
    private List<String> autoTags;
    private Boolean autoUpdateType;
}
