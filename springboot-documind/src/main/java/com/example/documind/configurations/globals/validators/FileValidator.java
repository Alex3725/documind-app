package com.example.documind.configurations.globals.validators;

import com.example.documind.dto.requests.FileCreateRequest;
import com.example.documind.dto.requests.FileUpdateRequest;
import com.example.documind.entities.files.type.FileCategory;
import com.example.documind.entities.files.type.FileSubType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class FileValidator {
	public void validateCreateRequest(FileCreateRequest request) {
		if (request == null) {
			throw new IllegalArgumentException("Request body is required.");
		}

		validateName(request.getName());
		validatePath(request.getPath());
		validateHash(request.getHash());
		validateSize(request.getSize());
		validateSemanticConfidence(request.getSemanticConfidence());
		validateCategoryCoherence(request.getCategory(), request.getSubType());
	}

	public void validateUpdateRequest(FileUpdateRequest request) {
		if (request == null) {
			throw new IllegalArgumentException("Request body is required.");
		}

		validateSize(request.getSize());
		validateSemanticConfidence(request.getSemanticConfidence());
		validateCategoryCoherence(request.getCategory(), request.getSubType());
	}

	public void validateCategoryAndSubType(FileCategory category, FileSubType subType) {
		validateCategoryCoherence(category, subType);
	}

	public List<String> normalizeTags(List<String> tags) {
		if (tags == null) {
			return List.of();
		}

		Set<String> uniqueTags = new LinkedHashSet<>();
		for (String tag : tags) {
			if (!StringUtils.hasText(tag)) {
				continue;
			}
			uniqueTags.add(tag.trim().toLowerCase());
		}
		return new ArrayList<>(uniqueTags);
	}

	private void validateName(String name) {
		if (!StringUtils.hasText(name)) {
			throw new IllegalArgumentException("File name is required.");
		}
		if (name.length() > 255) {
			throw new IllegalArgumentException("File name is too long (max 255).");
		}
	}

	private void validatePath(String path) {
		if (!StringUtils.hasText(path)) {
			throw new IllegalArgumentException("File path is required.");
		}
	}

	private void validateHash(String hash) {
		if (!StringUtils.hasText(hash)) {
			throw new IllegalArgumentException("File hash is required.");
		}
		if (hash.length() < 16 || hash.length() > 128) {
			throw new IllegalArgumentException("File hash length must be between 16 and 128 chars.");
		}
	}

	private void validateSize(Long size) {
		if (size != null && size < 0) {
			throw new IllegalArgumentException("File size must be >= 0.");
		}
	}

	private void validateSemanticConfidence(Double confidence) {
		if (confidence != null && (confidence < 0.0 || confidence > 1.0)) {
			throw new IllegalArgumentException("Semantic confidence must be between 0 and 1.");
		}
	}

	private void validateCategoryCoherence(FileCategory category, FileSubType subType) {
		if (subType == null || category == null) {
			return;
		}

		FileCategory expected = expectedCategoryFor(subType);
		if (expected != category) {
			throw new IllegalArgumentException("Invalid category for provided file subtype.");
		}
	}

	private FileCategory expectedCategoryFor(FileSubType subType) {
		return switch (subType) {
			case TEXT, PDF, WORD, SPREADSHEET, PRESENTATION, RICH_TEXT, MARKDOWN, XML_DOC -> FileCategory.DOCUMENT;
			case IMAGE_RASTER, IMAGE_VECTOR, AUDIO_LOSSY, AUDIO_LOSSLESS, VIDEO_COMPRESSED, VIDEO_RAW -> FileCategory.MEDIA;
			case ZIP, TAR, GZIP, BZIP2, XZ, SEVEN_Z, RAR, ISO_ARCHIVE -> FileCategory.ARCHIVE;
			case SOURCE_CODE, SCRIPT_SHELL, SCRIPT_GENERAL, CONFIG_JSON, CONFIG_YAML, CONFIG_TOML, CONFIG_INI -> FileCategory.CODE;
			case EXECUTABLE_BINARY, SHARED_LIBRARY, BYTECODE -> FileCategory.EXECUTABLE;
			case DATABASE_SQL, DATABASE_NOSQL, DATA_JSON, DATA_XML, DATA_CSV, DATA_PARQUET, DATA_BINARY -> FileCategory.DATA;
			case LOG, TEMP, CACHE, LOCK_FILE -> FileCategory.SYSTEM;
			case ENCRYPTED_FILE, PRIVATE_KEY, PUBLIC_KEY, CERTIFICATE -> FileCategory.SECURITY;
			case FONT, EBOOK, DISK_IMAGE, TORRENT, UNKNOWN -> FileCategory.OTHER;
		};
	}
}
