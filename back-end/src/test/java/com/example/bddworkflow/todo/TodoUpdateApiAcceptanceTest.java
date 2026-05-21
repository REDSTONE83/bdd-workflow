package com.example.bddworkflow.todo;

import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.domain.Todo;
import com.example.bddworkflow.todo.repository.TodoRepository;

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

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-002")
class TodoUpdateApiAcceptanceTest {

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

    private Todo seedTodo() {
        return todoRepository.save(USER_ID, "원본 제목", "원본 설명", LocalDate.of(2026, 6, 1),
                Priority.MEDIUM, false, null);
    }

    /**
     * 거절 케이스의 false GREEN 방지용. 모든 비즈니스 필드가 seed 시점 그대로인지 확인한다.
     */
    private void assertTodoUnchanged(Todo original) {
        Todo current = todoRepository.findById(original.id()).orElseThrow();
        assertThat(current.title()).isEqualTo(original.title());
        assertThat(current.description()).isEqualTo(original.description());
        assertThat(current.dueDate()).isEqualTo(original.dueDate());
        assertThat(current.priority()).isEqualTo(original.priority());
        assertThat(current.completed()).isEqualTo(original.completed());
        assertThat(current.categoryId()).isEqualTo(original.categoryId());
    }

    @Test
    @Covers("수정 요청에 포함된 필드만 변경되고 누락된 필드는 기존 값을 유지한다")
    @DisplayName("수정 요청에 포함된 필드만 변경되고 누락된 필드는 기존 값을 유지한다")
    void updateKeepsMissingFields() throws Exception {
        // Given: completed=true와 카테고리 연결이 있는 Todo를 seed해, PATCH 도중 누락된
        // completed / categoryId가 초기화되는 회귀를 잡을 수 있게 한다.
        Category category = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        Todo existing = todoRepository.save(USER_ID, "원본 제목", "원본 설명",
                LocalDate.of(2026, 6, 1), Priority.HIGH, true, category.id());
        String requestBody = """
                {
                  "title": "수정된 제목"
                }
                """;

        // When / Then: 응답에 title만 바뀌고 나머지는 유지된다.
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정된 제목"))
                .andExpect(jsonPath("$.description").value("원본 설명"))
                .andExpect(jsonPath("$.dueDate").value("2026-06-01"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.category.categoryId").value(category.id().toString()));

        // 저장소 상태도 동일하게 유지된다 (title 외 모든 필드).
        Todo stored = todoRepository.findById(existing.id()).orElseThrow();
        assertThat(stored.title()).isEqualTo("수정된 제목");
        assertThat(stored.description()).isEqualTo("원본 설명");
        assertThat(stored.dueDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(stored.priority()).isEqualTo(Priority.HIGH);
        assertThat(stored.completed()).isTrue();
        assertThat(stored.categoryId()).isEqualTo(category.id());
    }

    @Test
    @Covers("수정 요청에서 설명에 null을 명시하면 설명이 비워진다")
    @DisplayName("수정 요청에서 설명에 null을 명시하면 설명이 비워진다")
    void updateWithExplicitNullDescriptionClears() throws Exception {
        // Given
        Todo existing = seedTodo();
        String requestBody = """
                {
                  "description": null
                }
                """;

        // When / Then
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        assertThat(todoRepository.findById(existing.id()))
                .get()
                .extracting(Todo::description)
                .isNull();
    }

    @Test
    @Covers("수정 요청에서 마감일에 null을 명시하면 마감일이 비워진다")
    @DisplayName("수정 요청에서 마감일에 null을 명시하면 마감일이 비워진다")
    void updateWithExplicitNullDueDateClears() throws Exception {
        // Given
        Todo existing = seedTodo();
        String requestBody = """
                {
                  "dueDate": null
                }
                """;

        // When / Then
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        assertThat(todoRepository.findById(existing.id()))
                .get()
                .extracting(Todo::dueDate)
                .isNull();
    }

    @Test
    @Covers("수정 요청에서 카테고리 ID에 null을 명시하면 카테고리 연결이 해제된다")
    @DisplayName("수정 요청에서 카테고리 ID에 null을 명시하면 카테고리 연결이 해제된다")
    void updateWithExplicitNullCategoryUnlinks() throws Exception {
        // Given
        Category category = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        Todo existing = todoRepository.save(USER_ID, "분류 할 일", null, null, Priority.MEDIUM, false, category.id());
        String requestBody = """
                {
                  "categoryId": null
                }
                """;

        // When / Then
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        assertThat(todoRepository.findById(existing.id()))
                .get()
                .extracting(Todo::categoryId)
                .isNull();
    }

    @Test
    @Covers("수정 요청에서 제목에 null을 명시하면 수정이 거절된다")
    @DisplayName("수정 요청에서 제목에 null을 명시하면 수정이 거절된다")
    void updateWithExplicitNullTitleReturnsBadRequest() throws Exception {
        Todo existing = seedTodo();
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("title"));
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 요청에서 우선순위에 null을 명시하면 수정이 거절된다")
    @DisplayName("수정 요청에서 우선순위에 null을 명시하면 수정이 거절된다")
    void updateWithExplicitNullPriorityReturnsBadRequest() throws Exception {
        Todo existing = seedTodo();
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"priority\": null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("priority"));
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 요청에서 completed에 null을 명시하면 수정이 거절된다")
    @DisplayName("수정 요청에서 completed에 null을 명시하면 수정이 거절된다")
    void updateWithExplicitNullCompletedReturnsBadRequest() throws Exception {
        Todo existing = seedTodo();
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\": null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("completed"));
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 요청에서 제목 앞뒤 공백은 제거되어 저장된다")
    @DisplayName("수정 요청에서 제목 앞뒤 공백은 제거되어 저장된다")
    void updateTrimsTitle() throws Exception {
        Todo existing = seedTodo();
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"  새 제목  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("새 제목"));

        assertThat(todoRepository.findById(existing.id()))
                .get()
                .extracting(Todo::title)
                .isEqualTo("새 제목");
    }

    @Test
    @Covers("수정 시 제목이 비어 있거나 공백만 입력하면 수정이 거절된다")
    @DisplayName("수정 시 제목이 비어 있거나 공백만 입력하면 수정이 거절된다")
    void updateWithBlankTitleReturnsBadRequest() throws Exception {
        Todo existing = seedTodo();
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("title"));
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 시 제목이 100자를 초과하면 수정이 거절된다")
    @DisplayName("수정 시 제목이 100자를 초과하면 수정이 거절된다")
    void updateWithTooLongTitleReturnsBadRequest() throws Exception {
        Todo existing = seedTodo();
        String longTitle = "가".repeat(101);
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"" + longTitle + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("title"));
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 시 설명이 1000자를 초과하면 수정이 거절된다")
    @DisplayName("수정 시 설명이 1000자를 초과하면 수정이 거절된다")
    void updateWithTooLongDescriptionReturnsBadRequest() throws Exception {
        Todo existing = seedTodo();
        String longDesc = "가".repeat(1001);
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\": \"" + longDesc + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("description"));
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 시 마감일 형식이 ISO 8601 날짜가 아니면 수정이 거절된다")
    @DisplayName("수정 시 마감일 형식이 ISO 8601 날짜가 아니면 수정이 거절된다")
    void updateWithInvalidDueDateFormatReturnsBadRequest() throws Exception {
        Todo existing = seedTodo();
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dueDate\": \"2026/06/01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("dueDate"));
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 시 우선순위가 HIGH, MEDIUM, LOW 중 하나가 아니면 수정이 거절된다")
    @DisplayName("수정 시 우선순위가 HIGH, MEDIUM, LOW 중 하나가 아니면 수정이 거절된다")
    void updateWithInvalidPriorityReturnsBadRequest() throws Exception {
        Todo existing = seedTodo();
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"priority\": \"URGENT\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details[0].field").value("priority"));
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 시 본인의 카테고리 ID를 명시하면 해당 카테고리로 연결이 변경된다")
    @DisplayName("수정 시 본인의 카테고리 ID를 명시하면 해당 카테고리로 연결이 변경된다")
    void updateWithOwnCategoryChangesLink() throws Exception {
        // Given
        Category before = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        Category after = categoryRepository.save(USER_ID, "개인", "#16A34A", null, 2048);
        Todo existing = todoRepository.save(USER_ID, "할 일", null, null, Priority.MEDIUM, false, before.id());

        // When / Then
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\": \"" + after.id() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category.categoryId").value(after.id().toString()))
                .andExpect(jsonPath("$.category.name").value("개인"));

        assertThat(todoRepository.findById(existing.id()))
                .get()
                .extracting(Todo::categoryId)
                .isEqualTo(after.id());
    }

    @Test
    @Covers("수정 시 존재하지 않거나 다른 사용자의 카테고리 ID를 명시하면 거절된다")
    @DisplayName("수정 시 존재하지 않거나 다른 사용자의 카테고리 ID를 명시하면 거절된다")
    void updateWithInvalidCategoryReturnsBadRequest() throws Exception {
        // Given
        Todo existing = seedTodo();
        java.util.UUID othersCategoryId = categoryRepository.save(OTHER_USER_ID, "타인 카테고리", "#FF0000", null, 1024).id();

        // 타인 소유
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\": \"" + othersCategoryId + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_CATEGORY"))
                .andExpect(jsonPath("$.details[0].field").value("categoryId"));
        assertTodoUnchanged(existing);

        // 부재
        java.util.UUID missingCategoryId = java.util.UUID.fromString("00000000-0000-0000-0000-00000000270f");
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\": \"" + missingCategoryId + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_CATEGORY"))
                .andExpect(jsonPath("$.details[0].field").value("categoryId"));
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 시 completed에 true를 명시하면 할 일이 완료 상태로 바뀐다")
    @DisplayName("수정 시 completed에 true를 명시하면 할 일이 완료 상태로 바뀐다")
    void updateCompletedTrueMarksDone() throws Exception {
        Todo existing = seedTodo();
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true));

        assertThat(todoRepository.findById(existing.id()))
                .get()
                .extracting(Todo::completed)
                .isEqualTo(true);
    }

    @Test
    @Covers("수정 시 completed에 false를 명시하면 할 일이 미완료 상태로 되돌아간다")
    @DisplayName("수정 시 completed에 false를 명시하면 할 일이 미완료 상태로 되돌아간다")
    void updateCompletedFalseMarksUndone() throws Exception {
        // Given: 이미 완료된 할 일
        Todo existing = todoRepository.save(USER_ID, "이미 완료", null, null, Priority.MEDIUM, true, null);

        // When / Then
        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(false));

        assertThat(todoRepository.findById(existing.id()))
                .get()
                .extracting(Todo::completed)
                .isEqualTo(false);
    }

    @Test
    @Covers("존재하지 않는 할 일을 수정하려 하면 거절된다")
    @DisplayName("존재하지 않는 할 일을 수정하려 하면 거절된다")
    void updateMissingTodoReturnsNotFound() throws Exception {
        // Given: 존재하는 본인 할 일을 seed해, 거절이 다른 할 일에 부수효과를 만들지 않는지 함께 검증한다.
        Todo existing = seedTodo();
        java.util.UUID missingTodoId = java.util.UUID.fromString("00000000-0000-0000-0000-00000000270f");

        mockMvc.perform(patch("/todos/{id}", missingTodoId)
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"새 제목\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TODO_NOT_FOUND"));

        // 기존 본인 할 일은 그대로 유지된다.
        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("다른 사용자의 할 일을 수정하려 하면 거절된다")
    @DisplayName("다른 사용자의 할 일을 수정하려 하면 거절된다")
    void updateOthersTodoReturnsNotFound() throws Exception {
        Todo othersTodo = todoRepository.save(OTHER_USER_ID, "타인 할 일", null, null, Priority.MEDIUM, false, null);

        mockMvc.perform(patch("/todos/{id}", othersTodo.id())
                        .header(USER_HEADER, USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"새 제목\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TODO_NOT_FOUND"));

        // 타인 자원은 영향받지 않는다 (존재 노출 방지 + 부수효과 차단)
        assertTodoUnchanged(othersTodo);
    }
}
