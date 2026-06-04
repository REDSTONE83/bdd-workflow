package com.example.bddworkflow.user.dto;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Requirement("REQ-001")
@Schema(description = "회원 가입 응답")
public record SignupResponse(
        @Schema(description = "생성된 사용자 ID", example = "01900000-0000-7000-8000-000000000000")
        UUID userId,

        @Schema(description = "이메일", example = "hong@example.com")
        String email,

        @Schema(description = "사용자 이름", example = "홍길동")
        String name
) {
}
