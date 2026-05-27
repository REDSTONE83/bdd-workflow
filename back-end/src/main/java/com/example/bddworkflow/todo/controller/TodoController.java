package com.example.bddworkflow.todo.controller;

import com.example.bddworkflow.todo.dto.CreateTodoRequest;
import com.example.bddworkflow.todo.dto.TodoResponse;
import com.example.bddworkflow.todo.service.TodoService;
import com.example.bddworkflow.todo.dto.UpdateTodoRequest;

import com.example.bddworkflow.common.ApiError;
import com.example.bddworkflow.common.PageResponse;
import com.example.bddworkflow.common.SortKeys;
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
import org.springframework.data.web.PageableDefault;
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

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/todos")
@Tag(name = "Todo")
@RequiredArgsConstructor
@ApiResponses(@ApiResponse(responseCode = "401", description = "인증 누락 또는 실패",
        content = @Content(schema = @Schema(implementation = ApiError.class))))
public class TodoController {

    // REQ-002 의사결정 #(sort-keys, 2026-05-27): 기본 정렬은 도메인 고정(미완료 → 우선순위 → id),
    // 사용자가 sort 를 직접 정하면 title/dueDate/createdAt 세 키만 허용한다. 다른 키는 InvalidSortKey 로 거절.
    private static final Set<String> ALLOWED_SORT_KEYS = Set.of("title", "dueDate", "createdAt");

    private final TodoService todoService;

    @Requirement({"REQ-002", "REQ-004"})
    @Operation(
            summary = "할 일 생성",
            description = """
                    Requirement: REQ-002

                    사용자는 자신의 할 일을 생성한다. 제목은 trim된 뒤 저장되며, completed는 항상 false로 시작한다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "생성 성공",
                    content = @Content(schema = @Schema(implementation = TodoResponse.class))),
            @ApiResponse(responseCode = "400", description = "요청 값 검증 실패",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping
    public ResponseEntity<TodoResponse> createTodo(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody CreateTodoRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(todoService.createTodo(principal.id(), request));
    }

    @Requirement({"REQ-002", "REQ-004"})
    @Operation(
            summary = "할 일 목록 조회",
            description = """
                    Requirement: REQ-002

                    사용자는 자신의 할 일 목록을 조회한다. 미완료 먼저, 우선순위 HIGH→MEDIUM→LOW, 식별자 오름차순으로 정렬된다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = PageResponse.class)))
    })
    @GetMapping
    public ResponseEntity<PageResponse<TodoResponse>> listTodos(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PageableDefault(size = 20) Pageable pageable) {
        SortKeys.requireAllowed(pageable.getSort(), ALLOWED_SORT_KEYS);
        return ResponseEntity.ok(todoService.listTodos(principal.id(), pageable));
    }

    @Requirement({"REQ-002", "REQ-004"})
    @Operation(
            summary = "할 일 수정",
            description = """
                    Requirement: REQ-002

                    사용자는 자신의 할 일을 부분 수정한다. 누락 필드는 유지하고, description/dueDate/categoryId는 명시적 null로 비울 수 있다.
                    title/priority/completed는 명시적 null을 허용하지 않는다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = TodoResponse.class))),
            @ApiResponse(responseCode = "400", description = "요청 값 검증 실패",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "404", description = "존재하지 않거나 타인 자원",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PatchMapping("/{todoId}")
    public ResponseEntity<TodoResponse> updateTodo(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID todoId,
            @Valid @RequestBody UpdateTodoRequest body) {
        return ResponseEntity.ok(todoService.updateTodo(principal.id(), todoId, body));
    }

    @Requirement({"REQ-002", "REQ-004"})
    @Operation(
            summary = "할 일 삭제",
            description = """
                    Requirement: REQ-002

                    사용자는 자신의 할 일을 영구 삭제한다. 존재하지 않거나 타인 자원이면 404로 응답한다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "404", description = "존재하지 않거나 타인 자원",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @DeleteMapping("/{todoId}")
    public ResponseEntity<Void> deleteTodo(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID todoId) {
        todoService.deleteTodo(principal.id(), todoId);
        return ResponseEntity.noContent().build();
    }
}
