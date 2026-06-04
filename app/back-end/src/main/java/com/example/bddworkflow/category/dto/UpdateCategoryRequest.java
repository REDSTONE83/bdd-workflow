package com.example.bddworkflow.category.dto;

import com.example.bddworkflow.common.Strings;
import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.openapitools.jackson.nullable.JsonNullable;

@Requirement("REQ-018")
@Schema(description = "카테고리 수정 요청 (부분 수정). 누락된 필드는 변경되지 않으며, color/description은 명시적 null로 비울 수 있다.")
public class UpdateCategoryRequest {

    @Schema(description = "카테고리 이름", example = "업무", nullable = true)
    private JsonNullable<@NotBlank @Size(max = 50) String> name = JsonNullable.undefined();

    @Schema(description = "카테고리 색상", example = "#2563EB", nullable = true)
    private JsonNullable<@Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String> color = JsonNullable.undefined();

    @Schema(description = "카테고리 설명", example = "회사 일", nullable = true)
    private JsonNullable<@Size(max = 500) String> description = JsonNullable.undefined();

    @Schema(description = "정렬 순서", example = "1024", nullable = true)
    private JsonNullable<Integer> displayOrder = JsonNullable.undefined();

    public JsonNullable<String> name() {
        return name;
    }

    public JsonNullable<String> color() {
        return color;
    }

    public JsonNullable<String> description() {
        return description;
    }

    public JsonNullable<Integer> displayOrder() {
        return displayOrder;
    }

    public void setName(JsonNullable<String> name) {
        this.name = Strings.trimInsideNullable(name);
    }

    public void setColor(JsonNullable<String> color) {
        this.color = Strings.trimInsideNullable(color);
    }

    public void setDescription(JsonNullable<String> description) {
        this.description = Strings.trimInsideNullable(description);
    }

    public void setDisplayOrder(JsonNullable<Integer> displayOrder) {
        this.displayOrder = displayOrder == null ? JsonNullable.undefined() : displayOrder;
    }
}
