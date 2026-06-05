package com.example.bddworkflow.common.auth;

import com.example.bddworkflow.harness.Requirement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * REQ-001 가입과 REQ-011 로그인이 같은 BCrypt 인스턴스를 공유하도록
 * PasswordEncoder 를 단일 Spring Bean 으로 분리한다. (REQ-011 결정 #18)
 */
@Requirement({"REQ-001", "REQ-011"})
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
