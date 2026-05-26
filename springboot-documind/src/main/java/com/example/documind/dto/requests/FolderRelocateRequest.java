package com.example.documind.dto.requests;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FolderRelocateRequest {
    private String targetParentPath;
    private String newName;
}