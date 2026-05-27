package com.example.bddworkflow.todo.dto;

import com.example.bddworkflow.common.Strings;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.todo.domain.Priority;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

@Requirement("REQ-002")
@Schema(description = "할 일 생성 요청. 제목은 trim된 뒤 검증되고 저장된다. completed 필드는 받지 않으며 항상 false로 시작한다.")
public record CreateTodoRequest(
        @NotBlank
        @Size(max = 100)
        @Schema(description = "할 일 제목 (trim 후 1자 이상 100자 이하)", example = "보고서 작성")
        String title,

        @Size(max = 1000)
        @Schema(description = "할 일 설명 (최대 1000자)", example = "분기 보고서 초안", nullable = true)
        String description,

        @Schema(description = "마감일 (YYYY-MM-DD)", example = "2026-06-01", nullable = true)
        LocalDate dueDate,

        @Schema(description = "우선순위 (HIGH/MEDIUM/LOW, 미입력 시 MEDIUM)", example = "MEDIUM", nullable = true)
        Priority priority,

        @Schema(description = "본인 소유 카테고리 ID (미입력 또는 null이면 미분류)",
                example = "01900000-0000-7000-8000-000000000000", nullable = true)
        UUID categoryId
) {
    public CreateTodoRequest {
        title = Strings.trimToNull(title);
        description = Strings.trimToNull(description);
    }
}
