package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.harness.Requirement;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * REQ-004 검증된 Jwt 의 sub UUID 를 AuthenticatedUser principal 로 매핑한다.
 * sub 가 비어 있거나 UUID 형식이 아니면 InvalidBearerTokenException 으로 거절한다.
 */
@Requirement("REQ-004")
@Component
public class AuthenticatedUserJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String subject = jwt.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new InvalidBearerTokenException("Missing JWT subject claim.");
        }
        UUID userId;
        try {
            userId = UUID.fromString(subject);
        } catch (IllegalArgumentException ex) {
            throw new InvalidBearerTokenException("JWT subject is not a valid UUID.", ex);
        }
        AuthenticatedUser principal = new AuthenticatedUser(userId);
        return new UsernamePasswordAuthenticationToken(
                principal,
                jwt,
                AuthorityUtils.createAuthorityList("ROLE_USER"));
    }
}
