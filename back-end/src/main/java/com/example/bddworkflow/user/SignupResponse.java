package com.example.bddworkflow.user;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;

@Requirement("REQ-001")
@Schema(description = "회원 가입 응답")
public record SignupResponse(
        @Schema(description = "생성된 사용자 ID", example = "1")
        Long userId,

        @Schema(description = "이메일", example = "hong@example.com")
        String email,

        @Schema(description = "사용자 이름", example = "홍길동")
        String name
) {
}
