package com.example.bddworkflow.category.controller;

import com.example.bddworkflow.category.dto.CategoryResponse;
import com.example.bddworkflow.category.service.CategoryService;
import com.example.bddworkflow.category.dto.CreateCategoryRequest;
import com.example.bddworkflow.category.dto.CreateCategoryResponse;
import com.example.bddworkflow.category.dto.UpdateCategoryRequest;

import com.example.bddworkflow.common.ApiError;
import com.example.bddworkflow.common.PageResponse;
import com.example.bddworkflow.common.auth.AuthenticatedUser;
import com.example.bddworkflow.harness.Requirement;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/categories")
@Tag(name = "Category")
@RequiredArgsConstructor
@ApiResponses(@ApiResponse(responseCode = "401", description = "인증 누락 또는 실패",
        content = @Content(schema = @Schema(implementation = ApiError.class))))
public class CategoryController {

    private final CategoryService categoryService;

    @Requirement({"REQ-003", "REQ-004"})
    @Operation(
            summary = "카테고리 생성",
            description = """
                    Requirement: REQ-003

                    사용자는 자신의 카테고리를 생성한다. 이름은 trim된 뒤 저장되며 사용자 안에서 유일해야 한다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "생성 성공",
                    content = @Content(schema = @Schema(implementation = CreateCategoryResponse.class))),
            @ApiResponse(responseCode = "400", description = "요청 값 검증 실패",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "409", description = "중복 카테고리 이름",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping
    public ResponseEntity<CreateCategoryResponse> createCategory(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(categoryService.createCategory(principal.id(), request));
    }

    @Requirement({"REQ-003", "REQ-004"})
    @Operation(
            summary = "카테고리 목록 조회",
            description = """
                    Requirement: REQ-003

                    사용자는 자신의 카테고리 목록을 정렬 순서 오름차순, 동률이면 식별자 오름차순으로 조회한다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = PageResponse.class)))
    })
    @GetMapping
    public ResponseEntity<PageResponse<CategoryResponse>> listCategories(
            @AuthenticationPrincipal AuthenticatedUser principal,
            Pageable pageable) {
        return ResponseEntity.ok(categoryService.listCategories(principal.id(), pageable));
    }

    @Requirement({"REQ-003", "REQ-004"})
    @Operation(
            summary = "카테고리 수정",
            description = """
                    Requirement: REQ-003

                    사용자는 자신의 카테고리를 부분 수정한다. 요청 본문에 없는 필드는 기존 값을 유지하며,
                    color와 description은 명시적으로 null을 보내면 값을 비운다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = CategoryResponse.class))),
            @ApiResponse(responseCode = "400", description = "요청 값 검증 실패",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "404", description = "존재하지 않거나 타인 자원",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "409", description = "중복 카테고리 이름",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PatchMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID categoryId,
            @Valid @RequestBody UpdateCategoryRequest body) {
        return ResponseEntity.ok(categoryService.updateCategory(principal.id(), categoryId, body));
    }

    @Requirement({"REQ-003", "REQ-004"})
    @Operation(
            summary = "카테고리 삭제",
            description = """
                    Requirement: REQ-003

                    사용자는 자신의 카테고리를 영구 삭제한다. 존재하지 않거나 타인 자원이면 404로 응답한다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "404", description = "존재하지 않거나 타인 자원",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID categoryId) {
        categoryService.deleteCategory(principal.id(), categoryId);
        return ResponseEntity.noContent().build();
    }
}
