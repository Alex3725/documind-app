package com.example.documind.dto.requests;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FileReorderItemRequest {
    private String fileId;
    private String newTag;
    private String currentPath;
}
