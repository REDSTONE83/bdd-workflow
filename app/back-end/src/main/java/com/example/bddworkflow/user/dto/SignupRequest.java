package com.example.bddworkflow.user.dto;

import com.example.bddworkflow.common.Strings;
import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Requirement("REQ-001")
@Schema(description = "회원 가입 요청. 이름은 trim, 이메일은 trim + 소문자 정규화 후 검증된다.")
public record SignupRequest(
        @Schema(description = "사용자 이름", example = "홍길동")
        @NotBlank
        @Size(max = 100)
        String name,

        @Schema(description = "이메일", example = "hong@example.com")
        @NotBlank
        @Email
        String email,

        // 비밀번호는 ASCII 출력 가능 문자(U+0020 ~ U+007E)만 허용해 글자 수와 바이트 수를 일치시킨다.
        // BCrypt 72바이트 한계와 `@Size(max=72)` 가 정확히 같아지고, 다국어 입력의 "보이지 않는 잘림"이 사라진다.
        @Schema(description = "비밀번호 (8자 이상 72자 이하, ASCII 출력 가능 문자만 허용)",
                example = "password123", minLength = 8, maxLength = 72)
        @NotBlank
        @Size(min = 8, max = 72)
        @Pattern(regexp = "^[\\x20-\\x7E]+$")
        String password
) {
    public SignupRequest {
        // BCrypt 가 72바이트만 의미 있으므로 가입 시점에 명시적으로 거절한다.
        // password 는 공백 자체가 사용자 의도일 수 있어 trim 하지 않는다.
        name = Strings.trimToNull(name);
        email = Strings.normalizeEmail(email);
    }
}
