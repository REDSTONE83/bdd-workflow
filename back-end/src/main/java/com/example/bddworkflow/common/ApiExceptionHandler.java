package com.example.bddworkflow.common;

import com.example.bddworkflow.category.CategoryNotFoundException;
import com.example.bddworkflow.category.CategoryValidationException;
import com.example.bddworkflow.category.DuplicateCategoryNameException;
import com.example.bddworkflow.user.DuplicateEmailException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiError> handleDuplicateEmail(DuplicateEmailException exception) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiError("DUPLICATE_EMAIL", "이미 등록된 이메일입니다.", "email"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        FieldError fieldError = exception.getBindingResult().getFieldError();
        String field = fieldError == null ? null : fieldError.getField();
        return ResponseEntity
                .badRequest()
                .body(new ApiError("VALIDATION_FAILED", "요청 값이 유효하지 않습니다.", field));
    }

    @ExceptionHandler(DuplicateCategoryNameException.class)
    public ResponseEntity<ApiError> handleDuplicateCategoryName(DuplicateCategoryNameException exception) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiError("DUPLICATE_CATEGORY_NAME", "이미 사용 중인 카테고리 이름입니다.", "name"));
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<ApiError> handleCategoryNotFound(CategoryNotFoundException exception) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiError("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다.", null));
    }

    @ExceptionHandler(CategoryValidationException.class)
    public ResponseEntity<ApiError> handleCategoryValidation(CategoryValidationException exception) {
        return ResponseEntity
                .badRequest()
                .body(new ApiError("VALIDATION_FAILED", exception.getMessage(), exception.field()));
    }
}
