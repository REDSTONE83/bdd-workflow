package com.example.bddworkflow.todo;

import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.domain.Todo;
import com.example.bddworkflow.todo.repository.TodoRepository;

import com.example.bddworkflow.harness.AcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.harness.TestJwt;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-002")
class TodoDeleteApiAcceptanceTest {

    private static final java.util.UUID USER_ID = java.util.UUID.fromString("00000000-0000-0000-0000-000000000064");
    private static final java.util.UUID OTHER_USER_ID = java.util.UUID.fromString("00000000-0000-0000-0000-0000000000c8");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TodoRepository todoRepository;

    @BeforeEach
    void resetRepository() {
        todoRepository.deleteAll();
    }

    @Test
    @Covers("본인의 할 일을 영구 삭제할 수 있다")
    @DisplayName("본인의 할 일을 영구 삭제할 수 있다")
    void deleteOwnTodoSucceeds() throws Exception {
        // Given
        Todo existing = todoRepository.save(USER_ID, "삭제할 할 일", null, null, Priority.MEDIUM, false, null);

        // When / Then
        mockMvc.perform(delete("/todos/{id}", existing.id()).header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwt.signFor(USER_ID)))
                .andExpect(status().isNoContent());

        assertThat(todoRepository.findById(existing.id())).isEmpty();
    }

    @Test
    @Covers("존재하지 않는 할 일을 삭제하려 하면 거절된다")
    @DisplayName("존재하지 않는 할 일을 삭제하려 하면 거절된다")
    void deleteMissingTodoReturnsNotFound() throws Exception {
        // Given: 존재하는 본인 할 일을 seed해, 거절이 다른 할 일을 함께 지우지 않는지 검증한다.
        Todo existing = todoRepository.save(USER_ID, "보존되어야 할 할 일", null, null,
                Priority.MEDIUM, false, null);
        java.util.UUID missingTodoId = java.util.UUID.fromString("00000000-0000-0000-0000-00000000270f");

        mockMvc.perform(delete("/todos/{id}", missingTodoId).header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwt.signFor(USER_ID)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TODO_NOT_FOUND"));

        // 본인의 다른 할 일은 그대로 남아 있어야 한다.
        assertThat(todoRepository.findById(existing.id())).isPresent();
    }

    @Test
    @Covers("다른 사용자의 할 일을 삭제하려 하면 거절된다")
    @DisplayName("다른 사용자의 할 일을 삭제하려 하면 거절된다")
    void deleteOthersTodoReturnsNotFound() throws Exception {
        // Given
        Todo othersTodo = todoRepository.save(OTHER_USER_ID, "타인 할 일", null, null, Priority.MEDIUM, false, null);

        // When / Then
        mockMvc.perform(delete("/todos/{id}", othersTodo.id()).header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwt.signFor(USER_ID)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TODO_NOT_FOUND"));

        // 타인 자원은 영향받지 않는다
        assertThat(todoRepository.findById(othersTodo.id())).isPresent();
    }
}
