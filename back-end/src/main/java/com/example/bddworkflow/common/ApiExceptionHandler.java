package com.example.bddworkflow.common;

import com.example.bddworkflow.category.exception.CategoryNotFoundException;
import com.example.bddworkflow.category.exception.CategoryValidationException;
import com.example.bddworkflow.category.exception.DuplicateCategoryNameException;
import com.example.bddworkflow.todo.exception.InvalidCategoryException;
import com.example.bddworkflow.todo.exception.TodoNotFoundException;
import com.example.bddworkflow.todo.exception.TodoValidationException;
import com.example.bddworkflow.user.exception.DuplicateEmailException;
import com.fasterxml.jackson.databind.JsonMappingException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiError> handleDuplicateEmail(DuplicateEmailException exception,
                                                        HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", "이미 등록된 이메일입니다.",
                List.of(new ApiError.FieldError("email", "이미 등록된 이메일입니다.")), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception,
                                                     HttpServletRequest request) {
        List<ApiError.FieldError> details = exception.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiError.FieldError(fe.getField(),
                        fe.getDefaultMessage() == null ? "유효하지 않은 값입니다." : fe.getDefaultMessage()))
                .toList();
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "요청 값이 유효하지 않습니다.",
                details, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleNotReadable(HttpMessageNotReadableException exception,
                                                     HttpServletRequest request) {
        String field = null;
        Throwable cause = exception.getCause();
        if (cause instanceof JsonMappingException jme && !jme.getPath().isEmpty()) {
            field = jme.getPath().get(jme.getPath().size() - 1).getFieldName();
        }
        List<ApiError.FieldError> details = field == null
                ? List.of()
                : List.of(new ApiError.FieldError(field, "요청 본문을 해석할 수 없습니다."));
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "요청 본문을 해석할 수 없습니다.",
                details, request);
    }

    @ExceptionHandler(DuplicateCategoryNameException.class)
    public ResponseEntity<ApiError> handleDuplicateCategoryName(DuplicateCategoryNameException exception,
                                                                HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "DUPLICATE_CATEGORY_NAME", "이미 사용 중인 카테고리 이름입니다.",
                List.of(new ApiError.FieldError("name", "이미 사용 중인 카테고리 이름입니다.")), request);
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<ApiError> handleCategoryNotFound(CategoryNotFoundException exception,
                                                           HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다.",
                List.of(), request);
    }

    @ExceptionHandler(CategoryValidationException.class)
    public ResponseEntity<ApiError> handleCategoryValidation(CategoryValidationException exception,
                                                             HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", exception.getMessage(),
                List.of(new ApiError.FieldError(exception.field(), exception.getMessage())), request);
    }

    @ExceptionHandler(TodoNotFoundException.class)
    public ResponseEntity<ApiError> handleTodoNotFound(TodoNotFoundException exception,
                                                       HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, "TODO_NOT_FOUND", "할 일을 찾을 수 없습니다.",
                List.of(), request);
    }

    @ExceptionHandler(TodoValidationException.class)
    public ResponseEntity<ApiError> handleTodoValidation(TodoValidationException exception,
                                                         HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", exception.getMessage(),
                List.of(new ApiError.FieldError(exception.field(), exception.getMessage())), request);
    }

    @ExceptionHandler(InvalidCategoryException.class)
    public ResponseEntity<ApiError> handleInvalidCategory(InvalidCategoryException exception,
                                                          HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_CATEGORY", "유효하지 않은 카테고리입니다.",
                List.of(new ApiError.FieldError("categoryId", "유효하지 않은 카테고리입니다.")), request);
    }

    private ResponseEntity<ApiError> error(HttpStatus status, String code, String message,
                                            List<ApiError.FieldError> details,
                                            HttpServletRequest request) {
        ApiError body = new ApiError(
                code, message, status.value(), Instant.now(), request.getRequestURI(), details);
        return ResponseEntity.status(status).body(body);
    }
}
