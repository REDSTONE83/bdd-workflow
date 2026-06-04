package com.example.bddworkflow.todo;

import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.repository.TodoRepository;

import com.example.bddworkflow.category.domain.Category;
import com.example.bddworkflow.category.repository.CategoryRepository;
import com.example.bddworkflow.testsupport.ApiAcceptanceTest;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static com.example.bddworkflow.testsupport.ApiRequestSupport.bearer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ApiAcceptanceTest
@Requirement({"REQ-023", "REQ-004"})
class TodoListApiAcceptanceTest {

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
    @Covers({
            "본인의 할 일 목록만 조회된다",
            "보호 API는 인증된 사용자의 자원만 생성, 조회, 수정, 삭제한다"
    })
    @DisplayName("본인의 할 일 목록만 조회된다 (인증된 사용자의 자원만 응답)")
    void listReturnsOnlyOwnTodos() throws Exception {
        // Given
        todoRepository.save(USER_ID, "내 할 일 A", null, null, Priority.MEDIUM, false, null);
        todoRepository.save(USER_ID, "내 할 일 B", null, null, Priority.LOW, false, null);
        todoRepository.save(OTHER_USER_ID, "타인의 할 일", null, null, Priority.HIGH, false, null);

        // When / Then
        mockMvc.perform(get("/todos").header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[*].title", org.hamcrest.Matchers.containsInAnyOrder("내 할 일 A", "내 할 일 B")));
    }

    @Test
    @Covers("정렬 기준을 따로 정하지 않으면 본인의 할 일 목록은 미완료 할 일이 먼저, 같은 상태 안에서는 우선순위 HIGH, MEDIUM, LOW 순서, 같은 우선순위면 먼저 등록한 할 일이 위로 정렬되어 보인다")
    @DisplayName("정렬 기준을 따로 정하지 않으면 본인의 할 일 목록은 미완료 할 일이 먼저, 같은 상태 안에서는 우선순위 HIGH, MEDIUM, LOW 순서, 같은 우선순위면 먼저 등록한 할 일이 위로 정렬되어 보인다")
    void listSortsByCompletedThenPriorityThenId() throws Exception {
        // Given: 입력 순서를 의도적으로 섞어둔다
        //   id=1: completed=false, MEDIUM
        //   id=2: completed=true,  HIGH
        //   id=3: completed=false, HIGH
        //   id=4: completed=false, LOW
        //   id=5: completed=false, MEDIUM    (id 동률 분리용)
        //   id=6: completed=true,  LOW
        todoRepository.save(USER_ID, "T1", null, null, Priority.MEDIUM, false, null);
        todoRepository.save(USER_ID, "T2", null, null, Priority.HIGH,   true,  null);
        todoRepository.save(USER_ID, "T3", null, null, Priority.HIGH,   false, null);
        todoRepository.save(USER_ID, "T4", null, null, Priority.LOW,    false, null);
        todoRepository.save(USER_ID, "T5", null, null, Priority.MEDIUM, false, null);
        todoRepository.save(USER_ID, "T6", null, null, Priority.LOW,    true,  null);

        // 기대 순서:
        //   미완료 그룹: T3(HIGH), T1(MEDIUM, id1<id5), T5(MEDIUM), T4(LOW)
        //   완료 그룹:   T2(HIGH), T6(LOW)
        mockMvc.perform(get("/todos").header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("T3"))
                .andExpect(jsonPath("$.content[1].title").value("T1"))
                .andExpect(jsonPath("$.content[2].title").value("T5"))
                .andExpect(jsonPath("$.content[3].title").value("T4"))
                .andExpect(jsonPath("$.content[4].title").value("T2"))
                .andExpect(jsonPath("$.content[5].title").value("T6"));
    }

    @Test
    @Covers("할 일 목록에서 연결된 카테고리의 이름과 색상이 함께 보이며, 연결이 없으면 미분류로 보인다")
    @DisplayName("할 일 목록에서 연결된 카테고리의 이름과 색상이 함께 보이며, 연결이 없으면 미분류로 보인다")
    void listIncludesNestedCategoryInfo() throws Exception {
        // Given
        Category category = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        todoRepository.save(USER_ID, "분류된 할 일", null, null, Priority.MEDIUM, false, category.id());
        todoRepository.save(USER_ID, "미분류 할 일", null, null, Priority.MEDIUM, false, null);

        // When / Then
        mockMvc.perform(get("/todos").header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                // 분류된 항목
                .andExpect(jsonPath("$.content[?(@.title=='분류된 할 일')].category.categoryId").value(category.id().toString()))
                .andExpect(jsonPath("$.content[?(@.title=='분류된 할 일')].category.name").value("업무"))
                .andExpect(jsonPath("$.content[?(@.title=='분류된 할 일')].category.color").value("#2563EB"))
                // 미분류 항목: category는 명시적 null로 직렬화되어야 한다
                .andExpect(jsonPath("$.content[?(@.title=='미분류 할 일')].category")
                        .value(org.hamcrest.Matchers.contains(org.hamcrest.Matchers.nullValue())));
    }
}
