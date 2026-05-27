package com.example.bddworkflow.category;

import com.example.bddworkflow.category.domain.Category;
import com.example.bddworkflow.category.repository.CategoryRepository;

import com.example.bddworkflow.harness.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static com.example.bddworkflow.harness.ApiRequestSupport.bearer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ApiAcceptanceTest
@Requirement("REQ-003")
class CategoryDeleteApiAcceptanceTest {

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
    @Covers("본인의 카테고리를 영구 삭제할 수 있다")
    @DisplayName("본인의 카테고리를 영구 삭제할 수 있다")
    void deleteOwnCategoryRemovesItPermanently() throws Exception {
        // Given
        Category existing = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);

        // When / Then
        mockMvc.perform(delete("/categories/{id}", existing.id())
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
                .andExpect(status().isNoContent());

        assertThat(categoryRepository.findById(existing.id())).isEmpty();
    }

    @Test
    @Covers("존재하지 않는 카테고리를 삭제하려 하면 거절된다")
    @DisplayName("존재하지 않는 카테고리를 삭제하려 하면 거절된다")
    void deleteNonExistingCategoryReturnsNotFound() throws Exception {
        // Given
        java.util.UUID missingId = java.util.UUID.fromString("00000000-0000-0000-0000-00000000270f");

        // When / Then
        mockMvc.perform(delete("/categories/{id}", missingId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CATEGORY_NOT_FOUND"));
    }

    @Test
    @Covers("다른 사용자의 카테고리를 삭제하려 하면 거절된다")
    @DisplayName("다른 사용자의 카테고리를 삭제하려 하면 거절된다")
    void deleteOtherUsersCategoryReturnsNotFound() throws Exception {
        // Given
        Category othersCategory = categoryRepository.save(OTHER_USER_ID, "타인업무", "#FF0000", null, 1024);

        // When / Then
        mockMvc.perform(delete("/categories/{id}", othersCategory.id())
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CATEGORY_NOT_FOUND"));

        assertThat(categoryRepository.findById(othersCategory.id())).isPresent();
    }
}
