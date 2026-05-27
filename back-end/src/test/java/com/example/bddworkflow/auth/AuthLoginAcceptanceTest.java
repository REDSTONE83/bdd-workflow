package com.example.bddworkflow.auth;

import com.example.bddworkflow.common.auth.AuthCookieProperties;
import com.example.bddworkflow.harness.AcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * REQ-011 로그인 GREEN: 자격 증명 검증, 이메일 정규화, 실패 응답 통일, 형식 검증 분기,
 * 응답 본문 비어 있음, 만료 시각 60분, FS-1/FS-2 BE 측 진입점.
 */
@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-011")
class AuthLoginAcceptanceTest {

    private static final String EMAIL = "login-user@example.com";
    private static final String PASSWORD = "password123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthCookieProperties cookieProperties;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void resetRepository() {
        userRepository.deleteAll();
        userRepository.save("로그인사용자", EMAIL, passwordEncoder.encode(PASSWORD));
    }

    @Test
    @Covers("등록된 이메일과 비밀번호로 로그인하면 인증 세션이 시작된다")
    @DisplayName("정상 자격 증명 로그인은 204 + ACCESS_TOKEN Cookie 를 응답한다")
    void successfulLoginIssuesAccessTokenCookie() throws Exception {
        MvcResult result = perform(EMAIL, PASSWORD)
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).startsWith(cookieProperties.name() + "=");
        assertThat(setCookie).contains("HttpOnly");
    }

    @Test
    @Covers("가입할 때 사용한 이메일과 대소문자와 앞뒤 공백만 다른 값으로 로그인해도 같은 계정으로 인증된다")
    @DisplayName("이메일 대소문자/공백 정규화 후 같은 계정으로 인증된다")
    void normalizedEmailMatchesSameAccount() throws Exception {
        perform("  Login-User@EXAMPLE.com  ", PASSWORD)
                .andExpect(status().isNoContent())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }

    @Test
    @Covers("등록되지 않은 이메일로 로그인하면 이메일 존재 여부를 알 수 없는 동일한 인증 실패 응답을 받는다")
    @DisplayName("미가입 이메일은 401 INVALID_CREDENTIALS 통합 응답")
    void unknownEmailReturnsInvalidCredentials() throws Exception {
        perform("nobody@example.com", PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("이메일 또는 비밀번호가 올바르지 않습니다."));
    }

    @Test
    @Covers("등록된 이메일이지만 비밀번호가 일치하지 않으면 동일한 인증 실패 응답을 받는다")
    @DisplayName("비밀번호 불일치도 같은 401 INVALID_CREDENTIALS 통합 응답")
    void wrongPasswordReturnsSameInvalidCredentials() throws Exception {
        perform(EMAIL, "incorrect-password")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("이메일 또는 비밀번호가 올바르지 않습니다."));
    }

    @Test
    @Covers("이메일 또는 비밀번호가 비어 있거나 이메일 형식이 아닌 로그인 요청은 인증을 시도하기 전에 형식 검증 오류 응답으로 거절되고, 자격 증명 인증 실패 응답과 구분된다")
    @DisplayName("형식 오류는 400 VALIDATION_FAILED 로 응답하고 401 자격 증명 실패와 구분된다")
    void invalidRequestFormatReturnsValidationError() throws Exception {
        perform("", PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        perform(EMAIL, "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        perform("not-an-email", PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @Covers("로그인 성공 응답의 본문은 비어 있다")
    @DisplayName("로그인 성공 응답은 본문이 비어 있다")
    void successfulLoginHasEmptyBody() throws Exception {
        perform(EMAIL, PASSWORD)
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
    }

    @Test
    @Covers("로그인 인증 정보의 유효 기간은 발급 시점부터 60분이다")
    @DisplayName("발급된 인증 Cookie 의 Max-Age 는 3600초이다")
    void cookieMaxAgeIsSixtyMinutes() throws Exception {
        MvcResult result = perform(EMAIL, PASSWORD)
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        assertThat(extractAttributeLong(setCookie, "Max-Age")).isEqualTo(3600L);
    }

    @Test
    @Covers("로그인 화면에서 인증에 성공하면 원래 가려고 했던 보호 화면이 있으면 그 화면으로, 없으면 자신의 할 일 목록 화면으로 이동한다")
    @DisplayName("로그인 성공 응답이 FE redirect 흐름의 단일 진입점이 된다 (BE 측 검증)")
    void successfulLoginProvidesRedirectEntryPoint() throws Exception {
        // FS-1 BE 측: 인증 성공 = 인증 Cookie 발급 = FE 가 다음 화면 결정 가능.
        MvcResult result = perform(EMAIL, PASSWORD)
                .andExpect(status().isNoContent())
                .andReturn();
        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie)
                .as("FE 가 redirect 를 결정할 수 있도록 인증 Cookie 가 발급되어야 한다")
                .isNotNull()
                .startsWith(cookieProperties.name() + "=");
    }

    @Test
    @Covers("비인증 사용자가 보호 화면에 접근했다가 로그인에 성공하면 원래 가려고 했던 보호 화면으로 돌아온다")
    @DisplayName("로그인 성공으로 발급된 Cookie 는 직전에 막혔던 보호 API 요청을 통과시킨다 (BE 측 검증)")
    void successfulLoginRestoresProtectedAccess() throws Exception {
        // FS-2 BE 측: 로그인 성공 Cookie = 보호 자원 접근 통과 = FE 가 원래 경로로 navigate.
        MvcResult result = perform(EMAIL, PASSWORD)
                .andExpect(status().isNoContent())
                .andReturn();
        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        String tokenValue = extractCookieValue(setCookie, cookieProperties.name());
        assertThat(tokenValue).isNotEmpty();

        // 같은 토큰으로 보호 API 호출이 인증되는지 확인 (BE-10 과 같은 검증 표면)
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/auth/me")
                        .cookie(new jakarta.servlet.http.Cookie(cookieProperties.name(), tokenValue)))
                .andExpect(status().isOk());
    }

    private org.springframework.test.web.servlet.ResultActions perform(String email, String password)
            throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("email", email, "password", password));
        return mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private long extractAttributeLong(String setCookie, String attribute) {
        Pattern pattern = Pattern.compile("(?i)" + attribute + "=([0-9]+)");
        Matcher matcher = pattern.matcher(setCookie);
        assertThat(matcher.find()).isTrue();
        return Long.parseLong(matcher.group(1));
    }

    private String extractCookieValue(String setCookie, String name) {
        Pattern pattern = Pattern.compile("^" + Pattern.quote(name) + "=([^;]*)");
        Matcher matcher = pattern.matcher(setCookie);
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }
}
