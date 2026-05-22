package com.example.bddworkflow.todo;

import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.domain.Todo;
import com.example.bddworkflow.todo.repository.TodoRepository;

import com.example.bddworkflow.category.domain.Category;
import com.example.bddworkflow.category.repository.CategoryRepository;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-002")
class TodoCategoryCascadeApiAcceptanceTest {

    private static final java.util.UUID USER_ID = java.util.UUID.fromString("00000000-0000-0000-0000-000000000064");

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
    @Covers("연결된 카테고리가 삭제되면 본인의 할 일은 유지되고 카테고리 연결만 해제된다")
    @DisplayName("연결된 카테고리가 삭제되면 본인의 할 일은 유지되고 카테고리 연결만 해제된다")
    void deletingLinkedCategoryUnlinksTodoButKeepsTodo() throws Exception {
        // Given: 본인의 카테고리에 연결된 할 일
        Category category = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        Todo todo = todoRepository.save(USER_ID, "분류된 할 일", "내용", null,
                Priority.MEDIUM, false, category.id());

        // When: 카테고리를 삭제한다
        mockMvc.perform(delete("/categories/{id}", category.id()).header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwt.signFor(USER_ID)))
                .andExpect(status().isNoContent());

        // Then: 할 일은 그대로 존재하고, categoryId만 null로 해제된다
        assertThat(todoRepository.findById(todo.id()))
                .as("할 일 자체는 유지되어야 한다")
                .isPresent();
        assertThat(todoRepository.findById(todo.id()))
                .get()
                .extracting(Todo::categoryId)
                .as("카테고리 연결은 해제되어 categoryId가 null이어야 한다")
                .isNull();
        assertThat(todoRepository.findById(todo.id()))
                .get()
                .extracting(Todo::title)
                .as("다른 필드는 유지되어야 한다")
                .isEqualTo("분류된 할 일");
    }
}
