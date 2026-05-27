package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.harness.Requirement;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * REQ-011 access token Cookie 의 속성. profile 별 yml 에서 secure 만 분기한다.
 * 결정 #16: HttpOnly, SameSite 는 모든 profile 에서 유지, Secure 는 prod 에서만 켠다.
 */
@Requirement("REQ-011")
@ConfigurationProperties(prefix = "app.auth.cookie")
public record AuthCookieProperties(
        String name,
        String path,
        String sameSite,
        long maxAgeSeconds,
        boolean secure) {
}
