package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.harness.Requirement;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Requirement({"REQ-004", "REQ-011"})
@ConfigurationProperties(prefix = "app.auth.jwt")
public record JwtProperties(
        String secret,
        String issuer,
        String audience,
        long clockSkewSeconds,
        long accessTokenTtlSeconds) {
}
