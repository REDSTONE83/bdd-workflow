package com.example.bddworkflow.auth.controller;

import com.example.bddworkflow.auth.dto.LoginRequest;
import com.example.bddworkflow.auth.dto.UserMeResponse;
import com.example.bddworkflow.auth.service.AccessTokenCookieFactory;
import com.example.bddworkflow.auth.service.AuthService;
import com.example.bddworkflow.common.ApiError;
import com.example.bddworkflow.common.auth.AuthenticatedUser;
import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REQ-011 로그인/로그아웃/현재 사용자 조회 API.
 *
 * <p>결정 #25: 로그인 성공 응답은 204 No Content + Set-Cookie, 요청 형식 오류는 400 Bean Validation.
 * 결정 #2, #16: access token 은 HttpOnly Cookie 로만 전달한다.
 */
@Requirement("REQ-011")
@RestController
@RequestMapping("/auth")
@Tag(name = "Auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AccessTokenCookieFactory cookieFactory;

    @Requirement("REQ-011")
    @Operation(
            summary = "이메일·비밀번호 로그인",
            description = """
                    Requirement: REQ-011

                    이메일과 비밀번호로 인증하고, 성공 시 access token 을 HttpOnly Cookie 로 발급한다.
                    응답 본문은 비어 있다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "인증 성공"),
            @ApiResponse(
                    responseCode = "400",
                    description = "요청 본문 형식 검증 실패",
                    content = @Content(schema = @Schema(implementation = ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "자격 증명 인증 실패",
                    content = @Content(schema = @Schema(implementation = ApiError.class))
            )
    })
    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginRequest request) {
        ResponseCookie cookie = authService.login(request);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @Requirement("REQ-011")
    @Operation(
            summary = "로그아웃",
            description = """
                    Requirement: REQ-011

                    인증 여부와 무관하게 호출 가능하며, 로그인 시 발급한 Cookie 와 동일한 속성으로
                    즉시 만료시키는 Set-Cookie 를 응답한다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "로그아웃 처리 완료")
    })
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie expired = cookieFactory.expire();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, expired.toString())
                .build();
    }

    @Requirement("REQ-011")
    @Operation(
            summary = "현재 사용자 정보 조회",
            description = """
                    Requirement: REQ-011

                    HttpOnly Cookie 환경에서 FE 가 자신의 로그인 상태와 사용자 표시 정보를
                    얻기 위한 단일 진입점.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "현재 사용자 정보",
                    content = @Content(schema = @Schema(implementation = UserMeResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 정보 없음",
                    content = @Content(schema = @Schema(implementation = ApiError.class))
            )
    })
    @GetMapping("/me")
    public UserMeResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.loadCurrentUser(principal.id());
    }
}
