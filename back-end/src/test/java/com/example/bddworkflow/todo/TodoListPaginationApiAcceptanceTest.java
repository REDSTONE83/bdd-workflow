package com.example.bddworkflow.todo;

import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.repository.TodoRepository;

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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AcceptanceTest
@SpringBootTest
@AutoConfigureMockMvc
@Requirement("REQ-002")
class TodoListPaginationApiAcceptanceTest {

    private static final String USER_HEADER = "X-Authenticated-User-Id";
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000064");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TodoRepository todoRepository;

    @BeforeEach
    void resetRepositories() {
        todoRepository.deleteAll();
    }

    @Test
    @Covers("본인의 할 일 목록은 한 번에 보는 개수와 묶음 번호 단위로 본다")
    @DisplayName("page=0, size=2 / page=1, size=2 / page=2, size=2 : 페이지별 2건씩 슬라이싱된다")
    void pageAndSizeQueryParametersSliceContent() throws Exception {
        seedSixTodos();

        mockMvc.perform(get("/todos").header(USER_HEADER, USER_ID).param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].title").value("T3"))
                .andExpect(jsonPath("$.content[1].title").value("T1"));

        mockMvc.perform(get("/todos").header(USER_HEADER, USER_ID).param("page", "1").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].title").value("T5"))
                .andExpect(jsonPath("$.content[1].title").value("T4"));

        mockMvc.perform(get("/todos").header(USER_HEADER, USER_ID).param("page", "2").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].title").value("T2"))
                .andExpect(jsonPath("$.content[1].title").value("T6"));
    }

    @Test
    @Covers("할 일 목록을 볼 때 현재 묶음 번호, 한 번에 보는 개수, 전체 할 일 수, 전체 묶음 수를 알 수 있다")
    @DisplayName("할 일 목록을 볼 때 현재 묶음 번호, 한 번에 보는 개수, 전체 할 일 수, 전체 묶음 수를 알 수 있다")
    void pageResponseShapeContainsAllFields() throws Exception {
        seedSixTodos();

        mockMvc.perform(get("/todos").header(USER_HEADER, USER_ID).param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(3));
    }

    @Test
    @Covers("한 번에 보는 개수를 정하지 않으면 기본값 20이 적용된다")
    @DisplayName("size 미지정 시 기본값 20이 적용된다")
    void defaultSizeIsTwenty() throws Exception {
        seedSixTodos();

        mockMvc.perform(get("/todos").header(USER_HEADER, USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content.length()").value(6));
    }

    @Test
    @Covers("한 번에 보는 개수가 100을 초과하면 100으로 제한된다")
    @DisplayName("size=500 요청해도 응답 size는 100으로 잘린다")
    void sizeOverHundredIsCappedToHundred() throws Exception {
        seedSixTodos();

        mockMvc.perform(get("/todos").header(USER_HEADER, USER_ID).param("page", "0").param("size", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));
    }

    @Test
    @Covers("기억하고 있던 묶음이 더 이상 존재하지 않으면 그 묶음에는 할 일이 보이지 않고, 현재 남은 전체 할 일 수와 전체 묶음 수를 알 수 있다")
    @DisplayName("page=3, size=2 : 데이터를 넘는 페이지는 빈 content + 동일한 totals")
    void pageBeyondLastReturnsEmptyContentButKeepsTotals() throws Exception {
        seedSixTodos();

        mockMvc.perform(get("/todos").header(USER_HEADER, USER_ID).param("page", "3").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(3));
    }

    @Test
    @Covers("사용자가 정렬 기준을 직접 정하면 그 정렬이 기본 정렬을 덮어쓴다")
    @DisplayName("sort=title,asc: 기본 정렬 대신 title 오름차순으로 정렬된다")
    void clientSortOverridesDefault() throws Exception {
        seedSixTodos();
        // 기본 정렬은 T3,T1,T5,T4,T2,T6.
        // sort=title,asc는 알파벳/문자열 오름차순이라 T1,T2,T3,T4,T5,T6이 되어야 한다.
        mockMvc.perform(get("/todos").header(USER_HEADER, USER_ID).param("sort", "title,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("T1"))
                .andExpect(jsonPath("$.content[1].title").value("T2"))
                .andExpect(jsonPath("$.content[2].title").value("T3"))
                .andExpect(jsonPath("$.content[3].title").value("T4"))
                .andExpect(jsonPath("$.content[4].title").value("T5"))
                .andExpect(jsonPath("$.content[5].title").value("T6"));
    }

    /**
     * REQ-002 기본 정렬 결과:
     *   미완료 그룹: T3(HIGH) → T1(MEDIUM) → T5(MEDIUM) → T4(LOW)
     *   완료 그룹:   T2(HIGH) → T6(LOW)
     */
    private void seedSixTodos() {
        todoRepository.save(USER_ID, "T1", null, null, Priority.MEDIUM, false, null);
        todoRepository.save(USER_ID, "T2", null, null, Priority.HIGH,   true,  null);
        todoRepository.save(USER_ID, "T3", null, null, Priority.HIGH,   false, null);
        todoRepository.save(USER_ID, "T4", null, null, Priority.LOW,    false, null);
        todoRepository.save(USER_ID, "T5", null, null, Priority.MEDIUM, false, null);
        todoRepository.save(USER_ID, "T6", null, null, Priority.LOW,    true,  null);
    }
}
