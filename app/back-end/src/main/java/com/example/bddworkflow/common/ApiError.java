package com.example.bddworkflow.common;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "API 오류 응답")
public record ApiError(
        @Schema(description = "오류 코드", example = "DUPLICATE_EMAIL")
        String code,

        @Schema(description = "오류 메시지", example = "이미 등록된 이메일입니다.")
        String message,

        @Schema(description = "HTTP 상태 코드", example = "409")
        int status,

        @Schema(description = "오류 발생 시각 (UTC)", example = "2026-05-22T12:34:56Z")
        Instant timestamp,

        @Schema(description = "요청 경로", example = "/users/signup")
        String path,

        @Schema(description = "필드 단위 상세")
        List<FieldError> details
) {

    @Schema(description = "필드 단위 오류 상세")
    public record FieldError(
            @Schema(description = "필드명", example = "email")
            String field,
            @Schema(description = "정규화된 사유 코드", example = "NOT_BLANK")
            String code,
            @Schema(description = "필드 단위 오류 메시지", example = "이미 등록된 이메일입니다.")
            String message
    ) {
    }
}
