package com.example.bddworkflow.common;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.data.domain.Page;

import java.util.List;

@Schema(description = "페이지네이션 표준 응답")
public record PageResponse<T>(
        @Schema(description = "현재 페이지의 항목") List<T> content,
        @Schema(description = "0-based page index", example = "0") int page,
        @Schema(description = "페이지 크기", example = "20") int size,
        @Schema(description = "전체 항목 수", example = "123") long totalElements,
        @Schema(description = "전체 페이지 수", example = "7") int totalPages
) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
