package com.example.bddworkflow.auth;

import com.example.bddworkflow.common.auth.AuthCookieProperties;
import com.example.bddworkflow.testsupport.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * REQ-011 로컬/테스트 프로파일에서 Cookie 보안 속성. Secure 만 꺼져 있다.
 */
@ApiAcceptanceTest
@ActiveProfiles("test")
@Requirement("REQ-011")
class AuthCookieLocalTestProfileAcceptanceTest {

    private static final String EMAIL = "test-user@example.com";
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
        userRepository.save("테스트사용자", EMAIL, passwordEncoder.encode(PASSWORD));
    }

    @Test
    @Covers("로컬과 테스트 프로파일에서 로그인 성공 시 발급되는 인증 정보는 브라우저 JS가 직접 읽을 수 없고 다른 사이트로부터의 자동 전송이 차단되며, HTTPS 강제 전송만 적용되지 않는다")
    @DisplayName("test 프로파일 로그인 Cookie 는 HttpOnly + SameSite=Strict 이나 Secure 는 꺼져 있다")
    void localTestCookieOmitsOnlySecure() throws Exception {
        assertThat(cookieProperties.secure()).as("test profile 은 Secure=false").isFalse();

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", EMAIL, "password", PASSWORD))))
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).containsIgnoringCase("HttpOnly");
        assertThat(setCookie).containsIgnoringCase("SameSite=Strict");
        assertThat(setCookie).doesNotContainIgnoringCase("Secure");
    }
}
