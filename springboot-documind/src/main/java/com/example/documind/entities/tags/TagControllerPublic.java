package com.example.documind.entities.tags;

import com.example.documind.dto.responses.TagSuggestionResponse;
import com.example.documind.entities.folders.FolderType;
import com.example.documind.entities.folders.FolderTypeRepository;
import com.example.documind.entities.folders.FolderTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
public class TagControllerPublic {

    private final FolderTypeRepository folderTypeRepository;
    private final FolderTypeService folderTypeService;

    public TagControllerPublic(
            FolderTypeRepository folderTypeRepository,
            FolderTypeService folderTypeService
    ) {
        this.folderTypeRepository = folderTypeRepository;
        this.folderTypeService = folderTypeService;
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, List<TagSuggestionResponse>>> searchTags(
            @CookieValue(name = "authentication-token", required = false) String token,
            @RequestParam(name = "prefix", required = false) String prefix,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        String owner = folderTypeService.resolveOwner(token);
        String normalizedPrefix = prefix == null ? "" : prefix.trim().toLowerCase(Locale.ROOT);
        int safeLimit = Math.max(1, Math.min(limit, 50));

        Map<String, TagSuggestionResponse> byName = new LinkedHashMap<>();

        for (FolderType folder : folderTypeRepository.findAllByOwnerAndTrashedFalseOrderByFullPathAsc(owner)) {
            collectTag(byName, folder.getName(), folder.getDescription(), normalizedPrefix);
        }

        List<TagSuggestionResponse> tags = new ArrayList<>(byName.values());
        tags.sort(Comparator.comparing(TagSuggestionResponse::getName, String::compareTo));

        List<TagSuggestionResponse> filtered = normalizedPrefix.isEmpty()
                ? tags
                : binaryPrefixFilter(tags, normalizedPrefix, safeLimit);

        if (filtered.size() > safeLimit) {
            filtered = filtered.subList(0, safeLimit);
        }

        return ResponseEntity.ok(Map.of("tags", filtered));
    }

    private void collectTag(
            Map<String, TagSuggestionResponse> byName,
            String rawTag,
            String description,
            String normalizedPrefix
    ) {
        if (!StringUtils.hasText(rawTag)) {
            return;
        }

        String normalized = rawTag.trim().toLowerCase(Locale.ROOT);
        if (!normalizedPrefix.isEmpty() && !normalized.startsWith(normalizedPrefix)) {
            return;
        }

        byName.putIfAbsent(normalized, new TagSuggestionResponse(normalized, StringUtils.hasText(description) ? description.trim() : null));
    }

    private List<TagSuggestionResponse> binaryPrefixFilter(List<TagSuggestionResponse> tags, String prefix, int limit) {
        int left = 0;
        int right = tags.size();

        while (left < right) {
            int mid = (left + right) >>> 1;
            String midName = tags.get(mid).getName();
            if (midName.compareTo(prefix) < 0) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        List<TagSuggestionResponse> result = new ArrayList<>();
        for (int i = left; i < tags.size() && result.size() < limit; i++) {
            String name = tags.get(i).getName();
            if (name.startsWith(prefix)) {
                result.add(tags.get(i));
            } else {
                break;
            }
        }
        return result;
    }
}
