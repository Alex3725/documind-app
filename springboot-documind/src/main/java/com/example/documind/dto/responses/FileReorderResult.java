package com.example.documind.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FileReorderResult {
    private String fileId;
    private String assignedTag;
    private String oldPath;
    private String newPath;
    private String action;
}
