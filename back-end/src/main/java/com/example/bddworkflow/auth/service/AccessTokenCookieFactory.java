package com.example.bddworkflow.auth.service;

import com.example.bddworkflow.common.auth.AuthCookieProperties;
import com.example.bddworkflow.harness.Requirement;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.server.Cookie.SameSite;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * REQ-011 access token 을 담는 HttpOnly Cookie 의 발급/만료를 한 곳에서 만든다.
 * DB 접근이 없는 순수 helper 이므로 서비스가 아닌 component 로 둔다 (transaction.md).
 */
@Requirement("REQ-011")
@Component
@RequiredArgsConstructor
public class AccessTokenCookieFactory {

    private final AuthCookieProperties cookieProperties;

    public ResponseCookie issue(String accessToken) {
        return cookie(accessToken, cookieProperties.maxAgeSeconds());
    }

    public ResponseCookie expire() {
        return cookie("", 0L);
    }

    private ResponseCookie cookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from(cookieProperties.name(), value)
                .path(cookieProperties.path())
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .sameSite(SameSite.valueOf(cookieProperties.sameSite().toUpperCase()).attributeValue())
                .maxAge(maxAgeSeconds)
                .build();
    }
}
