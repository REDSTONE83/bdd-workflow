package com.example.bddworkflow.category;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;

@Requirement("REQ-003")
@Schema(description = "카테고리 생성 응답")
public record CreateCategoryResponse(
        @Schema(description = "카테고리 식별자", example = "1")
        Long categoryId,

        @Schema(description = "카테고리 이름", example = "업무")
        String name,

        @Schema(description = "카테고리 색상", example = "#2563EB", nullable = true)
        String color,

        @Schema(description = "카테고리 설명", example = "회사 일", nullable = true)
        String description,

        @Schema(description = "정렬 순서", example = "1024")
        Integer displayOrder
) {
}
