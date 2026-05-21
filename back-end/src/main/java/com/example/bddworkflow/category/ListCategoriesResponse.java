package com.example.bddworkflow.category;

import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Requirement("REQ-003")
@Schema(description = "카테고리 목록 응답. 정렬 순서 오름차순, 동률이면 식별자 오름차순.")
public record ListCategoriesResponse(
        @Schema(description = "카테고리 목록")
        List<CategoryResponse> categories
) {
}
