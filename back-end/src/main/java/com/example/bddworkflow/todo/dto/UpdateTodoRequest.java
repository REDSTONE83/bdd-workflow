package com.example.bddworkflow.todo.dto;

import com.example.bddworkflow.todo.domain.Priority;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.openapitools.jackson.nullable.JsonNullable;

import java.time.LocalDate;
import java.util.UUID;

@Requirement("REQ-002")
@Schema(description = """
        할 일 수정 요청 (부분 수정).

        - 누락된 필드는 변경되지 않는다.
        - description / dueDate / categoryId 는 명시적 null로 비울 수 있다.
        - title / priority / completed 는 명시적 null을 허용하지 않으며 보낼 경우 400 VALIDATION_FAILED.
        - completed는 true/false로 완료 토글에 사용된다.
        """)
public class UpdateTodoRequest {

    @Schema(description = "할 일 제목", example = "보고서 작성", nullable = true)
    private JsonNullable<@NotBlank @Size(max = 100) String> title = JsonNullable.undefined();

    @Schema(description = "할 일 설명", example = "분기 보고서 초안", nullable = true)
    private JsonNullable<@Size(max = 1000) String> description = JsonNullable.undefined();

    @Schema(description = "마감일 (YYYY-MM-DD)", example = "2026-06-01", nullable = true)
    private JsonNullable<LocalDate> dueDate = JsonNullable.undefined();

    @Schema(description = "우선순위", example = "HIGH", nullable = true)
    private JsonNullable<@NotNull Priority> priority = JsonNullable.undefined();

    @Schema(description = "완료 여부", example = "true", nullable = true)
    private JsonNullable<@NotNull Boolean> completed = JsonNullable.undefined();

    @Schema(description = "본인 소유 카테고리 ID. null이면 연결 해제.",
            example = "01900000-0000-7000-8000-000000000000", nullable = true)
    private JsonNullable<UUID> categoryId = JsonNullable.undefined();

    public JsonNullable<String> title() { return title; }
    public JsonNullable<String> description() { return description; }
    public JsonNullable<LocalDate> dueDate() { return dueDate; }
    public JsonNullable<Priority> priority() { return priority; }
    public JsonNullable<Boolean> completed() { return completed; }
    public JsonNullable<UUID> categoryId() { return categoryId; }

    public void setTitle(JsonNullable<String> title) {
        if (!title.isPresent()) {
            this.title = title;
            return;
        }
        String v = title.get();
        this.title = JsonNullable.of(v == null ? null : v.trim());
    }
    public void setDescription(JsonNullable<String> description) { this.description = description; }
    public void setDueDate(JsonNullable<LocalDate> dueDate) { this.dueDate = dueDate; }
    public void setPriority(JsonNullable<Priority> priority) { this.priority = priority; }
    public void setCompleted(JsonNullable<Boolean> completed) { this.completed = completed; }
    public void setCategoryId(JsonNullable<UUID> categoryId) { this.categoryId = categoryId; }
}
