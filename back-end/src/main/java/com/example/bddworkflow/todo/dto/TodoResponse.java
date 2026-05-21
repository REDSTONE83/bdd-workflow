package com.example.bddworkflow.todo.dto;

import com.example.bddworkflow.todo.domain.Priority;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.UUID;

@Requirement("REQ-002")
@Schema(description = "할 일 응답. 카테고리 연결이 없으면 category 필드는 null이다.")
public record TodoResponse(
        @Schema(description = "할 일 식별자", example = "01900000-0000-7000-8000-000000000000")
        UUID todoId,

        @Schema(description = "할 일 제목", example = "보고서 작성")
        String title,

        @Schema(description = "할 일 설명", example = "분기 보고서 초안", nullable = true)
        String description,

        @Schema(description = "마감일 (YYYY-MM-DD)", example = "2026-06-01", nullable = true)
        LocalDate dueDate,

        @Schema(description = "우선순위", example = "MEDIUM")
        Priority priority,

        @Schema(description = "완료 여부", example = "false")
        boolean completed,

        @Schema(description = "연결된 카테고리 정보. 연결이 없으면 null이다.", nullable = true)
        TodoCategoryInfo category
) {
}
