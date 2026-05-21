package com.example.bddworkflow.todo;

import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.domain.Todo;
import com.example.bddworkflow.todo.repository.TodoRepository;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-002")
class TodoCreateApiAcceptanceTest {

    private static final String USER_HEADER = "X-Authenticated-User-Id";
    private static final java.util.UUID USER_ID = java.util.UUID.fromString("00000000-0000-0000-0000-000000000064");
    private static final java.util.UUID OTHER_USER_ID = java.util.UUID.fromString("00000000-0000-0000-0000-0000000000c8");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    void resetRepositories() {
        todoRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    @Covers("유효한 정보이면 할 일이 생성된다")
    @DisplayName("유효한 정보이면 할 일이 생성된다")
    void createWithValidRequestReturnsCreated() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성",
                  "description": "분기 보고서 초안",
                  "dueDate": "2026-06-01",
                  "priority": "HIGH"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.todoId").exists())
                .andExpect(jsonPath("$.title").value("보고서 작성"))
                .andExpect(jsonPath("$.description").value("분기 보고서 초안"))
                .andExpect(jsonPath("$.dueDate").value("2026-06-01"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.completed").value(false));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).hasSize(1);
    }

    @Test
    @Covers("제목은 앞뒤 공백이 제거되어 저장된다")
    @DisplayName("제목은 앞뒤 공백이 제거되어 저장된다")
    void createTrimsLeadingAndTrailingWhitespaceInTitle() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "  보고서 작성  ",
                  "priority": "MEDIUM"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("보고서 작성"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::title)
                .isEqualTo("보고서 작성");
    }

    @Test
    @Covers("제목이 비어 있거나 공백만 입력하면 할 일 생성이 거절된다")
    @DisplayName("제목이 비어 있거나 공백만 입력하면 할 일 생성이 거절된다")
    void createWithBlankTitleReturnsBadRequest() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "   ",
                  "priority": "MEDIUM"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("title"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("제목이 100자를 초과하면 할 일 생성이 거절된다")
    @DisplayName("제목이 100자를 초과하면 할 일 생성이 거절된다")
    void createWithTooLongTitleReturnsBadRequest() throws Exception {
        // Given
        String longTitle = "가".repeat(101);
        String requestBody = """
                {
                  "title": "%s",
                  "priority": "MEDIUM"
                }
                """.formatted(longTitle);

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("title"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("설명이 1000자를 초과하면 할 일 생성이 거절된다")
    @DisplayName("설명이 1000자를 초과하면 할 일 생성이 거절된다")
    void createWithTooLongDescriptionReturnsBadRequest() throws Exception {
        // Given
        String longDescription = "가".repeat(1001);
        String requestBody = """
                {
                  "title": "보고서 작성",
                  "description": "%s"
                }
                """.formatted(longDescription);

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("description"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("할 일 생성 시 설명을 입력하지 않으면 설명 없이 저장된다")
    @DisplayName("할 일 생성 시 설명을 입력하지 않으면 설명 없이 저장된다")
    void createWithoutDescriptionStoresNullDescription() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").doesNotExist());

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::description)
                .isNull();
    }

    @Test
    @Covers("할 일 생성 시 설명에 null을 명시하면 설명 없이 저장된다")
    @DisplayName("할 일 생성 시 설명에 null을 명시하면 설명 없이 저장된다")
    void createWithExplicitNullDescriptionStoresNullDescription() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성",
                  "description": null
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::description)
                .isNull();
    }

    @Test
    @Covers("마감일 형식이 ISO 8601 날짜가 아니면 할 일 생성이 거절된다")
    @DisplayName("마감일 형식이 ISO 8601 날짜가 아니면 할 일 생성이 거절된다")
    void createWithInvalidDueDateFormatReturnsBadRequest() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성",
                  "dueDate": "2026/06/01"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("dueDate"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("할 일 생성 시 마감일을 입력하지 않으면 마감일 없이 저장된다")
    @DisplayName("할 일 생성 시 마감일을 입력하지 않으면 마감일 없이 저장된다")
    void createWithoutDueDateStoresNullDueDate() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").doesNotExist());

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::dueDate)
                .isNull();
    }

    @Test
    @Covers("할 일 생성 시 마감일에 null을 명시하면 마감일 없이 저장된다")
    @DisplayName("할 일 생성 시 마감일에 null을 명시하면 마감일 없이 저장된다")
    void createWithExplicitNullDueDateStoresNullDueDate() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성",
                  "dueDate": null
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::dueDate)
                .isNull();
    }

    @Test
    @Covers("할 일 생성 시 과거 날짜를 마감일로 입력해도 허용된다")
    @DisplayName("할 일 생성 시 과거 날짜를 마감일로 입력해도 허용된다")
    void createWithPastDueDateIsAllowed() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "지난 보고서 정리",
                  "dueDate": "2020-01-15"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").value("2020-01-15"));
    }

    @Test
    @Covers("우선순위가 HIGH, MEDIUM, LOW 중 하나가 아니면 할 일 생성이 거절된다")
    @DisplayName("우선순위가 HIGH, MEDIUM, LOW 중 하나가 아니면 할 일 생성이 거절된다")
    void createWithInvalidPriorityReturnsBadRequest() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성",
                  "priority": "URGENT"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("priority"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("우선순위를 입력하지 않으면 기본 우선순위 MEDIUM으로 할 일이 생성된다")
    @DisplayName("우선순위를 입력하지 않으면 기본 우선순위 MEDIUM으로 할 일이 생성된다")
    void createWithoutPriorityDefaultsToMedium() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.priority").value("MEDIUM"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::priority)
                .isEqualTo(Priority.MEDIUM);
    }

    @Test
    @Covers("할 일 생성 시 완료 상태는 미완료(`completed=false`)로 저장된다")
    @DisplayName("할 일 생성 시 완료 상태는 미완료(`completed=false`)로 저장된다")
    void createInitializesCompletedAsFalse() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.completed").value(false));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::completed)
                .isEqualTo(false);
    }

    @Test
    @Covers("할 일 생성 시 카테고리 ID를 입력하지 않으면 미분류 상태로 저장된다")
    @DisplayName("할 일 생성 시 카테고리 ID를 입력하지 않으면 미분류 상태로 저장된다")
    void createWithoutCategoryStoresNullCategoryId() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value(org.hamcrest.Matchers.nullValue()));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::categoryId)
                .isNull();
    }

    @Test
    @Covers("할 일 생성 시 카테고리 ID에 null을 명시하면 미분류 상태로 저장된다")
    @DisplayName("할 일 생성 시 카테고리 ID에 null을 명시하면 미분류 상태로 저장된다")
    void createWithExplicitNullCategoryStoresNullCategoryId() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성",
                  "categoryId": null
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::categoryId)
                .isNull();
    }

    @Test
    @Covers("할 일 생성 시 본인의 카테고리 ID를 명시하면 해당 카테고리에 연결되어 저장된다")
    @DisplayName("할 일 생성 시 본인의 카테고리 ID를 명시하면 해당 카테고리에 연결되어 저장된다")
    void createWithOwnCategoryLinksTodo() throws Exception {
        // Given
        java.util.UUID categoryId = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024).id();
        String requestBody = """
                {
                  "title": "보고서 작성",
                  "categoryId": %d
                }
                """.formatted(categoryId);

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category.categoryId").value(categoryId))
                .andExpect(jsonPath("$.category.name").value("업무"))
                .andExpect(jsonPath("$.category.color").value("#2563EB"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::categoryId)
                .isEqualTo(categoryId);
    }

    @Test
    @Covers("할 일 생성 시 존재하지 않거나 다른 사용자의 카테고리 ID를 명시하면 거절된다")
    @DisplayName("할 일 생성 시 존재하지 않거나 다른 사용자의 카테고리 ID를 명시하면 거절된다")
    void createWithInvalidCategoryReturnsBadRequest() throws Exception {
        // Given: 다른 사용자가 소유한 카테고리
        java.util.UUID othersCategoryId = categoryRepository.save(OTHER_USER_ID, "타인 카테고리", "#FF0000", null, 1024).id();
        String foreignBody = """
                {
                  "title": "보고서 작성",
                  "categoryId": %d
                }
                """.formatted(othersCategoryId);

        // When / Then: 타인 카테고리 ID는 INVALID_CATEGORY
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(foreignBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_CATEGORY"))
                .andExpect(jsonPath("$.details[0].field").value("categoryId"));

        // 존재하지 않는 카테고리 ID도 동일
        String missingBody = """
                {
                  "title": "보고서 작성",
                  "categoryId": 9999
                }
                """;
        mockMvc.perform(post("/todos")
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(missingBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_CATEGORY"))
                .andExpect(jsonPath("$.details[0].field").value("categoryId"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }
}
