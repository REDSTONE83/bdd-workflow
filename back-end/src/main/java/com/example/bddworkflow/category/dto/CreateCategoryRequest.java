package com.example.bddworkflow.category.dto;

import com.example.bddworkflow.common.Strings;
import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Requirement("REQ-003")
@Schema(description = "카테고리 생성 요청. 이름은 trim된 뒤 검증되고 저장된다.")
public record CreateCategoryRequest(
        @NotBlank
        @Size(max = 50)
        @Schema(description = "카테고리 이름 (trim 후 1자 이상 50자 이하)", example = "업무")
        String name,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$")
        @Schema(description = "카테고리 색상 (#RRGGBB hex)", example = "#2563EB", nullable = true)
        String color,

        @Size(max = 500)
        @Schema(description = "카테고리 설명 (최대 500자)", example = "회사 일", nullable = true)
        String description,

        @Schema(description = "정렬 순서 (미입력 시 본인 최대값 + 1024 자동 할당)", example = "1024", nullable = true)
        Integer displayOrder
) {
    public CreateCategoryRequest {
        name = Strings.trimToNull(name);
        color = Strings.trimToNull(color);
        description = Strings.trimToNull(description);
    }
}
