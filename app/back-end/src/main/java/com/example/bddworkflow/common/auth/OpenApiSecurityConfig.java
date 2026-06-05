package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Set;

/**
 * REQ-004 Bearer JWT + REQ-011 Cookie 두 SecurityScheme 을 OpenAPI 문서에 등록한다.
 *
 * <p>전역 default Security Requirement 는 두지 않는다 (결정 #4, #25). 대신
 * {@link #protectedEndpointSecurityCustomizer()} 가 PUBLIC_AUTH_PATHS 에 해당하지 않는
 * 모든 endpoint 에 두 SecurityScheme 을 표시한다.
 */
@Requirement({"REQ-004", "REQ-011"})
@Configuration
public class OpenApiSecurityConfig {

    public static final String BEARER_SCHEME_NAME = "bearerJwt";
    public static final String COOKIE_SCHEME_NAME = "cookieAuth";

    /**
     * OpenAPI 문서에 노출되는 공개 endpoint 경로. Springdoc 내부 path 는 OpenAPI 문서에 표시되지
     * 않아 {@link SecurityConfig#PUBLIC_APP_PATHS} 를 그대로 사용한다.
     */
    private static final Set<String> PUBLIC_AUTH_PATHS = Set.copyOf(SecurityConfig.PUBLIC_APP_PATHS);

    @Bean
    public OpenAPI bddWorkflowOpenAPI() {
        return new OpenAPI()
                .components(new Components()
                        .addSecuritySchemes(
                                BEARER_SCHEME_NAME,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("REQ-004 JWT Bearer 인증"))
                        .addSecuritySchemes(
                                COOKIE_SCHEME_NAME,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.COOKIE)
                                        .name("ACCESS_TOKEN")
                                        .description("REQ-011 HttpOnly Cookie 인증")));
    }

    /**
     * 공개 endpoint 가 아닌 모든 operation 에 두 SecurityScheme 을 둘 다 표시한다.
     * (REQ-011 결정 #4, #25)
     */
    @Bean
    public OpenApiCustomizer protectedEndpointSecurityCustomizer() {
        return openApi -> {
            if (openApi.getPaths() == null) {
                return;
            }
            openApi.getPaths().forEach((path, pathItem) -> {
                if (PUBLIC_AUTH_PATHS.contains(path)) {
                    return;
                }
                applyAuthRequirement(pathItem);
            });
        };
    }

    private void applyAuthRequirement(PathItem pathItem) {
        List<SecurityRequirement> requirements = List.of(
                new SecurityRequirement().addList(COOKIE_SCHEME_NAME),
                new SecurityRequirement().addList(BEARER_SCHEME_NAME)
        );
        for (Operation operation : pathItem.readOperations()) {
            if (operation.getSecurity() == null || operation.getSecurity().isEmpty()) {
                requirements.forEach(operation::addSecurityItem);
            }
        }
    }
}
