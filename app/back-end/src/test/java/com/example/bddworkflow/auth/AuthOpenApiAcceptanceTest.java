package com.example.bddworkflow.auth;

import com.example.bddworkflow.testsupport.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * REQ-011 OpenAPI 문서가 cookieAuth / bearerJwt 두 SecurityScheme 을 모두 등록하고,
 * 보호 API 에는 두 방식 모두를 표시한다. 로그인/로그아웃은 인증 요구 없이 표시된다.
 */
@ApiAcceptanceTest
@Requirement("REQ-011")
class AuthOpenApiAcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @Covers("OpenAPI 문서에는 Cookie 인증 방식과 Bearer 인증 방식이 모두 등록된다")
    @DisplayName("OpenAPI 문서에 cookieAuth 와 bearerJwt SecurityScheme 이 모두 등록된다")
    void securitySchemesIncludeCookieAndBearer() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.securitySchemes.cookieAuth.type").value("apiKey"))
                .andExpect(jsonPath("$.components.securitySchemes.cookieAuth.in").value("cookie"))
                .andExpect(jsonPath("$.components.securitySchemes.cookieAuth.name").value("ACCESS_TOKEN"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerJwt.type").value("http"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerJwt.scheme").value("bearer"));
    }

    @Test
    @Covers("보호 API는 Cookie 인증 방식과 Bearer 인증 방식 중 하나로 호출할 수 있다고 OpenAPI 문서에 표시된다")
    @DisplayName("보호 API operation 에 cookieAuth 와 bearerJwt 가 둘 다 표시된다")
    void protectedOperationListsBothSchemes() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/auth/me'].get.security[?(@.cookieAuth)]").exists())
                .andExpect(jsonPath("$.paths['/auth/me'].get.security[?(@.bearerJwt)]").exists())
                .andExpect(jsonPath("$.paths['/categories'].get.security[?(@.cookieAuth)]").exists())
                .andExpect(jsonPath("$.paths['/categories'].get.security[?(@.bearerJwt)]").exists());
    }

    @Test
    @Covers("로그인과 로그아웃 API는 OpenAPI 문서에 인증 요구 없이 호출할 수 있다고 표시된다")
    @DisplayName("/auth/login 과 /auth/logout operation 에는 security 가 비어 있다")
    void loginAndLogoutOperationsHaveNoSecurityRequirement() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/auth/login'].post.security").doesNotExist())
                .andExpect(jsonPath("$.paths['/auth/logout'].post.security").doesNotExist());
    }
}
