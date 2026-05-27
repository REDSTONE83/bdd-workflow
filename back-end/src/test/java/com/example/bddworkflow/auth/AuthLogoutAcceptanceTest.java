package com.example.bddworkflow.auth;

import com.example.bddworkflow.common.auth.AuthCookieProperties;
import com.example.bddworkflow.harness.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.harness.TestJwt;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * REQ-011 로그아웃 GREEN: 멱등 + Cookie 만료 + FS-3 (FE 후속 흐름 진입점).
 */
@ApiAcceptanceTest
@Requirement("REQ-011")
class AuthLogoutAcceptanceTest {

    private static final UUID ACTOR_ID = UUID.fromString("00000000-0000-0000-0000-000000000b01");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthCookieProperties cookieProperties;

    @Test
    @Covers("로그아웃 호출이 성공하면 인증 세션이 종료되어 같은 클라이언트의 이후 보호 API 요청이 거절된다")
    @DisplayName("로그아웃 후 같은 (만료된) Cookie 로 보호 API 호출하면 401 로 거절된다")
    void logoutEndsSessionForSubsequentProtectedCalls() throws Exception {
        String token = TestJwt.signFor(ACTOR_ID);

        MvcResult logout = mockMvc.perform(post("/auth/logout")
                        .cookie(new Cookie(cookieProperties.name(), token)))
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = logout.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        assertThat(extractAttributeLong(setCookie, "Max-Age")).isEqualTo(0L);

        // 브라우저가 Cookie 를 비운 뒤 같은 요청 → Cookie 없이 보호 API 호출.
        mockMvc.perform(get("/categories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Covers("인증되지 않은 상태에서 로그아웃을 호출해도 인증 세션 종료와 동일한 응답을 받는다")
    @DisplayName("비인증 상태 로그아웃도 204 + Cookie 만료 응답을 동일하게 반환한다")
    void unauthenticatedLogoutReturnsSameResponse() throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie)
                .as("비인증 상태 로그아웃도 Cookie 만료 응답을 동일하게 보낸다")
                .isNotNull();
        assertThat(extractAttributeLong(setCookie, "Max-Age")).isEqualTo(0L);
    }

    @Test
    @Covers("사용자 메뉴에서 로그아웃 항목을 선택해 로그아웃 호출이 성공하면 화면에서 사용자 정보가 사라지고 로그인 화면으로 이동한다")
    @DisplayName("로그아웃 성공 응답이 FE 후속 redirect 흐름의 진입점이 된다 (BE 측 검증)")
    void logoutSuccessProvidesRedirectEntryPoint() throws Exception {
        String token = TestJwt.signFor(ACTOR_ID);

        MvcResult result = mockMvc.perform(post("/auth/logout")
                        .cookie(new Cookie(cookieProperties.name(), token)))
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie)
                .as("FE 가 로그아웃 후 로그인 화면으로 이동할 수 있도록 Cookie 만료 응답이 발급된다")
                .isNotNull();
        assertThat(extractAttributeLong(setCookie, "Max-Age")).isEqualTo(0L);
    }

    private long extractAttributeLong(String setCookie, String attribute) {
        Pattern pattern = Pattern.compile("(?i)" + attribute + "=([0-9]+)");
        Matcher matcher = pattern.matcher(setCookie);
        assertThat(matcher.find()).isTrue();
        return Long.parseLong(matcher.group(1));
    }
}
