package com.example.documind.dto.responses;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class FolderTypeResponse {
    private Long id;
    private String name;
    private String fullPath;
    private String parentPath;
    private String description;
    private String semanticRules;
    private String icon;
    private String color;
    private List<String> autoTags;
    private boolean autoUpdateType;
    private boolean system;
    private boolean trashed;
    private LocalDateTime trashedAt;
    private int fileCount;
    private int depth;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
