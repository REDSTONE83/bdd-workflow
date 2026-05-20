package com.example.bddworkflow.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "회원 가입 요청")
public record SignupRequest(
        @Schema(description = "사용자 이름", example = "홍길동")
        @NotBlank
        String name,

        @Schema(description = "이메일", example = "hong@example.com")
        @NotBlank
        @Email
        String email,

        @Schema(description = "비밀번호", example = "password123", minLength = 8)
        @NotBlank
        @Size(min = 8)
        String password
) {
}
