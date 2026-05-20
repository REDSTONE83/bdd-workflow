package com.example.bddworkflow.common;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "API 오류 응답")
public record ApiError(
        @Schema(description = "오류 코드", example = "DUPLICATE_EMAIL")
        String code,

        @Schema(description = "오류 메시지", example = "이미 등록된 이메일입니다.")
        String message,

        @Schema(description = "오류가 발생한 필드", example = "email", nullable = true)
        String field
) {
}
