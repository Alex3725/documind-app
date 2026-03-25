package com.example.documind.entities.files;

import com.example.documind.dto.requests.FileCreateRequest;
import com.example.documind.dto.requests.FileUpdateRequest;
import com.example.documind.dto.responses.FileResponse;
import com.example.documind.entities.files.type.FileCategory;
import com.example.documind.entities.files.type.FileSemanticType;
import com.example.documind.entities.files.type.FileSubType;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {
	private final FileService fileService;

	public FileController(FileService fileService) {
		this.fileService = fileService;
	}

	@PostMapping
	public ResponseEntity<?> createFile(
			@CookieValue(name = "authentication-token", required = false) String token,
			@RequestBody FileCreateRequest request
	) {
		FileResponse response = fileService.createFile(token, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@GetMapping
	public ResponseEntity<?> listFiles(
			@CookieValue(name = "authentication-token", required = false) String token,
			@RequestParam(required = false) FileCategory category,
			@RequestParam(required = false) FileSubType subType,
			@RequestParam(required = false) FileSemanticType semanticType,
			@RequestParam(required = false) String tag,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime uploadedFrom,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime uploadedTo
	) {
		List<FileResponse> responses = fileService.listFiles(token, category, subType, semanticType, tag, uploadedFrom, uploadedTo);
		return ResponseEntity.ok(responses);
	}

	@GetMapping("/{fileId}")
	public ResponseEntity<?> getFileById(
			@CookieValue(name = "authentication-token", required = false) String token,
			@PathVariable Long fileId
	) {
		FileResponse response = fileService.getById(token, fileId);
		return ResponseEntity.ok(response);
	}

	@PatchMapping("/{fileId}")
	public ResponseEntity<?> updateFile(
			@CookieValue(name = "authentication-token", required = false) String token,
			@PathVariable Long fileId,
			@RequestBody FileUpdateRequest request
	) {
		FileResponse response = fileService.updateFile(token, fileId, request);
		return ResponseEntity.ok(response);
	}

	@DeleteMapping("/{fileId}")
	public ResponseEntity<?> deleteFile(
			@CookieValue(name = "authentication-token", required = false) String token,
			@PathVariable Long fileId
	) {
		fileService.deleteFile(token, fileId);
		return ResponseEntity.ok("File deleted.");
	}
}
