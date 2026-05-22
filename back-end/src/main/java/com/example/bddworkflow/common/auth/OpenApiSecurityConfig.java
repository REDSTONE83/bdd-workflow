package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Requirement("REQ-004")
@Configuration
public class OpenApiSecurityConfig {

    public static final String BEARER_SCHEME_NAME = "bearerJwt";

    @Bean
    public OpenAPI bddWorkflowOpenAPI() {
        return new OpenAPI()
                .components(new Components().addSecuritySchemes(
                        BEARER_SCHEME_NAME,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("REQ-004 JWT Bearer 인증")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME_NAME));
    }
}
