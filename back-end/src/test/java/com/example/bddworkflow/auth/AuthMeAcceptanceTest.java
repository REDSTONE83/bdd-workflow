package com.example.bddworkflow.auth;

import com.example.bddworkflow.common.auth.AuthCookieProperties;
import com.example.bddworkflow.harness.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.harness.TestJwt;
import com.example.bddworkflow.user.domain.UserAccount;
import com.example.bddworkflow.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * REQ-011 GET /auth/me GREEN: 인증/비인증 분기.
 */
@ApiAcceptanceTest
@Requirement("REQ-011")
class AuthMeAcceptanceTest {

    private static final String EMAIL = "me-user@example.com";
    private static final String PASSWORD = "password123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthCookieProperties cookieProperties;

    @BeforeEach
    void resetRepository() {
        userRepository.deleteAll();
    }

    @Test
    @Covers("인증된 상태에서 현재 사용자 조회를 호출하면 자신의 식별자와 이메일이 반환된다")
    @DisplayName("인증된 사용자가 GET /auth/me 로 자신의 id 와 email 을 받는다")
    void authenticatedUserReceivesOwnIdentityAndEmail() throws Exception {
        UserAccount account = userRepository.save("나본인", EMAIL, passwordEncoder.encode(PASSWORD));
        String token = TestJwt.signFor(account.id());

        mockMvc.perform(get("/auth/me")
                        .cookie(new Cookie(cookieProperties.name(), token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(account.id().toString()))
                .andExpect(jsonPath("$.email").value(EMAIL));
    }

    @Test
    @Covers("인증되지 않은 상태에서 현재 사용자 조회를 호출하면 거절된다")
    @DisplayName("비인증 상태로 호출한 GET /auth/me 는 401 로 거절된다")
    void unauthenticatedMeCallIsRejected() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
