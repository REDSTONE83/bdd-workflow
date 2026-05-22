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
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-003")
class CategoryListApiAcceptanceTest {

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
    @Covers("본인의 카테고리는 정해진 정렬 순서대로 보이며, 같은 순서면 먼저 등록한 카테고리가 위로 정렬되어 보인다")
    @DisplayName("본인의 카테고리는 정해진 정렬 순서대로 보이며, 같은 순서면 먼저 등록한 카테고리가 위로 정렬되어 보인다")
    void listReturnsOwnCategoriesOrderedByDisplayOrderThenId() throws Exception {
        // Given
        Category third = categoryRepository.save(USER_ID, "기타", "#6B7280", null, 3072);
        Category firstTie = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        Category secondTie = categoryRepository.save(USER_ID, "개인", "#16A34A", null, 1024);
        categoryRepository.save(OTHER_USER_ID, "타인업무", "#FF0000", null, 1024);

        // When / Then
        mockMvc.perform(get("/categories").header(USER_HEADER, USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.content[0].categoryId").value(firstTie.id().toString()))
                .andExpect(jsonPath("$.content[0].name").value("업무"))
                .andExpect(jsonPath("$.content[0].displayOrder").value(1024))
                .andExpect(jsonPath("$.content[1].categoryId").value(secondTie.id().toString()))
                .andExpect(jsonPath("$.content[1].name").value("개인"))
                .andExpect(jsonPath("$.content[1].displayOrder").value(1024))
                .andExpect(jsonPath("$.content[2].categoryId").value(third.id().toString()))
                .andExpect(jsonPath("$.content[2].name").value("기타"))
                .andExpect(jsonPath("$.content[2].displayOrder").value(3072));
    }

    @Test
    @DisplayName("목록 응답은 PageResponse 엔벨로프(page, size, totalElements, totalPages)를 포함한다")
    void listResponseCarriesPageEnvelope() throws Exception {
        // Given
        categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        categoryRepository.save(USER_ID, "개인", "#16A34A", null, 2048);
        categoryRepository.save(USER_ID, "기타", "#6B7280", null, 3072);

        // When / Then
        mockMvc.perform(get("/categories").header(USER_HEADER, USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").exists())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    @DisplayName("page=0&size=2 요청은 정렬 순서대로 첫 두 항목과 totalElements=3, totalPages=2를 반환한다")
    void listHonorsPageAndSizeForFirstSlice() throws Exception {
        // Given
        Category first = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        Category second = categoryRepository.save(USER_ID, "개인", "#16A34A", null, 2048);
        categoryRepository.save(USER_ID, "기타", "#6B7280", null, 3072);
        categoryRepository.save(OTHER_USER_ID, "타인업무", "#FF0000", null, 1024);

        // When / Then
        mockMvc.perform(get("/categories")
                        .header(USER_HEADER, USER_ID)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].categoryId").value(first.id().toString()))
                .andExpect(jsonPath("$.content[1].categoryId").value(second.id().toString()))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    @DisplayName("page=1&size=2 요청은 두 번째 페이지(남은 1개) 슬라이스를 반환한다")
    void listHonorsPageAndSizeForSecondSlice() throws Exception {
        // Given
        categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        categoryRepository.save(USER_ID, "개인", "#16A34A", null, 2048);
        Category third = categoryRepository.save(USER_ID, "기타", "#6B7280", null, 3072);

        // When / Then
        mockMvc.perform(get("/categories")
                        .header(USER_HEADER, USER_ID)
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].categoryId").value(third.id().toString()))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    @DisplayName("page=2&size=2 요청은 범위를 벗어난 페이지로 빈 content와 동일한 total 메타데이터를 반환한다")
    void listOutOfRangePageReturnsEmptyContent() throws Exception {
        // Given
        categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        categoryRepository.save(USER_ID, "개인", "#16A34A", null, 2048);
        categoryRepository.save(USER_ID, "기타", "#6B7280", null, 3072);

        // When / Then
        mockMvc.perform(get("/categories")
                        .header(USER_HEADER, USER_ID)
                        .param("page", "2")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));
    }
}
