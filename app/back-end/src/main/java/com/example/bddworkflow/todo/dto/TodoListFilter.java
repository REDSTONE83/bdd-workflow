package com.example.bddworkflow.todo.dto;

import com.example.bddworkflow.common.Strings;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.exception.TodoValidationException;

import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

@Requirement("REQ-040")
public record TodoListFilter(
        String search,
        Boolean completed,
        Priority priority,
        UUID categoryId,
        Boolean uncategorized,
        LocalDate dueDateFrom,
        LocalDate dueDateTo
) {
    public TodoListFilter {
        search = normalizeSearch(search);
        uncategorized = Boolean.TRUE.equals(uncategorized);
        if (Boolean.TRUE.equals(uncategorized) && categoryId != null) {
            throw new TodoValidationException("categoryId", "카테고리와 미분류 조건은 함께 사용할 수 없습니다.");
        }
        if (dueDateFrom != null && dueDateTo != null && dueDateFrom.isAfter(dueDateTo)) {
            throw new TodoValidationException("dueDateFrom", "마감일 시작일은 종료일보다 늦을 수 없습니다.");
        }
    }

    public static TodoListFilter empty() {
        return new TodoListFilter(null, null, null, null, false, null, null);
    }

    public boolean hasConditions() {
        return search != null
                || completed != null
                || priority != null
                || categoryId != null
                || Boolean.TRUE.equals(uncategorized)
                || dueDateFrom != null
                || dueDateTo != null;
    }

    private static String normalizeSearch(String value) {
        String trimmed = Strings.trimToNull(value);
        return trimmed == null ? null : trimmed.toLowerCase(Locale.ROOT);
    }
}
