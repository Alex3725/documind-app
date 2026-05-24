package com.example.documind.configurations.globals.mappers;

import com.example.documind.dto.requests.FileCreateRequest;
import com.example.documind.dto.responses.FileResponse;
import com.example.documind.entities.files.File;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;

@Component
public class FileMapper {
	public File toEntity(FileCreateRequest request) {
		File file = new File();
		file.setName(request.getName());
		file.setPath(request.getPath());
		file.setFolderPath(request.getFolderPath());
		file.setCategory(request.getCategory());
		file.setSubType(request.getSubType());
		file.setMimeType(request.getMimeType());
		file.setSize(request.getSize());
		file.setHash(request.getHash());
		file.setTags(request.getTags() == null ? null : new ArrayList<>(request.getTags()));
		file.setSemanticType(request.getSemanticType());
		file.setSemanticConfidence(request.getSemanticConfidence());
		file.setSemanticScores(request.getSemanticScores() == null ? null : new LinkedHashMap<>(request.getSemanticScores()));
		file.setCompressed(Boolean.TRUE.equals(request.getCompressed()));
		file.setEncrypted(Boolean.TRUE.equals(request.getEncrypted()));
		return file;
	}

	public FileResponse toResponse(File file) {
		FileResponse response = new FileResponse();
		response.setId(file.getId());
		response.setName(file.getName());
		response.setPath(file.getPath());
		response.setFolderPath(file.getFolderPath());
		response.setCategory(file.getCategory());
		response.setSubType(file.getSubType());
		response.setMimeType(file.getMimeType());
		response.setSize(file.getSize());
		response.setHash(file.getHash());
		response.setTags(file.getTags() == null ? null : new ArrayList<>(file.getTags()));
		response.setSemanticType(file.getSemanticType());
		response.setSemanticConfidence(file.getSemanticConfidence());
		response.setSemanticScores(file.getSemanticScores() == null ? null : new LinkedHashMap<>(file.getSemanticScores()));
		response.setUploadDate(file.getUploadDate());
		response.setLastAccess(file.getLastAccess());
		response.setLastModified(file.getLastModified());
		response.setOwner(file.getOwner());
		response.setCompressed(file.isCompressed());
		response.setEncrypted(file.isEncrypted());
		return response;
	}
}
