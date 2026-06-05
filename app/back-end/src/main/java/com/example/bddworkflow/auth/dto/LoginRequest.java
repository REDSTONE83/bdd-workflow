package com.example.bddworkflow.auth.dto;

import com.example.bddworkflow.common.Strings;
import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * REQ-011 로그인 요청 본문. 결정 #25 에 따라 이메일 형식과 비밀번호 빈 값은
 * Bean Validation 으로 인증 단계 진입 전에 거절한다. 이메일은 가입과 동일하게
 * trim + 소문자 정규화 후 비교한다.
 */
@Requirement("REQ-011")
@Schema(description = "로그인 요청")
public record LoginRequest(

        @Schema(description = "이메일", example = "hong@example.com")
        @NotBlank
        @Email
        String email,

        @Schema(description = "비밀번호", example = "password123")
        @NotBlank
        String password
) {
    public LoginRequest {
        email = Strings.normalizeEmail(email);
    }
}
