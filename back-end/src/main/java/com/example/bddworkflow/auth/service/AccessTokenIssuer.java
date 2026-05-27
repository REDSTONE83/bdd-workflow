package com.example.bddworkflow.auth.service;

import com.example.bddworkflow.harness.Requirement;

import java.time.Instant;
import java.util.UUID;

/**
 * REQ-011 access token (HS256 JWT) 발급 계약. REQ-004 와 같은
 * issuer/audience/secret 을 사용하고, 만료 시각은 발급 시점 + 60분이다.
 */
@Requirement("REQ-011")
public interface AccessTokenIssuer {

    /**
     * 주어진 사용자 UUID 를 sub 클레임으로 담은 access token 을 발급한다.
     *
     * @param userId 인증 대상 사용자 UUID
     * @return 발급된 토큰과 만료 시각
     */
    IssuedToken issue(UUID userId);

    record IssuedToken(String value, Instant expiresAt) {
    }
}
