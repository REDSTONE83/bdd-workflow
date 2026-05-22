package com.example.bddworkflow.user;

import com.example.bddworkflow.user.repository.UserRepository;

import com.example.bddworkflow.harness.AcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-001")
class SignupApiAcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void resetRepository() {
        userRepository.deleteAll();
    }

    @Test
    @Covers("유효한 정보이면 계정이 생성된다")
    @DisplayName("처음 가입하는 사용자가 정상적으로 계정을 만든다")
    void signupWithValidRequestReturnsCreated() throws Exception {
        // Given
        String requestBody = """
                {
                  "name": "홍길동",
                  "email": "hong@example.com",
                  "password": "password123"
                }
                """;

        // When / Then
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.email").value("hong@example.com"))
                .andExpect(jsonPath("$.name").value("홍길동"));

        assertThat(userRepository.existsByEmail("hong@example.com")).isTrue();
    }

    @Test
    @Covers("중복 이메일이면 가입이 거절된다")
    @DisplayName("이미 가입된 이메일로 다시 가입을 시도해 실패한다")
    void signupWithDuplicateEmailReturnsConflict() throws Exception {
        // Given
        userRepository.save("기존사용자", "hong@example.com", "hash");
        String requestBody = """
                {
                  "name": "홍길동",
                  "email": "hong@example.com",
                  "password": "password123"
                }
                """;

        // When / Then
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"))
                .andExpect(jsonPath("$.details[0].field").value("email"));
    }

    @Test
    @Covers("비밀번호가 8자 미만이면 가입이 거절된다")
    @DisplayName("비밀번호가 짧아 가입을 거절당한다")
    void signupWithShortPasswordReturnsBadRequest() throws Exception {
        // Given
        String requestBody = """
                {
                  "name": "홍길동",
                  "email": "hong@example.com",
                  "password": "short"
                }
                """;

        // When / Then
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("password"));

        assertThat(userRepository.existsByEmail("hong@example.com")).isFalse();
    }
}
