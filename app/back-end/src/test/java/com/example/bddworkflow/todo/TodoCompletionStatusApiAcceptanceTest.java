package com.example.bddworkflow.todo;

import com.example.bddworkflow.testsupport.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.domain.Todo;
import com.example.bddworkflow.todo.repository.TodoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static com.example.bddworkflow.testsupport.ApiRequestSupport.bearer;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ApiAcceptanceTest
@Requirement("REQ-027")
class TodoCompletionStatusApiAcceptanceTest {

    private static final java.util.UUID USER_ID = java.util.UUID.fromString("00000000-0000-0000-0000-000000000064");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TodoRepository todoRepository;

    @BeforeEach
    void resetRepositories() {
        todoRepository.deleteAll();
    }

    private Todo seedTodo(boolean completed) {
        return todoRepository.save(USER_ID, "원본 제목", "원본 설명", LocalDate.of(2026, 6, 1),
                Priority.MEDIUM, completed, null);
    }

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
    @Covers("수정 시 완료 상태를 명시적으로 비우려고 하면 수정이 거절된다")
    @DisplayName("수정 시 완료 상태를 명시적으로 비우려고 하면 수정이 거절된다")
    void updateWithExplicitNullCompletedReturnsBadRequest() throws Exception {
        Todo existing = seedTodo(false);

        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\": null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.details[0].field").value("completed"));

        assertTodoUnchanged(existing);
    }

    @Test
    @Covers("수정 시 완료로 표시하면 할 일이 완료 상태로 바뀐다")
    @DisplayName("수정 시 완료로 표시하면 할 일이 완료 상태로 바뀐다")
    void updateCompletedTrueMarksDone() throws Exception {
        Todo existing = seedTodo(false);

        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
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
    @Covers("수정 시 미완료로 되돌리면 할 일이 미완료 상태로 되돌아간다")
    @DisplayName("수정 시 미완료로 되돌리면 할 일이 미완료 상태로 되돌아간다")
    void updateCompletedFalseMarksUndone() throws Exception {
        Todo existing = seedTodo(true);

        mockMvc.perform(patch("/todos/{id}", existing.id())
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(false));

        assertThat(todoRepository.findById(existing.id()))
                .get()
                .extracting(Todo::completed)
                .isEqualTo(false);
    }
}
