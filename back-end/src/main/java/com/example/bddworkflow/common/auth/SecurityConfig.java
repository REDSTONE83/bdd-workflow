package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.harness.Requirement;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;
import java.time.Duration;
import java.util.List;

@Requirement({"REQ-004", "REQ-011"})
@Configuration
@EnableConfigurationProperties({JwtProperties.class, AuthCookieProperties.class})
public class SecurityConfig {

    public static final String[] PUBLIC_PATHS = {
            "/users/signup",
            "/auth/login",
            "/auth/logout",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AuthenticatedUserJwtConverter jwtAuthenticationConverter,
            JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
            CookieFirstBearerTokenResolver bearerTokenResolver) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_PATHS).permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(eh -> eh.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .oauth2ResourceServer(oauth2 -> oauth2
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .bearerTokenResolver(bearerTokenResolver)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
                .build();
    }

    @Bean
    public JwtDecoder jwtDecoder(JwtProperties properties) {
        SecretKeySpec key = new SecretKeySpec(properties.secret().getBytes(), "HmacSHA256");
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        decoder.setJwtValidator(jwtValidator(properties));
        return decoder;
    }

    private OAuth2TokenValidator<Jwt> jwtValidator(JwtProperties properties) {
        Duration clockSkew = Duration.ofSeconds(properties.clockSkewSeconds());
        String expectedAudience = properties.audience();
        OAuth2TokenValidator<Jwt> audienceValidator = new JwtClaimValidator<List<String>>(
                JwtClaimNames.AUD,
                aud -> aud != null && aud.contains(expectedAudience));
        return new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(clockSkew),
                new JwtIssuerValidator(properties.issuer()),
                audienceValidator);
    }
}
