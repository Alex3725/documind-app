package com.example.documind.entities.files;

import com.example.documind.configurations.exceptions.CustomException;
import com.example.documind.configurations.globals.mappers.FileMapper;
import com.example.documind.configurations.globals.validators.FileValidator;
import com.example.documind.dto.requests.FileCreateRequest;
import com.example.documind.dto.requests.FileUpdateRequest;
import com.example.documind.dto.responses.FileResponse;
import com.example.documind.entities.files.type.FileCategory;
import com.example.documind.entities.files.type.FileSemanticType;
import com.example.documind.entities.files.type.FileSubType;
import com.example.documind.entities.users.User;
import com.example.documind.security.tokens.Token;
import com.example.documind.security.tokens.TokenRepository;
import com.example.documind.security.tokens.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FileService {
	private final FileRepository fileRepository;
	private final FileMapper fileMapper;
	private final FileValidator fileValidator;
	private final TokenRepository tokenRepository;
	private final TokenService tokenService;

	public FileService(
			FileRepository fileRepository,
			FileMapper fileMapper,
			FileValidator fileValidator,
			TokenRepository tokenRepository,
			TokenService tokenService
	) {
		this.fileRepository = fileRepository;
		this.fileMapper = fileMapper;
		this.fileValidator = fileValidator;
		this.tokenRepository = tokenRepository;
		this.tokenService = tokenService;
	}

	@Transactional
	public FileResponse createFile(String token, FileCreateRequest request) {
		String owner = requireOwnerFromToken(token);
		validateCreateRequest(request);
		if (fileRepository.existsByHash(request.getHash())) {
			throw new CustomException(HttpStatus.CONFLICT, "FILE_HASH_CONFLICT", "A file with the same hash already exists.");
		}

		File file = fileMapper.toEntity(request);
		file.setOwner(owner);
		file.setTags(fileValidator.normalizeTags(request.getTags()));
		if (!StringUtils.hasText(file.getFolderPath())) {
			file.setFolderPath("Non classificati");
		}

		LocalDateTime now = LocalDateTime.now();
		file.setUploadDate(now);
		file.setLastModified(now);
		file.setLastAccess(now);

		File saved = fileRepository.save(file);
		return fileMapper.toResponse(saved);
	}

	@Transactional
    public FileResponse createFileWithOwner(String owner, String uploaderIp, String uploaderToken, FileCreateRequest request) {
        if (!StringUtils.hasText(owner)) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "OWNER_REQUIRED", "Owner must be provided when creating file by owner.");
        }
        validateCreateRequest(request);
        if (fileRepository.existsByHash(request.getHash())) {
            throw new CustomException(HttpStatus.CONFLICT, "FILE_HASH_CONFLICT", "A file with the same hash already exists.");
        }

        File file = fileMapper.toEntity(request);
        file.setOwner(owner);
        file.setUploaderIp(uploaderIp);
        file.setUploaderToken(uploaderToken);
		if (!StringUtils.hasText(file.getFolderPath())) {
			file.setFolderPath("Non classificati");
		}

		LocalDateTime now = LocalDateTime.now();
		file.setUploadDate(now);
		file.setLastModified(now);
		file.setLastAccess(now);

		File saved = fileRepository.save(file);
		return fileMapper.toResponse(saved);
	}

	@Transactional(readOnly = true)
	public List<FileResponse> listFiles(
			String token,
			FileCategory category,
			FileSubType subType,
			FileSemanticType semanticType,
			String tag,
			String folderPath,
			LocalDateTime uploadedFrom,
			LocalDateTime uploadedTo
	) {
		String owner = requireOwnerFromToken(token);
		List<File> files = loadOwnerFiles(owner, category, subType, semanticType, uploadedFrom, uploadedTo);
		List<FileResponse> responses = new ArrayList<>();

		String normalizedTag = StringUtils.hasText(tag) ? tag.trim().toLowerCase() : null;
		String normalizedFolderPath = StringUtils.hasText(folderPath) ? folderPath.trim() : null;
		for (File file : files) {
			if (normalizedTag != null && (file.getTags() == null || !file.getTags().contains(normalizedTag))) {
				continue;
			}
			if (normalizedFolderPath != null && !normalizedFolderPath.equals(file.getFolderPath())) {
				continue;
			}
			responses.add(fileMapper.toResponse(file));
		}

		return responses;
	}

	@Transactional
	public FileResponse getById(String token, Long fileId) {
		String owner = requireOwnerFromToken(token);
		File file = fileRepository.findByIdAndOwner(fileId, owner)
				.orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found."));
		file.setLastAccess(LocalDateTime.now());
		return fileMapper.toResponse(fileRepository.save(file));
	}

	@Transactional
	public FileResponse updateFile(String token, Long fileId, FileUpdateRequest request) {
		String owner = requireOwnerFromToken(token);
		validateUpdateRequest(request);

		File file = fileRepository.findByIdAndOwner(fileId, owner)
				.orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found."));
		FileCategory effectiveCategory = request.getCategory() != null ? request.getCategory() : file.getCategory();
		FileSubType effectiveSubType = request.getSubType() != null ? request.getSubType() : file.getSubType();
		validateCategoryAndSubType(effectiveCategory, effectiveSubType);

		if (StringUtils.hasText(request.getName())) {
			file.setName(request.getName());
		}
		if (StringUtils.hasText(request.getPath())) {
			file.setPath(request.getPath());
		}
		if (StringUtils.hasText(request.getFolderPath())) {
			file.setFolderPath(request.getFolderPath());
		}
		if (request.getCategory() != null) {
			file.setCategory(request.getCategory());
		}
		if (request.getSubType() != null) {
			file.setSubType(request.getSubType());
		}
		if (StringUtils.hasText(request.getMimeType())) {
			file.setMimeType(request.getMimeType());
		}
		if (request.getSize() != null) {
			file.setSize(request.getSize());
		}
		if (request.getTags() != null) {
			file.setTags(fileValidator.normalizeTags(request.getTags()));
		}
		if (request.getSemanticType() != null) {
			file.setSemanticType(request.getSemanticType());
		}
		if (request.getSemanticConfidence() != null) {
			file.setSemanticConfidence(request.getSemanticConfidence());
		}
		if (request.getSemanticScores() != null) {
			file.setSemanticScores(request.getSemanticScores());
		}
		if (request.getCompressed() != null) {
			file.setCompressed(request.getCompressed());
		}
		if (request.getEncrypted() != null) {
			file.setEncrypted(request.getEncrypted());
		}

		file.setLastModified(LocalDateTime.now());
		File saved = fileRepository.save(file);
		return fileMapper.toResponse(saved);
	}

	@Transactional
	public void deleteFile(String token, Long fileId) {
		String owner = requireOwnerFromToken(token);
		File file = fileRepository.findByIdAndOwner(fileId, owner)
				.orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found."));
		fileRepository.delete(file);
	}


	@Transactional
	public void deleteAllByOwner(String owner) {
		fileRepository.deleteAllByOwner(owner);
	}

	@Transactional
	public int transferOwnership(String currentOwner, String newOwner) {
		if (!StringUtils.hasText(currentOwner) || !StringUtils.hasText(newOwner) || currentOwner.equals(newOwner)) {
			return 0;
		}
		return fileRepository.updateOwner(currentOwner, newOwner);
	}

	public void createDefaultSpace(User user) {
		// Hook for future "default folder" bootstrap. Kept intentionally no-op for now.
		if (user == null) {
			return;
		}
	}

	private List<File> loadOwnerFiles(
			String owner,
			FileCategory category,
			FileSubType subType,
			FileSemanticType semanticType,
			LocalDateTime uploadedFrom,
			LocalDateTime uploadedTo
	) {
		if (uploadedFrom != null || uploadedTo != null) {
			LocalDateTime from = uploadedFrom != null ? uploadedFrom : LocalDateTime.of(1970, 1, 1, 0, 0);
			LocalDateTime to = uploadedTo != null ? uploadedTo : LocalDateTime.now();
			return fileRepository.findAllByOwnerAndUploadDateBetweenOrderByUploadDateDesc(owner, from, to);
		}

		if (category != null) {
			return fileRepository.findAllByOwnerAndCategoryOrderByUploadDateDesc(owner, category);
		}
		if (subType != null) {
			return fileRepository.findAllByOwnerAndSubTypeOrderByUploadDateDesc(owner, subType);
		}
		if (semanticType != null) {
			return fileRepository.findAllByOwnerAndSemanticTypeOrderByUploadDateDesc(owner, semanticType);
		}
		return fileRepository.findAllByOwnerOrderByUploadDateDesc(owner);
	}

	@Transactional(readOnly = true)
	private Optional<String> getOwnerFromValidToken(String token) {
		if (!StringUtils.hasText(token) || !tokenService.isValidToken(token)) {
			return Optional.empty();
		}

		Optional<Token> tokenOptional = tokenRepository.findByToken(token);
		if (tokenOptional.isEmpty()) {
			return Optional.empty();
		}

		User user = tokenOptional.get().getUser();
		if (user == null || !StringUtils.hasText(user.getEmail())) {
			return Optional.empty();
		}

		return Optional.of(user.getEmail());
	}

	private String requireOwnerFromToken(String token) {
		return getOwnerFromValidToken(token)
				.orElseThrow(() -> new CustomException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Invalid or expired session."));
	}

	private void validateCreateRequest(FileCreateRequest request) {
		try {
			fileValidator.validateCreateRequest(request);
		} catch (IllegalArgumentException ex) {
			throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage());
		}
	}

	private void validateUpdateRequest(FileUpdateRequest request) {
		try {
			fileValidator.validateUpdateRequest(request);
		} catch (IllegalArgumentException ex) {
			throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage());
		}
	}

	private void validateCategoryAndSubType(FileCategory category, FileSubType subType) {
		try {
			fileValidator.validateCategoryAndSubType(category, subType);
		} catch (IllegalArgumentException ex) {
			throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage());
		}
	}
}
