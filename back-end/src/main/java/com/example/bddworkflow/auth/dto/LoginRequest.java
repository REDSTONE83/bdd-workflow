package com.example.bddworkflow.auth.dto;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * REQ-011 로그인 요청 본문. 결정 #25 에 따라 이메일 형식과 비밀번호 빈 값은
 * Bean Validation 으로 인증 단계 진입 전에 거절한다.
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
    // 결정 #(이메일 정규화): 가입과 동일하게 앞뒤 공백은 정규화로 흡수해 같은 계정으로 인식한다.
    // Bean Validation 은 trim 된 값으로 @Email 을 평가하므로, 공백만 차이 나는 입력은 200/204 흐름을 탄다.
    public LoginRequest {
        if (email != null) {
            email = email.trim();
        }
    }
}
