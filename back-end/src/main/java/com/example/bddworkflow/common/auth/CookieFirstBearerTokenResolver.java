package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.harness.Requirement;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.stereotype.Component;

/**
 * REQ-011 결정 #3, #21: access token Cookie 를 우선 인식하고, Cookie 가 없으면
 * REQ-004 의 Authorization Bearer 헤더를 fallback 으로 인정한다. 동시 존재 시
 * Cookie 의 토큰을 사용한다.
 */
@Requirement("REQ-011")
@Component
public class CookieFirstBearerTokenResolver implements BearerTokenResolver {

    private final AuthCookieProperties cookieProperties;
    private final DefaultBearerTokenResolver headerResolver = new DefaultBearerTokenResolver();

    public CookieFirstBearerTokenResolver(AuthCookieProperties cookieProperties) {
        this.cookieProperties = cookieProperties;
    }

    @Override
    public String resolve(HttpServletRequest request) {
        String fromCookie = readAccessTokenCookie(request);
        if (fromCookie != null && !fromCookie.isEmpty()) {
            return fromCookie;
        }
        return headerResolver.resolve(request);
    }

    private String readAccessTokenCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        String name = cookieProperties.name();
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
