package com.example.bddworkflow.auth.dto;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

/**
 * REQ-011 GET /auth/me 응답. HttpOnly Cookie 환경에서 FE 가 자신의
 * 로그인 상태와 사용자 표시 정보를 얻기 위한 단일 진입점.
 */
@Requirement("REQ-011")
@Schema(description = "현재 사용자 정보")
public record UserMeResponse(

        @Schema(description = "사용자 식별자", example = "01910000-0000-7000-8000-000000000000")
        UUID id,

        @Schema(description = "사용자 이메일", example = "hong@example.com")
        String email
) {
}
