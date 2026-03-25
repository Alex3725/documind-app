package com.example.documind.configurations.exceptions;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ApiError> handleCustomException(CustomException ex, HttpServletRequest request) {
		return buildResponse(ex.getStatus(), ex.getCode(), ex.getMessage(), request, ex.getDetails());
	}

	@ExceptionHandler({
			IllegalArgumentException.class,
			MethodArgumentTypeMismatchException.class,
			HttpMessageNotReadableException.class
	})
	public ResponseEntity<ApiError> handleBadRequest(Exception ex, HttpServletRequest request) {
		return buildResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request, null);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
		Map<String, String> fieldErrors = new LinkedHashMap<>();
		for (FieldError error : ex.getBindingResult().getFieldErrors()) {
			fieldErrors.put(error.getField(), error.getDefaultMessage());
		}

		return buildResponse(
				HttpStatus.BAD_REQUEST,
				"VALIDATION_ERROR",
				"Validation failed.",
				request,
				fieldErrors
		);
	}

	@ExceptionHandler(AuthenticationCredentialsNotFoundException.class)
	public ResponseEntity<ApiError> handleUnauthorized(AuthenticationCredentialsNotFoundException ex, HttpServletRequest request) {
		return buildResponse(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", ex.getMessage(), request, null);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiError> handleForbidden(AccessDeniedException ex, HttpServletRequest request) {
		return buildResponse(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage(), request, null);
	}

	@ExceptionHandler({EntityNotFoundException.class, NoSuchElementException.class})
	public ResponseEntity<ApiError> handleNotFound(Exception ex, HttpServletRequest request) {
		return buildResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), request, null);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException ex, HttpServletRequest request) {
		return buildResponse(HttpStatus.CONFLICT, "CONFLICT", "Data integrity violation.", request, ex.getMostSpecificCause().getMessage());
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
		return buildResponse(
				HttpStatus.INTERNAL_SERVER_ERROR,
				"INTERNAL_ERROR",
				"Unexpected server error.",
				request,
				null
		);
	}

	private ResponseEntity<ApiError> buildResponse(
			HttpStatus status,
			String code,
			String message,
			HttpServletRequest request,
			Object details
	) {
		ApiError body = new ApiError(
				LocalDateTime.now(),
				status.value(),
				status.getReasonPhrase(),
				code,
				message,
				request.getMethod(),
				request.getRequestURI(),
				details
		);
		return ResponseEntity.status(status).body(body);
	}

	public record ApiError(
			LocalDateTime timestamp,
			int status,
			String error,
			String code,
			String message,
			String method,
			String path,
			Object details
	) {
	}
}
