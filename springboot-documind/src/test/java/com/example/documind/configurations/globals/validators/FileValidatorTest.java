package com.example.documind.configurations.globals.validators;

import com.example.documind.dto.requests.FileCreateRequest;
import com.example.documind.entities.files.type.FileCategory;
import com.example.documind.entities.files.type.FileSubType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FileValidatorTest {

    private final FileValidator fileValidator = new FileValidator();

    @Test
    void validateCreateRequest_shouldFailWhenCategoryDoesNotMatchSubtype() {
        FileCreateRequest request = baseRequest();
        request.setCategory(FileCategory.MEDIA);
        request.setSubType(FileSubType.PDF);

        assertThrows(IllegalArgumentException.class, () -> fileValidator.validateCreateRequest(request));
    }

    @Test
    void validateCreateRequest_shouldFailWhenHashTooShort() {
        FileCreateRequest request = baseRequest();
        request.setHash("abc");

        assertThrows(IllegalArgumentException.class, () -> fileValidator.validateCreateRequest(request));
    }

    @Test
    void normalizeTags_shouldTrimLowercaseAndDeduplicate() {
        List<String> normalized = fileValidator.normalizeTags(List.of(" Finance ", "finance", "INVOICE"));

        assertEquals(List.of("finance", "invoice"), normalized);
    }

    private FileCreateRequest baseRequest() {
        FileCreateRequest request = new FileCreateRequest();
        request.setName("invoice-2026.pdf");
        request.setPath("/tmp/invoice-2026.pdf");
        request.setHash("1234567890abcdef1234567890abcdef");
        request.setSize(42L);
        request.setCategory(FileCategory.DOCUMENT);
        request.setSubType(FileSubType.PDF);
        return request;
    }
}

