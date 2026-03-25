package com.example.documind.configurations.exceptions;

import org.springframework.http.HttpStatus;

public class CustomException extends RuntimeException {
	private final HttpStatus status;
	private final String code;
	private final Object details;

	public CustomException(HttpStatus status, String message) {
		this(status, status.name(), message, null);
	}

	public CustomException(HttpStatus status, String code, String message) {
		this(status, code, message, null);
	}

	public CustomException(HttpStatus status, String code, String message, Object details) {
		super(message);
		this.status = status;
		this.code = code;
		this.details = details;
	}

	public HttpStatus getStatus() {
		return status;
	}

	public String getCode() {
		return code;
	}

	public Object getDetails() {
		return details;
	}
}
