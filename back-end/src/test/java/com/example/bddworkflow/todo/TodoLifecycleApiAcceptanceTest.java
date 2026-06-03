package com.example.bddworkflow.todo;

import com.example.bddworkflow.harness.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.todo.repository.TodoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static com.example.bddworkflow.harness.ApiRequestSupport.bearer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ApiAcceptanceTest
@Requirement("REQ-021")
class TodoLifecycleApiAcceptanceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000064");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TodoRepository todoRepository;

    @BeforeEach
    void resetRepository() {
        todoRepository.deleteAll();
    }

    @Test
    @Covers("로그인 사용자는 API로 자신의 할 일을 생성하고 목록에서 확인한 뒤 수정하고 삭제할 수 있다")
    @DisplayName("로그인 사용자가 할 일을 만들고 확인하고 수정한 뒤 삭제한다")
    void authenticatedUserCanCreateListUpdateAndDeleteOwnTodo() throws Exception {
        String createResponse = mockMvc.perform(post("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "보고서 작성",
                                  "priority": "HIGH"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("보고서 작성"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode created = objectMapper.readTree(createResponse);
        String todoId = created.path("todoId").asText();

        mockMvc.perform(get("/todos").header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].todoId").value(todoId))
                .andExpect(jsonPath("$.content[0].title").value("보고서 작성"));

        mockMvc.perform(patch("/todos/{id}", todoId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "보고서 최종본",
                                  "completed": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("보고서 최종본"))
                .andExpect(jsonPath("$.completed").value(true));

        mockMvc.perform(delete("/todos/{id}", todoId).header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/todos").header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }
}
