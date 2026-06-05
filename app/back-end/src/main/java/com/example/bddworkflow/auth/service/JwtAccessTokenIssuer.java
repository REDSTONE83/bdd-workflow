package com.example.bddworkflow.auth.service;

import com.example.bddworkflow.common.auth.JwtProperties;
import com.example.bddworkflow.harness.Requirement;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * REQ-011 access token 을 HS256 JWT 로 발급한다.
 * iss/aud/secret 는 REQ-004 와 같은 {@link JwtProperties} 를 공유하고,
 * 만료 시각은 발급 시점 + {@code accessTokenTtlSeconds} 로 둔다.
 */
@Requirement("REQ-011")
@Component
public class JwtAccessTokenIssuer implements AccessTokenIssuer {

    private final JwtProperties jwtProperties;

    public JwtAccessTokenIssuer(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @Override
    public IssuedToken issue(UUID userId) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(jwtProperties.accessTokenTtlSeconds());

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(userId.toString())
                .issuer(jwtProperties.issuer())
                .audience(List.of(jwtProperties.audience()))
                .issueTime(Date.from(issuedAt))
                .expirationTime(Date.from(expiresAt))
                .build();

        try {
            SignedJWT jwt = new SignedJWT(
                    new JWSHeader.Builder(JWSAlgorithm.HS256).build(),
                    claims);
            JWSSigner signer = new MACSigner(jwtProperties.secret().getBytes());
            jwt.sign(signer);
            return new IssuedToken(jwt.serialize(), expiresAt);
        } catch (JOSEException ex) {
            throw new IllegalStateException("HS256 JWT 서명 실패", ex);
        }
    }
}
