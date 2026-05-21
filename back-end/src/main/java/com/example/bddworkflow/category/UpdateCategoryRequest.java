package com.example.bddworkflow.category;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Requirement("REQ-003")
@Schema(description = "카테고리 수정 요청 (부분 수정). 누락된 필드는 변경되지 않으며, color/description은 명시적 null로 비울 수 있다.")
public record UpdateCategoryRequest(
        @Schema(description = "카테고리 이름", example = "업무", nullable = true)
        @Size(max = 50)
        String name,

        @Schema(description = "카테고리 색상", example = "#2563EB", nullable = true)
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$")
        String color,

        @Schema(description = "카테고리 설명", example = "회사 일", nullable = true)
        @Size(max = 500)
        String description,

        @Schema(description = "정렬 순서", example = "1024", nullable = true)
        Integer displayOrder
) {
}
