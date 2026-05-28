package com.example.documind.entities.files;

import com.example.documind.configurations.exceptions.CustomException;
import com.example.documind.configurations.globals.mappers.FileMapper;
import com.example.documind.configurations.globals.validators.FileValidator;
import com.example.documind.dto.requests.FileCreateRequest;
import com.example.documind.dto.requests.FileReorderItemRequest;
import com.example.documind.dto.requests.FileReorderRequest;
import com.example.documind.dto.requests.FileUpdateRequest;
import com.example.documind.dto.responses.FileReorderResponse;
import com.example.documind.dto.responses.FileReorderResult;
import com.example.documind.dto.responses.FileResponse;
import com.example.documind.entities.files.type.FileCategory;
import com.example.documind.entities.files.type.FileSemanticType;
import com.example.documind.entities.files.type.FileSubType;
import com.example.documind.entities.folders.FolderType;
import com.example.documind.entities.folders.FolderTypeRepository;
import com.example.documind.entities.users.User;
import com.example.documind.security.tokens.Token;
import com.example.documind.security.tokens.TokenRepository;
import com.example.documind.security.tokens.TokenService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class FileService {
	private final FileRepository fileRepository;
	private final FileMapper fileMapper;
	private final FileValidator fileValidator;
	private final FolderTypeRepository folderTypeRepository;
	private final TokenRepository tokenRepository;
	private final TokenService tokenService;
	private final TransactionTemplate transactionTemplate;

	public FileService(
			FileRepository fileRepository,
			FileMapper fileMapper,
			FileValidator fileValidator,
			FolderTypeRepository folderTypeRepository,
			TokenRepository tokenRepository,
			TokenService tokenService,
			PlatformTransactionManager transactionManager
	) {
		this.fileRepository = fileRepository;
		this.fileMapper = fileMapper;
		this.fileValidator = fileValidator;
		this.folderTypeRepository = folderTypeRepository;
		this.tokenRepository = tokenRepository;
		this.tokenService = tokenService;
		this.transactionTemplate = new TransactionTemplate(transactionManager);
	}

	@Transactional
	public FileResponse createFile(String token, FileCreateRequest request) {
		String owner = requireOwnerFromToken(token);
		validateCreateRequest(request);
		// Check for duplicate hash and return existing file (allows frontend to retry with tags)
		if (StringUtils.hasText(request.getHash())) {
			Optional<File> existing = fileRepository.findByHash(request.getHash());
			if (existing.isPresent()) {
				return fileMapper.toResponse(existing.get());
			}
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
        // Check for duplicate hash and return existing file if found (allows frontend to retry with tags)
        if (StringUtils.hasText(request.getHash())) {
            Optional<File> existing = fileRepository.findByHash(request.getHash());
            if (existing.isPresent()) {
                return fileMapper.toResponse(existing.get());
            }
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

	@Transactional(readOnly = true)
	public ResponseEntity<Resource> downloadFile(String token, Long fileId) {
		String owner = requireOwnerFromToken(token);
		File file = fileRepository.findByIdAndOwner(fileId, owner)
				.orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found."));

		if (!StringUtils.hasText(file.getPath())) {
			throw new CustomException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File path not available.");
		}

		Path path = Paths.get(file.getPath());
		if (!Files.exists(path) || !Files.isRegularFile(path)) {
			throw new CustomException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found on disk.");
		}

		Resource resource = new FileSystemResource(path);
		String downloadName = sanitizeDownloadName(StringUtils.hasText(file.getName()) ? file.getName() : path.getFileName().toString());
		MediaType mediaType = resolveMediaType(file.getMimeType(), path);

		try {
			return ResponseEntity.ok()
					.contentType(mediaType)
					.contentLength(Files.size(path))
					.header(HttpHeaders.CONTENT_DISPOSITION,
						ContentDisposition.attachment().filename(downloadName, StandardCharsets.UTF_8).build().toString())
					.body(resource);
		} catch (IOException ex) {
			throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "DOWNLOAD_ERROR", "Unable to prepare file download.");
		}
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

	public FileReorderResponse reorderFiles(String token, FileReorderRequest request) {
		String owner = requireOwnerFromToken(token);
		List<FileReorderResult> results = new ArrayList<>();
		List<FileReorderItemRequest> items = request != null && request.getFiles() != null ? request.getFiles() : List.of();

		for (FileReorderItemRequest item : items) {
			try {
				results.add(transactionTemplate.execute(status -> reorderSingleFile(owner, item)));
			} catch (CustomException ex) {
				results.add(new FileReorderResult(
					item != null ? item.getFileId() : null,
					normalizeTag(item != null ? item.getNewTag() : null),
					item != null ? item.getCurrentPath() : null,
					item != null ? item.getCurrentPath() : null,
					"manual_review"
				));
			} catch (RuntimeException ex) {
				results.add(new FileReorderResult(
					item != null ? item.getFileId() : null,
					normalizeTag(item != null ? item.getNewTag() : null),
					item != null ? item.getCurrentPath() : null,
					item != null ? item.getCurrentPath() : null,
					"manual_review"
				));
			}
		}

		String status = results.stream().allMatch(r -> "moved".equals(r.getAction()) || "unchanged".equals(r.getAction()))
				? "success"
				: results.stream().anyMatch(r -> "moved".equals(r.getAction()) || "unchanged".equals(r.getAction()))
					? "partial"
					: "error";
		return new FileReorderResponse(status, results);
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

	private FileReorderResult reorderSingleFile(String owner, FileReorderItemRequest item) {
		if (item == null || !StringUtils.hasText(item.getFileId()) || !StringUtils.hasText(item.getNewTag()) || !StringUtils.hasText(item.getCurrentPath())) {
			throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid reorder payload.");
		}

		Long fileId;
		try {
			fileId = Long.parseLong(item.getFileId());
		} catch (NumberFormatException ex) {
			throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "File ID must be numeric.");
		}

		File file = fileRepository.findByIdAndOwner(fileId, owner)
				.orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found."));

		String normalizedTag = normalizeTag(item.getNewTag());
		String resolvedTag = resolveTagCandidate(owner, normalizedTag);
		if (!StringUtils.hasText(resolvedTag)) {
			return new FileReorderResult(item.getFileId(), normalizedTag, item.getCurrentPath(), item.getCurrentPath(), "manual_review");
		}

		String oldPath = StringUtils.hasText(item.getCurrentPath()) ? item.getCurrentPath().trim() : file.getPath();
		String newPath = buildReorderedPath(oldPath, resolvedTag, file.getName());
		if (!StringUtils.hasText(newPath)) {
			throw new CustomException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Unable to build target path.");
		}

		if (newPath.equals(file.getPath()) || resolvedTag.equals(file.getFolderPath())) {
			return new FileReorderResult(item.getFileId(), resolvedTag, oldPath, newPath, "unchanged");
		}

		file.setPath(newPath);
		file.setFolderPath(resolvedTag);

		List<String> nextTags = new ArrayList<>(fileValidator.normalizeTags(file.getTags()));
		if (!nextTags.contains(resolvedTag)) {
			nextTags.add(resolvedTag);
		}
		file.setTags(fileValidator.normalizeTags(nextTags));
		file.setLastModified(LocalDateTime.now());

		File saved = fileRepository.save(file);
		return new FileReorderResult(item.getFileId(), resolvedTag, oldPath, saved.getPath(), "moved");
	}

	private String resolveTagCandidate(String owner, String normalizedTag) {
		if (!StringUtils.hasText(normalizedTag)) {
			return null;
		}

		Set<String> candidates = new LinkedHashSet<>();
		for (FolderType folder : folderTypeRepository.findAllByOwnerAndTrashedFalseOrderByFullPathAsc(owner)) {
			collectCandidate(candidates, folder.getName(), normalizedTag);
			collectCandidate(candidates, folder.getFullPath(), normalizedTag);
			if (folder.getAutoTags() != null) {
				for (String tag : folder.getAutoTags()) {
					collectCandidate(candidates, tag, normalizedTag);
				}
			}
		}
		for (File file : fileRepository.findAllByOwnerOrderByUploadDateDesc(owner)) {
			if (file.getTags() == null) continue;
			for (String tag : file.getTags()) {
				collectCandidate(candidates, tag, normalizedTag);
			}
		}

		List<String> sorted = new ArrayList<>(candidates);
		Collections.sort(sorted);
		List<String> matches = findPrefixMatches(sorted, normalizedTag);
		if (matches.size() != 1) {
			return null;
		}
		return matches.get(0);
	}

	private void collectCandidate(Set<String> candidates, String rawTag, String prefix) {
		if (!StringUtils.hasText(rawTag)) {
			return;
		}
		String normalized = normalizeTag(rawTag);
		if (normalized.startsWith(prefix)) {
			candidates.add(normalized);
		}
	}

	private List<String> findPrefixMatches(List<String> sorted, String prefix) {
		if (sorted.isEmpty() || !StringUtils.hasText(prefix)) {
			return List.of();
		}

		int lo = 0;
		int hi = sorted.size();
		while (lo < hi) {
			int mid = (lo + hi) >>> 1;
			String midPrefix = sorted.get(mid).length() >= prefix.length() ? sorted.get(mid).substring(0, prefix.length()) : sorted.get(mid);
			if (midPrefix.compareTo(prefix) < 0) {
				lo = mid + 1;
			} else {
				hi = mid;
			}
		}

		List<String> matches = new ArrayList<>();
		for (int i = lo; i < sorted.size(); i++) {
			String value = sorted.get(i);
			if (value.startsWith(prefix)) {
				matches.add(value);
			} else {
				break;
			}
		}
		return matches;
	}

	private String buildReorderedPath(String currentPath, String resolvedTag, String fileName) {
		if (!StringUtils.hasText(currentPath) || !StringUtils.hasText(resolvedTag) || !StringUtils.hasText(fileName)) {
			return null;
		}

		String normalizedPath = currentPath.trim().replace("\\", "/");
		String normalizedFile = fileName.trim();
		if (normalizedPath.endsWith("/" + normalizedFile)) {
			String parentPath = normalizedPath.substring(0, normalizedPath.length() - normalizedFile.length() - 1);
			int lastSlash = parentPath.lastIndexOf('/');
			String rootPath = lastSlash >= 0 ? parentPath.substring(0, lastSlash) : "";
			if (!StringUtils.hasText(rootPath)) {
				return resolvedTag + "/" + normalizedFile;
			}
			return rootPath + "/" + resolvedTag + "/" + normalizedFile;
		}

		int lastSlash = normalizedPath.lastIndexOf('/');
		String basePath = lastSlash >= 0 ? normalizedPath.substring(0, lastSlash) : "";
		if (!StringUtils.hasText(basePath)) {
			return resolvedTag + "/" + normalizedFile;
		}
		int secondLastSlash = basePath.lastIndexOf('/');
		String rootPath = secondLastSlash >= 0 ? basePath.substring(0, secondLastSlash) : "";
		if (!StringUtils.hasText(rootPath)) {
			return resolvedTag + "/" + normalizedFile;
		}
		return rootPath + "/" + resolvedTag + "/" + normalizedFile;
	}

	private String normalizeTag(String tag) {
		return StringUtils.hasText(tag) ? tag.trim().toLowerCase() : null;
	}

	private MediaType resolveMediaType(String mimeType, Path path) {
		if (StringUtils.hasText(mimeType)) {
			try {
				return MediaType.parseMediaType(mimeType);
			} catch (IllegalArgumentException ignored) {
				// fallback below
			}
		}

		try {
			String probed = Files.probeContentType(path);
			if (StringUtils.hasText(probed)) {
				return MediaType.parseMediaType(probed);
			}
		} catch (IOException ignored) {
			// fallback below
		}

		return MediaType.APPLICATION_OCTET_STREAM;
	}

	private String sanitizeDownloadName(String name) {
		if (!StringUtils.hasText(name)) {
			return "download";
		}
		return name.trim().replaceAll("[\\\\/]+", "_");
	}
}
