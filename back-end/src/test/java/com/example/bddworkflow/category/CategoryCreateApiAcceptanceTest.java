package com.example.bddworkflow.category;

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
@Requirement("REQ-003")
class CategoryCreateApiAcceptanceTest {

    private static final String USER_HEADER = "X-User-Id";
    private static final long USER_ID = 100L;
    private static final long OTHER_USER_ID = 200L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InMemoryCategoryRepository categoryRepository;

    @BeforeEach
    void resetRepository() {
        categoryRepository.deleteAll();
    }

    @Test
    @Covers("유효한 정보이면 카테고리가 생성된다")
    @DisplayName("유효한 정보이면 카테고리가 생성된다")
    void createWithValidRequestReturnsCreated() throws Exception {
        // Given
        String requestBody = """
                {
                  "name": "업무",
                  "color": "#2563EB",
                  "description": "회사 일",
                  "displayOrder": 1024
                }
                """;

        // When / Then
        mockMvc.perform(post("/categories")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoryId").exists())
                .andExpect(jsonPath("$.name").value("업무"))
                .andExpect(jsonPath("$.color").value("#2563EB"))
                .andExpect(jsonPath("$.description").value("회사 일"))
                .andExpect(jsonPath("$.displayOrder").value(1024));

        assertThat(categoryRepository.findAllByUserId(USER_ID)).hasSize(1);
    }

    @Test
    @Covers("이름은 앞뒤 공백이 제거되어 저장된다")
    @DisplayName("이름은 앞뒤 공백이 제거되어 저장된다")
    void createTrimsLeadingAndTrailingWhitespaceInName() throws Exception {
        // Given
        String requestBody = """
                {
                  "name": "  업무  ",
                  "color": "#2563EB",
                  "displayOrder": 1024
                }
                """;

        // When / Then
        mockMvc.perform(post("/categories")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("업무"));

        assertThat(categoryRepository.findByUserIdAndName(USER_ID, "업무")).isPresent();
        assertThat(categoryRepository.findByUserIdAndName(USER_ID, "  업무  ")).isEmpty();
    }

    @Test
    @Covers("이름이 비어 있거나 공백만 입력하면 카테고리 생성이 거절된다")
    @DisplayName("이름이 비어 있거나 공백만 입력하면 카테고리 생성이 거절된다")
    void createWithBlankNameReturnsBadRequest() throws Exception {
        // Given
        String requestBody = """
                {
                  "name": "   ",
                  "color": "#2563EB"
                }
                """;

        // When / Then
        mockMvc.perform(post("/categories")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.field").value("name"));

        assertThat(categoryRepository.findAllByUserId(USER_ID)).isEmpty();
    }

    @Test
    @Covers("이름이 50자를 초과하면 카테고리 생성이 거절된다")
    @DisplayName("이름이 50자를 초과하면 카테고리 생성이 거절된다")
    void createWithTooLongNameReturnsBadRequest() throws Exception {
        // Given
        String longName = "가".repeat(51);
        String requestBody = """
                {
                  "name": "%s",
                  "color": "#2563EB"
                }
                """.formatted(longName);

        // When / Then
        mockMvc.perform(post("/categories")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.field").value("name"));
    }

    @Test
    @Covers("설명이 500자를 초과하면 카테고리 생성이 거절된다")
    @DisplayName("설명이 500자를 초과하면 카테고리 생성이 거절된다")
    void createWithTooLongDescriptionReturnsBadRequest() throws Exception {
        // Given
        String longDescription = "가".repeat(501);
        String requestBody = """
                {
                  "name": "업무",
                  "description": "%s"
                }
                """.formatted(longDescription);

        // When / Then
        mockMvc.perform(post("/categories")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.field").value("description"));
    }

    @Test
    @Covers("색상 형식이 잘못되면 카테고리 생성이 거절된다")
    @DisplayName("색상 형식이 잘못되면 카테고리 생성이 거절된다")
    void createWithInvalidColorReturnsBadRequest() throws Exception {
        // Given
        String requestBody = """
                {
                  "name": "업무",
                  "color": "blue"
                }
                """;

        // When / Then
        mockMvc.perform(post("/categories")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.field").value("color"));
    }

    @Test
    @Covers("같은 사용자가 이미 등록한 이름이면 카테고리 생성이 거절된다")
    @DisplayName("같은 사용자가 이미 등록한 이름이면 카테고리 생성이 거절된다")
    void createWithDuplicateNameReturnsConflict() throws Exception {
        // Given
        categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        String requestBody = """
                {
                  "name": "업무",
                  "color": "#16A34A"
                }
                """;

        // When / Then
        mockMvc.perform(post("/categories")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_CATEGORY_NAME"))
                .andExpect(jsonPath("$.field").value("name"));

        // 다른 사용자는 동일 이름을 가질 수 있다
        assertThat(categoryRepository.findByUserIdAndName(OTHER_USER_ID, "업무")).isEmpty();
    }

    @Test
    @Covers("정렬 순서를 입력하지 않으면 본인 카테고리의 최대 정렬 순서에 1024를 더한 값으로 할당된다")
    @DisplayName("정렬 순서를 입력하지 않으면 본인 카테고리의 최대 정렬 순서에 1024를 더한 값으로 할당된다")
    void createWithoutDisplayOrderAssignsMaxPlusStep() throws Exception {
        // Given
        categoryRepository.save(USER_ID, "업무", "#2563EB", null, 2048);
        String requestBody = """
                {
                  "name": "개인"
                }
                """;

        // When / Then
        mockMvc.perform(post("/categories")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.displayOrder").value(3072));
    }
}
