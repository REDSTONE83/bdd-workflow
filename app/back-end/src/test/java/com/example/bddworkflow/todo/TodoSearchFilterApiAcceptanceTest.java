package com.example.bddworkflow.todo;

import com.example.bddworkflow.category.domain.Category;
import com.example.bddworkflow.category.repository.CategoryRepository;
import com.example.bddworkflow.harness.Covers;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.testsupport.ApiAcceptanceTest;
import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.repository.TodoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static com.example.bddworkflow.testsupport.ApiRequestSupport.bearer;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ApiAcceptanceTest
@Requirement({"REQ-040", "REQ-004"})
class TodoSearchFilterApiAcceptanceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000064");
    private static final UUID OTHER_USER_ID = UUID.fromString("00000000-0000-0000-0000-0000000000c8");

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
            "검색어를 입력하면 제목이나 설명에 검색어가 포함된 본인의 할 일만 보인다",
            "보호 API는 인증된 사용자의 자원만 생성, 조회, 수정, 삭제한다"
    })
    @DisplayName("검색어는 제목과 설명에 적용되고 다른 사용자의 일치 항목은 제외된다")
    void searchMatchesOwnTitleOrDescriptionOnly() throws Exception {
        todoRepository.save(USER_ID, "분기 보고서", "경영 지표 정리", null, Priority.HIGH, false, null);
        todoRepository.save(USER_ID, "회의 준비", "보고서 공유 안건", null, Priority.MEDIUM, false, null);
        todoRepository.save(USER_ID, "운동 예약", "헬스장 방문", null, Priority.LOW, false, null);
        todoRepository.save(OTHER_USER_ID, "분기 보고서 유출", null, null, Priority.HIGH, false, null);

        mockMvc.perform(get("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .param("search", " 보고서 "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[*].title",
                        containsInAnyOrder("분기 보고서", "회의 준비")));
    }

    @Test
    @Covers("완료 상태, 우선순위, 카테고리 또는 미분류, 마감일 범위를 조합하면 모든 조건을 만족하는 본인의 할 일만 보인다")
    @DisplayName("완료 상태, 우선순위, 카테고리, 마감일 범위를 모두 만족하는 할 일만 조회된다")
    void filtersByCompletedPriorityCategoryAndDueDateRange() throws Exception {
        Category work = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        Category personal = categoryRepository.save(USER_ID, "개인", "#16A34A", null, 2048);

        todoRepository.save(USER_ID, "월간 보고서", null, LocalDate.parse("2026-06-10"),
                Priority.HIGH, false, work.id());
        todoRepository.save(USER_ID, "완료된 보고서", null, LocalDate.parse("2026-06-10"),
                Priority.HIGH, true, work.id());
        todoRepository.save(USER_ID, "낮은 우선순위 보고서", null, LocalDate.parse("2026-06-10"),
                Priority.LOW, false, work.id());
        todoRepository.save(USER_ID, "개인 보고서", null, LocalDate.parse("2026-06-10"),
                Priority.HIGH, false, personal.id());
        todoRepository.save(USER_ID, "기간 밖 보고서", null, LocalDate.parse("2026-07-01"),
                Priority.HIGH, false, work.id());
        todoRepository.save(USER_ID, "마감일 없는 보고서", null, null,
                Priority.HIGH, false, work.id());
        todoRepository.save(OTHER_USER_ID, "타인 월간 보고서", null, LocalDate.parse("2026-06-10"),
                Priority.HIGH, false, work.id());

        mockMvc.perform(get("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .param("completed", "false")
                        .param("priority", "HIGH")
                        .param("categoryId", work.id().toString())
                        .param("dueDateFrom", "2026-06-01")
                        .param("dueDateTo", "2026-06-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("월간 보고서"));
    }

    @Test
    @Covers("완료 상태, 우선순위, 카테고리 또는 미분류, 마감일 범위를 조합하면 모든 조건을 만족하는 본인의 할 일만 보인다")
    @DisplayName("미분류 조건을 적용하면 카테고리 없는 할 일만 조회된다")
    void filtersUncategorizedTodos() throws Exception {
        Category work = categoryRepository.save(USER_ID, "업무", "#2563EB", null, 1024);
        todoRepository.save(USER_ID, "분류된 할 일", null, null, Priority.MEDIUM, false, work.id());
        todoRepository.save(USER_ID, "미분류 할 일", null, null, Priority.MEDIUM, false, null);

        mockMvc.perform(get("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .param("uncategorized", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("미분류 할 일"));
    }

    @Test
    @Covers("검색/필터 결과에도 기존 할 일 목록의 묶음 보기와 정렬 기준이 적용된다")
    @DisplayName("검색 결과는 사용자가 지정한 정렬과 page/size 기준으로 잘린다")
    void filteredResultsKeepPaginationAndClientSort() throws Exception {
        todoRepository.save(USER_ID, "정리 C", null, null, Priority.MEDIUM, false, null);
        todoRepository.save(USER_ID, "정리 A", null, null, Priority.MEDIUM, false, null);
        todoRepository.save(USER_ID, "정리 B", null, null, Priority.MEDIUM, false, null);
        todoRepository.save(USER_ID, "무관한 할 일", null, null, Priority.MEDIUM, false, null);

        mockMvc.perform(get("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .param("search", "정리")
                        .param("sort", "title,asc")
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", contains("정리 A", "정리 B")))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    @Covers("마감일 범위 시작일이 종료일보다 늦으면 목록 조회가 거절된다")
    @DisplayName("마감일 시작일이 종료일보다 늦으면 400 INVALID_REQUEST 로 거절된다")
    void dueDateRangeStartAfterEndReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/todos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(USER_ID))
                        .param("dueDateFrom", "2026-06-30")
                        .param("dueDateTo", "2026-06-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.details[0].field").value("dueDateFrom"));
    }
}
