package com.example.bddworkflow.harness;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.PlainJWT;
import com.nimbusds.jwt.SignedJWT;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * REQ-004 Acceptance Test 가 HS256 JWT Bearer 토큰을 직접 발급하기 위한 유틸.
 * application.yml 의 app.auth.jwt.* 기본값과 동일한 secret/issuer/audience 를 사용한다.
 */
public final class TestJwt {

    public static final String SECRET = "local-development-only-secret-32bytes!!";
    public static final String ISSUER = "bdd-workflow";
    public static final String AUDIENCE = "bdd-workflow-api";
    public static final String OTHER_SECRET = "another-secret-key-32bytes-or-longer!";

    private TestJwt() {
    }

    public static String signFor(UUID subject) {
        return claims(subject).sign();
    }

    public static Claims claims(UUID subject) {
        return new Claims().subject(subject);
    }

    public static Claims claims() {
        return new Claims();
    }

    public static String alg(String algName) {
        // alg=none 토큰. 서명 없이 헤더와 본문만.
        Instant now = Instant.now();
        JWTClaimsSet body = new JWTClaimsSet.Builder()
                .subject(UUID.randomUUID().toString())
                .issuer(ISSUER)
                .audience(List.of(AUDIENCE))
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(3600)))
                .build();
        if ("none".equalsIgnoreCase(algName)) {
            return new PlainJWT(body).serialize();
        }
        throw new IllegalArgumentException("지원하지 않는 alg: " + algName);
    }

    public static class Claims {
        private UUID subject;
        private String subjectLiteral;
        private String issuer = ISSUER;
        private List<String> audience = List.of(AUDIENCE);
        private Instant issuedAt = Instant.now();
        private Instant expiresAt = Instant.now().plusSeconds(3600);
        private String secret = SECRET;
        private boolean omitSubject = false;

        public Claims subject(UUID subject) {
            this.subject = subject;
            this.subjectLiteral = null;
            this.omitSubject = false;
            return this;
        }

        public Claims subjectLiteral(String raw) {
            this.subjectLiteral = raw;
            this.subject = null;
            this.omitSubject = false;
            return this;
        }

        public Claims omitSubject() {
            this.omitSubject = true;
            this.subject = null;
            this.subjectLiteral = null;
            return this;
        }

        public Claims issuer(String issuer) {
            this.issuer = issuer;
            return this;
        }

        public Claims audience(String audience) {
            this.audience = List.of(audience);
            return this;
        }

        public Claims expiresAt(Instant instant) {
            this.expiresAt = instant;
            if (this.issuedAt.isAfter(instant)) {
                this.issuedAt = instant.minusSeconds(1);
            }
            return this;
        }

        public Claims expiresIn(Duration duration) {
            return expiresAt(Instant.now().plus(duration));
        }

        public Claims expiredBy(Duration ago) {
            return expiresAt(Instant.now().minus(ago));
        }

        public Claims signedWith(String secret) {
            this.secret = secret;
            return this;
        }

        public String sign() {
            JWTClaimsSet.Builder b = new JWTClaimsSet.Builder()
                    .issuer(issuer)
                    .audience(audience)
                    .issueTime(Date.from(issuedAt))
                    .expirationTime(Date.from(expiresAt));
            if (!omitSubject) {
                if (subject != null) {
                    b.subject(subject.toString());
                } else if (subjectLiteral != null) {
                    b.subject(subjectLiteral);
                }
            }
            try {
                SignedJWT jwt = new SignedJWT(
                        new JWSHeader.Builder(JWSAlgorithm.HS256).build(),
                        b.build());
                JWSSigner signer = new MACSigner(secret.getBytes());
                jwt.sign(signer);
                return jwt.serialize();
            } catch (JOSEException ex) {
                throw new IllegalStateException("Failed to sign test JWT", ex);
            }
        }
    }
}
