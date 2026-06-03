package com.example.bddworkflow.category.dto;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Requirement({"REQ-016", "REQ-018"})
@Schema(description = "카테고리 응답")
public record CategoryResponse(
        @Schema(description = "카테고리 식별자", example = "01900000-0000-7000-8000-000000000000")
        UUID categoryId,

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
