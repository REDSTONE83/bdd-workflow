package com.example.bddworkflow.common;

import com.example.bddworkflow.auth.exception.InvalidCredentialsException;
import com.example.bddworkflow.category.exception.CategoryNotFoundException;
import com.example.bddworkflow.category.exception.CategoryValidationException;
import com.example.bddworkflow.category.exception.DuplicateCategoryNameException;
import com.example.bddworkflow.todo.exception.InvalidCategoryException;
import com.example.bddworkflow.todo.exception.TodoNotFoundException;
import com.example.bddworkflow.todo.exception.TodoValidationException;
import com.example.bddworkflow.user.exception.DuplicateEmailException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final String CODE_INVALID_REQUEST = "INVALID_REQUEST";
    private static final String CODE_INTERNAL_ERROR = "INTERNAL_ERROR";

    private static final Map<String, String> ANNOTATION_TO_DETAIL_CODE = Map.ofEntries(
            Map.entry("NotBlank", "NOT_BLANK"),
            Map.entry("NotEmpty", "NOT_BLANK"),
            Map.entry("NotNull", "NOT_NULL"),
            Map.entry("Size", "OUT_OF_LENGTH"),
            Map.entry("Length", "OUT_OF_LENGTH"),
            Map.entry("Min", "OUT_OF_RANGE"),
            Map.entry("Max", "OUT_OF_RANGE"),
            Map.entry("Positive", "OUT_OF_RANGE"),
            Map.entry("PositiveOrZero", "OUT_OF_RANGE"),
            Map.entry("Negative", "OUT_OF_RANGE"),
            Map.entry("NegativeOrZero", "OUT_OF_RANGE"),
            Map.entry("DecimalMin", "OUT_OF_RANGE"),
            Map.entry("DecimalMax", "OUT_OF_RANGE"),
            Map.entry("Past", "OUT_OF_RANGE"),
            Map.entry("PastOrPresent", "OUT_OF_RANGE"),
            Map.entry("Future", "OUT_OF_RANGE"),
            Map.entry("FutureOrPresent", "OUT_OF_RANGE"),
            Map.entry("Pattern", "INVALID_FORMAT"),
            Map.entry("Email", "INVALID_FORMAT")
    );

    private static final Map<String, String> DETAIL_CODE_TO_MESSAGE = Map.of(
            "NOT_BLANK", "비어 있을 수 없습니다.",
            "NOT_NULL", "필수 항목입니다.",
            "OUT_OF_LENGTH", "길이가 허용 범위를 벗어났습니다.",
            "OUT_OF_RANGE", "값이 허용 범위를 벗어났습니다.",
            "INVALID_FORMAT", "형식이 올바르지 않습니다.",
            "UNKNOWN_FIELD", "알 수 없는 필드입니다."
    );

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiError> handleDuplicateEmail(DuplicateEmailException exception,
                                                        HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", "이미 등록된 이메일입니다.",
                List.of(detail("email", "DUPLICATE", "이미 등록된 이메일입니다.")), request);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(InvalidCredentialsException exception,
                                                             HttpServletRequest request) {
        // REQ-011 결정 #5: 가입되지 않은 이메일과 비밀번호 불일치를 구분하지 않고 동일 응답.
        return error(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                "이메일 또는 비밀번호가 올바르지 않습니다.",
                List.of(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception,
                                                     HttpServletRequest request) {
        List<ApiError.FieldError> details = exception.getBindingResult().getFieldErrors().stream()
                .map(this::toFieldError)
                .toList();
        return error(HttpStatus.BAD_REQUEST, CODE_INVALID_REQUEST, "요청 값이 유효하지 않습니다.",
                details, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleNotReadable(HttpMessageNotReadableException exception,
                                                     HttpServletRequest request) {
        Throwable cause = exception.getCause();
        if (cause instanceof UnrecognizedPropertyException upe) {
            String field = upe.getPropertyName();
            return error(HttpStatus.BAD_REQUEST, CODE_INVALID_REQUEST, "알 수 없는 필드를 포함했습니다.",
                    List.of(detail(field, "UNKNOWN_FIELD", DETAIL_CODE_TO_MESSAGE.get("UNKNOWN_FIELD"))),
                    request);
        }
        if (cause instanceof InvalidFormatException ife) {
            String field = lastFieldName(ife.getPath());
            return error(HttpStatus.BAD_REQUEST, CODE_INVALID_REQUEST, "요청 본문 형식이 올바르지 않습니다.",
                    field == null ? List.of()
                            : List.of(detail(field, "INVALID_FORMAT", DETAIL_CODE_TO_MESSAGE.get("INVALID_FORMAT"))),
                    request);
        }
        if (cause instanceof JsonMappingException jme) {
            String field = lastFieldName(jme.getPath());
            return error(HttpStatus.BAD_REQUEST, CODE_INVALID_REQUEST, "요청 본문을 해석할 수 없습니다.",
                    field == null ? List.of()
                            : List.of(detail(field, "INVALID_FORMAT", DETAIL_CODE_TO_MESSAGE.get("INVALID_FORMAT"))),
                    request);
        }
        return error(HttpStatus.BAD_REQUEST, CODE_INVALID_REQUEST, "요청 본문을 해석할 수 없습니다.",
                List.of(), request);
    }

    @ExceptionHandler(InvalidSortKeyException.class)
    public ResponseEntity<ApiError> handleInvalidSortKey(InvalidSortKeyException exception,
                                                        HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, CODE_INVALID_REQUEST, "지원하지 않는 정렬 키입니다.",
                List.of(detail("sort", "INVALID_FORMAT", "지원하지 않는 정렬 키입니다: " + exception.key())),
                request);
    }

    @ExceptionHandler(DuplicateCategoryNameException.class)
    public ResponseEntity<ApiError> handleDuplicateCategoryName(DuplicateCategoryNameException exception,
                                                                HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "DUPLICATE_CATEGORY_NAME", "이미 사용 중인 카테고리 이름입니다.",
                List.of(detail("name", "DUPLICATE", "이미 사용 중인 카테고리 이름입니다.")), request);
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
        return error(HttpStatus.BAD_REQUEST, CODE_INVALID_REQUEST, exception.getMessage(),
                List.of(detail(exception.field(), "INVALID_FORMAT", exception.getMessage())), request);
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
        return error(HttpStatus.BAD_REQUEST, CODE_INVALID_REQUEST, exception.getMessage(),
                List.of(detail(exception.field(), "INVALID_FORMAT", exception.getMessage())), request);
    }

    @ExceptionHandler(InvalidCategoryException.class)
    public ResponseEntity<ApiError> handleInvalidCategory(InvalidCategoryException exception,
                                                          HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_CATEGORY", "유효하지 않은 카테고리입니다.",
                List.of(detail(exception.field(), "INVALID", "유효하지 않은 카테고리입니다.")), request);
    }

    // 잡지 못한 RuntimeException 만 500 으로 표준화한다. Spring framework 의 ServletException
    // 계열(NoHandlerFoundException, HttpRequestMethodNotSupportedException 등)은 Spring 의
    // 기본 핸들러가 그대로 처리하도록 둔다.
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiError> handleUnexpected(RuntimeException exception, HttpServletRequest request) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, CODE_INTERNAL_ERROR, "서버 내부 오류가 발생했습니다.",
                List.of(), request);
    }

    private ApiError.FieldError toFieldError(FieldError fe) {
        String annotation = fe.getCode();
        String detailCode = ANNOTATION_TO_DETAIL_CODE.getOrDefault(annotation, "INVALID_FORMAT");
        String message = DETAIL_CODE_TO_MESSAGE.getOrDefault(detailCode, "유효하지 않은 값입니다.");
        return new ApiError.FieldError(fe.getField(), detailCode, message);
    }

    private ApiError.FieldError detail(String field, String code, String message) {
        return new ApiError.FieldError(field, code, message);
    }

    private String lastFieldName(List<JsonMappingException.Reference> path) {
        if (path == null || path.isEmpty()) {
            return null;
        }
        return path.get(path.size() - 1).getFieldName();
    }

    private ResponseEntity<ApiError> error(HttpStatus status, String code, String message,
                                            List<ApiError.FieldError> details,
                                            HttpServletRequest request) {
        ApiError body = new ApiError(
                code, message, status.value(), Instant.now(), request.getRequestURI(), details);
        return ResponseEntity.status(status).body(body);
    }
}
