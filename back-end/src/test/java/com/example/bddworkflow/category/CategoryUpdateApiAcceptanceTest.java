package com.example.bddworkflow.category;

import com.example.bddworkflow.category.domain.Category;
import com.example.bddworkflow.category.repository.CategoryRepository;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-003")
class CategoryUpdateApiAcceptanceTest {

    private static final String USER_HEADER = "X-Authenticated-User-Id";
    private static final java.util.UUID USER_ID = java.util.UUID.fromString("00000000-0000-0000-0000-000000000064");
    private static final java.util.UUID OTHER_USER_ID = java.util.UUID.fromString("00000000-0000-0000-0000-0000000000c8");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    void resetRepository() {
        categoryRepository.deleteAll();
    }

    @Test
    @Covers("수정 시 입력한 항목만 변경되고 입력하지 않은 항목은 기존 값을 유지한다")
    @DisplayName("수정 시 입력한 항목만 변경되고 입력하지 않은 항목은 기존 값을 유지한다")
    void updateChangesOnlyIncludedFields() throws Exception {
        // Given
        Category existing = categoryRepository.save(USER_ID, "업무", "#2563EB", "회사 일", 1024);
        String requestBody = """
                {
                  "name": "업무 (수정)"
                }
                """;

        // When / Then
        mockMvc.perform(patch("/categories/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(existing.id().toString()))
                .andExpect(jsonPath("$.name").value("업무 (수정)"))
                .andExpect(jsonPath("$.color").value("#2563EB"))
                .andExpect(jsonPath("$.description").value("회사 일"))
                .andExpect(jsonPath("$.displayOrder").value(1024));
    }

    @Test
    @Covers("수정 시 색상을 명시적으로 비우면 색상이 지워진다")
    @DisplayName("수정 시 색상을 명시적으로 비우면 색상이 지워진다")
    void updateWithExplicitNullColorClearsColor() throws Exception {
        // Given
        Category existing = categoryRepository.save(USER_ID, "업무", "#2563EB", "회사 일", 1024);
        String requestBody = """
                {
                  "color": null
                }
                """;

        // When / Then
        mockMvc.perform(patch("/categories/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.color").doesNotExist())
                .andExpect(jsonPath("$.description").value("회사 일"));

        assertThat(categoryRepository.findById(existing.id()))
                .hasValueSatisfying(category -> assertThat(category.color()).isNull());
    }

    @Test
    @Covers("수정 시 설명을 명시적으로 비우면 설명이 지워진다")
    @DisplayName("수정 시 설명을 명시적으로 비우면 설명이 지워진다")
    void updateWithExplicitNullDescriptionClearsDescription() throws Exception {
        // Given
        Category existing = categoryRepository.save(USER_ID, "업무", "#2563EB", "회사 일", 1024);
        String requestBody = """
                {
                  "description": null
                }
                """;

        // When / Then
        mockMvc.perform(patch("/categories/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").doesNotExist())
                .andExpect(jsonPath("$.color").value("#2563EB"));

        assertThat(categoryRepository.findById(existing.id()))
                .hasValueSatisfying(category -> assertThat(category.description()).isNull());
    }

    @Test
    @Covers("수정 시 이름이 비어 있거나 공백만 입력하면 수정이 거절된다")
    @DisplayName("수정 시 이름이 비어 있거나 공백만 입력하면 수정이 거절된다")
    void updateWithBlankNameReturnsBadRequest() throws Exception {
        // Given
        Category existing = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        String requestBody = """
                {
                  "name": "   "
                }
                """;

        // When / Then
        mockMvc.perform(patch("/categories/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("name"));
    }

    @Test
    @Covers("수정 시 이름이 50자를 초과하면 수정이 거절된다")
    @DisplayName("수정 시 이름이 50자를 초과하면 수정이 거절된다")
    void updateWithTooLongNameReturnsBadRequest() throws Exception {
        // Given
        Category existing = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        String longName = "가".repeat(51);
        String requestBody = """
                {
                  "name": "%s"
                }
                """.formatted(longName);

        // When / Then
        mockMvc.perform(patch("/categories/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("name"));
    }

    @Test
    @Covers("수정 시 설명이 500자를 초과하면 수정이 거절된다")
    @DisplayName("수정 시 설명이 500자를 초과하면 수정이 거절된다")
    void updateWithTooLongDescriptionReturnsBadRequest() throws Exception {
        // Given
        Category existing = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        String longDescription = "가".repeat(501);
        String requestBody = """
                {
                  "description": "%s"
                }
                """.formatted(longDescription);

        // When / Then
        mockMvc.perform(patch("/categories/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("description"));
    }

    @Test
    @Covers("수정 시 색상 형식이 잘못되면 수정이 거절된다")
    @DisplayName("수정 시 색상 형식이 잘못되면 수정이 거절된다")
    void updateWithInvalidColorReturnsBadRequest() throws Exception {
        // Given
        Category existing = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        String requestBody = """
                {
                  "color": "blue"
                }
                """;

        // When / Then
        mockMvc.perform(patch("/categories/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("color"));
    }

    @Test
    @Covers("수정 시 같은 사용자 안에서 이미 사용 중인 이름으로 바꾸려 하면 수정이 거절된다")
    @DisplayName("수정 시 같은 사용자 안에서 이미 사용 중인 이름으로 바꾸려 하면 수정이 거절된다")
    void updateWithDuplicateNameReturnsConflict() throws Exception {
        // Given
        Category existing = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        categoryRepository.save(USER_ID, "개인", "#16A34A", null, 2048);
        String requestBody = """
                {
                  "name": "개인"
                }
                """;

        // When / Then
        mockMvc.perform(patch("/categories/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_CATEGORY_NAME"))
                .andExpect(jsonPath("$.details[0].field").value("name"));
    }

    @Test
    @Covers("존재하지 않는 카테고리를 수정하려 하면 거절된다")
    @DisplayName("존재하지 않는 카테고리를 수정하려 하면 거절된다")
    void updateNonExistingCategoryReturnsNotFound() throws Exception {
        // Given
        java.util.UUID missingId = java.util.UUID.fromString("00000000-0000-0000-0000-00000000270f");
        String requestBody = """
                {
                  "name": "없음"
                }
                """;

        // When / Then
        mockMvc.perform(patch("/categories/{id}", missingId)
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CATEGORY_NOT_FOUND"));
    }

    @Test
    @Covers("다른 사용자의 카테고리를 수정하려 하면 거절된다")
    @DisplayName("다른 사용자의 카테고리를 수정하려 하면 거절된다")
    void updateOtherUsersCategoryReturnsNotFound() throws Exception {
        // Given
        Category othersCategory = categoryRepository.save(OTHER_USER_ID, "타인업무", "#FF0000", null, 1024);
        String requestBody = """
                {
                  "name": "탈취 시도"
                }
                """;

        // When / Then
        mockMvc.perform(patch("/categories/{id}", othersCategory.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CATEGORY_NOT_FOUND"));

        assertThat(categoryRepository.findById(othersCategory.id()))
                .hasValueSatisfying(category -> assertThat(category.name()).isEqualTo("타인업무"));
    }
}
