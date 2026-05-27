package com.example.bddworkflow.todo;

import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.domain.Todo;
import com.example.bddworkflow.todo.repository.TodoRepository;

import com.example.bddworkflow.category.repository.CategoryRepository;
import com.example.bddworkflow.harness.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static com.example.bddworkflow.harness.ApiRequestSupport.bearer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ApiAcceptanceTest
@Requirement("REQ-002")
class TodoCreateApiAcceptanceTest {

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
    @DisplayName("사용자가 기본 정보를 채워 새 할 일을 만든다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
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
    @DisplayName("사용자가 입력한 제목의 앞뒤 공백이 다듬어져 저장된다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
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
    @DisplayName("사용자가 빈 제목으로 할 일을 만들려다 거절당한다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.details[0].field").value("title"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("제목이 100자를 초과하면 할 일 생성이 거절된다")
    @DisplayName("사용자가 100자가 넘는 제목으로 할 일을 만들려다 거절당한다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.details[0].field").value("title"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("설명이 1000자를 초과하면 할 일 생성이 거절된다")
    @DisplayName("사용자가 1000자가 넘는 설명으로 할 일을 만들려다 거절당한다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.details[0].field").value("description"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("할 일 생성 시 설명을 입력하지 않으면 설명 없이 저장된다")
    @DisplayName("사용자가 설명을 적지 않고 할 일을 만든다")
    void createWithoutDescriptionStoresNullDescription() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
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
    @Covers("할 일 생성 시 설명을 명시적으로 비우면 설명 없이 저장된다")
    @DisplayName("사용자가 설명을 일부러 비워 할 일을 만든다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::description)
                .isNull();
    }

    @Test
    @Covers("마감일이 날짜 형식이 아니면 할 일 생성이 거절된다")
    @DisplayName("사용자가 잘못된 형식의 마감일로 할 일을 만들려다 거절당한다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.details[0].field").value("dueDate"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("할 일 생성 시 마감일을 입력하지 않으면 마감일 없이 저장된다")
    @DisplayName("사용자가 마감일 없이 할 일을 만든다")
    void createWithoutDueDateStoresNullDueDate() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
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
    @Covers("할 일 생성 시 마감일을 명시적으로 비우면 마감일 없이 저장된다")
    @DisplayName("사용자가 마감일을 일부러 비워 할 일을 만든다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
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
    @DisplayName("사용자가 지난 일정을 정리하려 과거 마감일로 할 일을 만든다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").value("2020-01-15"));
    }

    @Test
    @Covers("우선순위가 HIGH, MEDIUM, LOW 중 하나가 아니면 할 일 생성이 거절된다")
    @DisplayName("사용자가 허용되지 않은 우선순위 값으로 할 일을 만들려다 거절당한다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.details[0].field").value("priority"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @Covers("우선순위를 입력하지 않으면 기본 우선순위 MEDIUM으로 할 일이 생성된다")
    @DisplayName("사용자가 우선순위를 정하지 않으면 기본 우선순위로 저장된다")
    void createWithoutPriorityDefaultsToMedium() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
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
    @Covers("할 일 생성 시 완료 상태는 미완료로 저장된다")
    @DisplayName("사용자가 새로 만든 할 일은 미완료 상태로 시작한다")
    void createInitializesCompletedAsFalse() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
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
    @Covers("할 일 생성 시 카테고리를 선택하지 않으면 미분류 상태로 저장된다")
    @DisplayName("사용자가 카테고리 없이 할 일을 만든다")
    void createWithoutCategoryStoresNullCategoryId() throws Exception {
        // Given
        String requestBody = """
                {
                  "title": "보고서 작성"
                }
                """;

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
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
    @Covers("할 일 생성 시 카테고리를 명시적으로 비우면 미분류 상태로 저장된다")
    @DisplayName("사용자가 카테고리를 일부러 비워 할 일을 만든다")
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
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::categoryId)
                .isNull();
    }

    @Test
    @Covers("할 일 생성 시 본인의 카테고리를 선택하면 해당 카테고리에 묶여 저장된다")
    @DisplayName("사용자가 본인의 카테고리에 묶어 새 할 일을 만든다")
    void createWithOwnCategoryLinksTodo() throws Exception {
        // Given
        java.util.UUID categoryId = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024).id();
        String requestBody = """
                {
                  "title": "보고서 작성",
                  "categoryId": "%s"
                }
                """.formatted(categoryId);

        // When / Then
        mockMvc.perform(post("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category.categoryId").value(categoryId.toString()))
                .andExpect(jsonPath("$.category.name").value("업무"))
                .andExpect(jsonPath("$.category.color").value("#2563EB"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent())
                .singleElement()
                .extracting(Todo::categoryId)
                .isEqualTo(categoryId);
    }

    @Test
    @Covers("할 일 생성 시 본인이 사용할 수 없는 카테고리를 선택하면 거절된다")
    @DisplayName("사용자가 사용할 수 없는 카테고리로 할 일을 만들려다 거절당한다")
    void createWithInvalidCategoryReturnsBadRequest() throws Exception {
        // Given: 다른 사용자가 소유한 카테고리
        java.util.UUID othersCategoryId = categoryRepository.save(OTHER_USER_ID, "타인 카테고리", "#FF0000", null, 1024).id();
        String foreignBody = """
                {
                  "title": "보고서 작성",
                  "categoryId": "%s"
                }
                """.formatted(othersCategoryId);

        // When / Then: 타인 카테고리 ID는 INVALID_CATEGORY
        mockMvc.perform(post("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(foreignBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_CATEGORY"))
                .andExpect(jsonPath("$.details[0].field").value("categoryId"));

        // 존재하지 않는 카테고리 ID도 동일
        java.util.UUID missingCategoryId = java.util.UUID.fromString("00000000-0000-0000-0000-00000000270f");
        String missingBody = """
                {
                  "title": "보고서 작성",
                  "categoryId": "%s"
                }
                """.formatted(missingCategoryId);
        mockMvc.perform(post("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(missingBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_CATEGORY"))
                .andExpect(jsonPath("$.details[0].field").value("categoryId"));

        assertThat(todoRepository.findAllByUserId(USER_ID, org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }
}
