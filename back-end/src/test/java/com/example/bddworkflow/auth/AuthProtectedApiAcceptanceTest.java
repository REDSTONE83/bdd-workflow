package com.example.bddworkflow.auth;

import com.example.bddworkflow.category.repository.CategoryRepository;
import com.example.bddworkflow.common.auth.AuthCookieProperties;
import com.example.bddworkflow.harness.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.harness.TestJwt;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * REQ-011 보호 API 의 Cookie/Bearer 인증 우선순위 GREEN.
 */
@ApiAcceptanceTest
@Requirement("REQ-011")
class AuthProtectedApiAcceptanceTest {

    private static final UUID COOKIE_ACTOR = UUID.fromString("00000000-0000-0000-0000-000000000c01");
    private static final UUID HEADER_ACTOR = UUID.fromString("00000000-0000-0000-0000-000000000c02");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthCookieProperties cookieProperties;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    void resetRepository() {
        categoryRepository.deleteAll();
    }

    @Test
    @Covers("발급된 인증 정보가 있는 보호 API 요청은 인증된다")
    @DisplayName("유효한 ACCESS_TOKEN Cookie 만 있어도 보호 API 호출이 인증된다")
    void cookieAlonePassesAuthentication() throws Exception {
        String token = TestJwt.signFor(COOKIE_ACTOR);
        mockMvc.perform(get("/categories")
                        .cookie(new Cookie(cookieProperties.name(), token)))
                .andExpect(status().isOk());
    }

    @Test
    @Covers("인증 정보가 Cookie와 Authorization 헤더에 모두 있으면 Cookie의 인증 정보로 인증된다")
    @DisplayName("Cookie 와 Bearer 가 모두 있으면 Cookie 토큰이 우선 사용된다")
    void cookieTakesPrecedenceOverBearerHeader() throws Exception {
        // Cookie 는 COOKIE_ACTOR, 헤더는 HEADER_ACTOR → /categories 결과가 COOKIE_ACTOR 자원만 포함하면 우선순위 입증.
        categoryRepository.save(COOKIE_ACTOR, "쿠키사용자업무", "#2563EB", null, 1024);
        categoryRepository.save(HEADER_ACTOR, "헤더사용자업무", "#FF0000", null, 1024);

        String cookieToken = TestJwt.signFor(COOKIE_ACTOR);
        String headerToken = TestJwt.signFor(HEADER_ACTOR);

        mockMvc.perform(get("/categories")
                        .cookie(new Cookie(cookieProperties.name(), cookieToken))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + headerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("쿠키사용자업무"));
    }

    @Test
    @Covers("인증 정보가 Cookie에 없고 유효한 Authorization Bearer 헤더만 있으면 보호 API 요청이 인증된다")
    @DisplayName("Cookie 부재 시 Bearer 헤더로 fallback 인증된다")
    void headerFallbackWhenCookieMissing() throws Exception {
        String token = TestJwt.signFor(HEADER_ACTOR);
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @Covers("인증 정보가 없으면 보호 API 요청이 거절된다")
    @DisplayName("Cookie 도 헤더도 없으면 401 로 거절된다")
    void noCredentialsRejected() throws Exception {
        mockMvc.perform(get("/categories"))
                .andExpect(status().isUnauthorized());
    }
}
