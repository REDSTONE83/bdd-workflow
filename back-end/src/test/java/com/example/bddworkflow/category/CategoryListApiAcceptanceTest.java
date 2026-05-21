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
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-003")
class CategoryListApiAcceptanceTest {

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
    @Covers("본인의 카테고리 목록이 정렬 순서 오름차순, 동률이면 식별자 오름차순으로 조회된다")
    @DisplayName("본인의 카테고리 목록이 정렬 순서 오름차순, 동률이면 식별자 오름차순으로 조회된다")
    void listReturnsOwnCategoriesOrderedByDisplayOrderThenId() throws Exception {
        // Given
        Category third = categoryRepository.save(USER_ID, "기타", "#6B7280", null, 3072);
        Category firstTie = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        Category secondTie = categoryRepository.save(USER_ID, "개인", "#16A34A", null, 1024);
        categoryRepository.save(OTHER_USER_ID, "타인업무", "#FF0000", null, 1024);

        // When / Then
        mockMvc.perform(get("/categories").header(USER_HEADER, USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories.length()").value(3))
                .andExpect(jsonPath("$.categories[0].categoryId").value(firstTie.id()))
                .andExpect(jsonPath("$.categories[0].name").value("업무"))
                .andExpect(jsonPath("$.categories[0].displayOrder").value(1024))
                .andExpect(jsonPath("$.categories[1].categoryId").value(secondTie.id()))
                .andExpect(jsonPath("$.categories[1].name").value("개인"))
                .andExpect(jsonPath("$.categories[1].displayOrder").value(1024))
                .andExpect(jsonPath("$.categories[2].categoryId").value(third.id()))
                .andExpect(jsonPath("$.categories[2].name").value("기타"))
                .andExpect(jsonPath("$.categories[2].displayOrder").value(3072));
    }
}
