package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.common.ApiError;
import com.example.bddworkflow.harness.Requirement;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * REQ-004 인증 실패 시 401 + UNAUTHORIZED ApiError 본문으로 응답한다.
 */
@Requirement("REQ-004")
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    public static final String CODE = "UNAUTHORIZED";

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        ApiError body = new ApiError(
                CODE,
                authException.getMessage(),
                HttpStatus.UNAUTHORIZED.value(),
                Instant.now(),
                request.getRequestURI(),
                List.of());
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), body);
    }
}
