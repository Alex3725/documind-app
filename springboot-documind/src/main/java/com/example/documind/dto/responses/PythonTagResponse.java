package com.example.documind.dto.responses;

import com.example.documind.dto.classifications.TagEntry;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class PythonTagResponse {
	@JsonProperty("file_id")
	private String fileId;

	private String filename;

	private List<TagEntry> tags;

	@JsonProperty("primary_tags")
	private List<String> primaryTags;

	private String summary;

	@JsonProperty("extracted_text")
	private String extractedText;

	private Map<String, Object> metadata;

	@JsonProperty("extracted_data")
	private Map<String, Object> extractedData;
}
