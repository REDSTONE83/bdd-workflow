package com.example.bddworkflow.category;

import com.example.bddworkflow.harness.AcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.user.InMemoryUserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-003")
class CategoryDefaultSeedApiAcceptanceTest {

    private static final String USER_HEADER = "X-User-Id";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InMemoryCategoryRepository categoryRepository;

    @Autowired
    private InMemoryUserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void resetRepositories() {
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @Covers("신규 사용자가 가입하면 업무(#2563EB, 1024), 개인(#16A34A, 2048), 기타(#6B7280, 3072) 세 개의 기본 카테고리가 자동 생성된다")
    @DisplayName("신규 사용자가 가입하면 업무(#2563EB, 1024), 개인(#16A34A, 2048), 기타(#6B7280, 3072) 세 개의 기본 카테고리가 자동 생성된다")
    void signupSeedsDefaultCategories() throws Exception {
        // Given
        String signupBody = """
                {
                  "name": "홍길동",
                  "email": "hong@example.com",
                  "password": "password123"
                }
                """;

        // When
        MvcResult signupResult = mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupBody))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode signupJson = objectMapper.readTree(signupResult.getResponse().getContentAsString());
        long userId = signupJson.get("userId").asLong();

        // Then
        mockMvc.perform(get("/categories").header(USER_HEADER, userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories.length()").value(3))
                .andExpect(jsonPath("$.categories[0].name").value("업무"))
                .andExpect(jsonPath("$.categories[0].color").value("#2563EB"))
                .andExpect(jsonPath("$.categories[0].displayOrder").value(1024))
                .andExpect(jsonPath("$.categories[1].name").value("개인"))
                .andExpect(jsonPath("$.categories[1].color").value("#16A34A"))
                .andExpect(jsonPath("$.categories[1].displayOrder").value(2048))
                .andExpect(jsonPath("$.categories[2].name").value("기타"))
                .andExpect(jsonPath("$.categories[2].color").value("#6B7280"))
                .andExpect(jsonPath("$.categories[2].displayOrder").value(3072));
    }
}
