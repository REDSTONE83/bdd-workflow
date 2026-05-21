package com.example.bddworkflow.todo.dto;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Requirement("REQ-002")
@Schema(description = "할 일 응답에 포함되는 카테고리 정보. 연결이 없으면 응답에서 category 필드 전체가 null이다.")
public record TodoCategoryInfo(
        @Schema(description = "카테고리 식별자", example = "01900000-0000-7000-8000-000000000000")
        UUID categoryId,

        @Schema(description = "카테고리 이름", example = "업무")
        String name,

        @Schema(description = "카테고리 색상", example = "#2563EB", nullable = true)
        String color
) {
}
