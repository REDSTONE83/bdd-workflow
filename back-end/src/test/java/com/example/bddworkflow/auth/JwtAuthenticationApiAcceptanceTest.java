package com.example.bddworkflow.auth;

import com.example.bddworkflow.category.repository.CategoryRepository;
import com.example.bddworkflow.harness.AcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.harness.TestJwt;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-004")
class JwtAuthenticationApiAcceptanceTest {

    private static final UUID ACTOR_ID = UUID.fromString("00000000-0000-0000-0000-000000000064");
    private static final UUID OTHER_USER_ID = UUID.fromString("00000000-0000-0000-0000-0000000000c8");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    void resetRepository() {
        categoryRepository.deleteAll();
    }

    // ----- 시나리오 1: 정상 인증 -----

    @Test
    @Covers("유효한 JWT Bearer 토큰이면 보호 API 요청이 인증된다")
    @DisplayName("유효한 JWT Bearer 토큰을 가진 호출자가 보호 API를 정상적으로 호출한다")
    void validJwtAuthenticatesProtectedRequest() throws Exception {
        String token = TestJwt.signFor(ACTOR_ID);
        categoryRepository.save(ACTOR_ID, "업무", "#2563EB", null, 1024);

        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @Covers("인증된 사용자의 식별자는 JWT sub 클레임의 UUID로 결정된다")
    @DisplayName("토큰의 sub UUID가 행위자로 사용되어 본인 자원만 응답된다")
    void subClaimUuidIsActor() throws Exception {
        String token = TestJwt.signFor(ACTOR_ID);
        categoryRepository.save(ACTOR_ID, "업무", "#2563EB", null, 1024);
        categoryRepository.save(OTHER_USER_ID, "타인업무", "#FF0000", null, 1024);

        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("업무"));
    }

    // ----- 시나리오 2: Authorization 헤더 없음 + ApiError 응답 -----

    @Test
    @Covers({
            "Authorization 헤더가 없으면 보호 API 요청이 거절된다",
            "인증 실패 응답은 401 상태와 UNAUTHORIZED 오류 코드를 가진 ApiError 형식이다"
    })
    @DisplayName("Authorization 헤더 없는 요청은 401 UNAUTHORIZED ApiError 로 거절된다")
    void missingAuthorizationHeaderReturnsUnauthorizedApiError() throws Exception {
        mockMvc.perform(get("/categories"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path").value("/categories"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    // ----- 시나리오 3: Bearer 아닌 형식 -----

    @Test
    @Covers("Authorization 헤더가 Bearer 형식이 아니면 보호 API 요청이 거절된다")
    @DisplayName("Basic 처럼 Bearer 가 아닌 Authorization 형식은 401 로 거절된다")
    void nonBearerAuthorizationReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ----- 시나리오 4: 임시 헤더만 -----

    @Test
    @Covers("X-User-Id 또는 X-Authenticated-User-Id 헤더만 전달된 요청은 Authorization 헤더 없는 요청과 동일하게 거절된다")
    @DisplayName("임시 사용자 헤더만 담은 요청은 401 UNAUTHORIZED 로 거절된다")
    void legacyUserHeaderOnlyReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/categories")
                        .header("X-Authenticated-User-Id", ACTOR_ID.toString())
                        .header("X-User-Id", ACTOR_ID.toString()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ----- 시나리오 5: 형식 깨짐 / 서명 위조 -----

    @Test
    @Covers({
            "JWT 형식이 잘못되면 보호 API 요청이 거절된다",
            "JWT 서명 검증에 실패하면 보호 API 요청이 거절된다"
    })
    @DisplayName("형식이 깨지거나 서명이 위조된 토큰은 401 로 거절된다")
    void malformedOrTamperedTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());

        String forged = TestJwt.claims(ACTOR_ID).signedWith(TestJwt.OTHER_SECRET).sign();
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + forged))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ----- 시나리오 6: HS256 외 알고리즘 -----

    @Test
    @Covers("HS256 외 알고리즘으로 서명된 JWT Bearer 토큰이면 보호 API 요청이 거절된다")
    @DisplayName("alg=none 토큰은 401 로 거절된다")
    void nonHs256AlgorithmReturnsUnauthorized() throws Exception {
        String unsigned = TestJwt.alg("none");
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + unsigned))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ----- 시나리오 7: clock skew 안 -----

    @Test
    @Covers("JWT exp가 현재 시각 기준 60초 이내 과거이면 보호 API 요청이 인증된다")
    @DisplayName("exp 가 현재 시각 기준 30초 과거여도 clock skew 안에서 인증된다")
    void expWithinClockSkewAuthenticates() throws Exception {
        String token = TestJwt.claims(ACTOR_ID).expiredBy(Duration.ofSeconds(30)).sign();
        categoryRepository.save(ACTOR_ID, "업무", "#2563EB", null, 1024);

        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    // ----- 시나리오 8: clock skew 초과 -----

    @Test
    @Covers("JWT exp가 현재 시각 기준 60초보다 더 오래전에 만료되었으면 보호 API 요청이 거절된다")
    @DisplayName("exp 가 5분 전이면 401 로 거절된다")
    void expBeyondClockSkewReturnsUnauthorized() throws Exception {
        String token = TestJwt.claims(ACTOR_ID).expiredBy(Duration.ofMinutes(5)).sign();
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ----- 시나리오 9: issuer / audience 불일치 -----

    @Test
    @Covers("JWT issuer가 서버 설정과 다르면 보호 API 요청이 거절된다")
    @DisplayName("issuer 가 다른 토큰은 401 로 거절된다")
    void wrongIssuerReturnsUnauthorized() throws Exception {
        String token = TestJwt.claims(ACTOR_ID).issuer("other-issuer").sign();
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @Covers("JWT audience가 서버 설정과 다르면 보호 API 요청이 거절된다")
    @DisplayName("audience 가 다른 토큰은 401 로 거절된다")
    void wrongAudienceReturnsUnauthorized() throws Exception {
        String token = TestJwt.claims(ACTOR_ID).audience("other-audience").sign();
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ----- 시나리오 10: sub 누락 / UUID 형식 오류 -----

    @Test
    @Covers("JWT sub 클레임이 없거나 UUID 형식이 아니면 보호 API 요청이 거절된다")
    @DisplayName("sub 가 비어 있거나 UUID 형식이 아니면 401 로 거절된다")
    void missingOrInvalidSubReturnsUnauthorized() throws Exception {
        String missingSub = TestJwt.claims().omitSubject().sign();
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + missingSub))
                .andExpect(status().isUnauthorized());

        String nonUuidSub = TestJwt.claims().subjectLiteral("not-a-uuid").sign();
        mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + nonUuidSub))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ----- 시나리오 12: 공개 경로 토큰 없이 -----

    @Test
    @Covers({
            "회원 가입 API는 JWT Bearer 토큰 없이 호출할 수 있다",
            "OpenAPI 문서와 Swagger UI는 JWT Bearer 토큰 없이 조회할 수 있다"
    })
    @DisplayName("회원 가입과 OpenAPI 문서는 토큰 없이 열린다")
    void publicPathsOpenWithoutToken() throws Exception {
        // 회원 가입
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "공개경로테스트",
                                  "email": "public-no-token@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated());

        // OpenAPI 문서
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());
    }

    // ----- 시나리오 13: 공개 경로 + 유효 토큰 -----

    @Test
    @Covers("공개 경로에 유효한 JWT Bearer 토큰이 전달되어도 요청이 허용된다")
    @DisplayName("공개 경로에 유효한 Bearer 토큰을 함께 보내도 정상 처리된다")
    void publicPathAllowsValidToken() throws Exception {
        String token = TestJwt.signFor(ACTOR_ID);
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .content("""
                                {
                                  "name": "유효토큰동봉",
                                  "email": "public-valid-token@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    // ----- 시나리오 14: 공개 경로 + 잘못된 토큰 -----

    @Test
    @Covers("공개 경로라도 잘못된 Bearer 토큰이 전달되면 요청이 거절된다")
    @DisplayName("공개 경로에 잘못된 Bearer 토큰을 함께 보내면 401 로 거절된다")
    void publicPathRejectsInvalidToken() throws Exception {
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt")
                        .content("""
                                {
                                  "name": "잘못된토큰",
                                  "email": "public-bad-token@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ----- 시나리오 15: stateless -----

    @Test
    @Covers("보호 API 응답에는 서버 세션 쿠키가 포함되지 않는다")
    @DisplayName("보호 API 응답에는 JSESSIONID 같은 서버 세션 쿠키가 포함되지 않는다")
    void protectedApiResponseHasNoSessionCookie() throws Exception {
        String token = TestJwt.signFor(ACTOR_ID);
        MvcResult result = mockMvc.perform(get("/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).as("보호 API 응답에 서버 세션 쿠키가 없어야 한다").isNull();
    }

    // ----- 시나리오 16: OpenAPI SecurityScheme -----

    @Test
    @Covers("OpenAPI 문서에는 JWT Bearer SecurityScheme이 포함된다")
    @DisplayName("OpenAPI 문서에 bearerJwt SecurityScheme 이 노출된다")
    void openApiDocExposesBearerScheme() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.securitySchemes.bearerJwt.type").value("http"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerJwt.scheme").value("bearer"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerJwt.bearerFormat").value("JWT"));
    }
}
