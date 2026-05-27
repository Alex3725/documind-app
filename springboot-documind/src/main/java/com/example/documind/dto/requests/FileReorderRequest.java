package com.example.documind.dto.requests;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class FileReorderRequest {
    private List<FileReorderItemRequest> files;
}
