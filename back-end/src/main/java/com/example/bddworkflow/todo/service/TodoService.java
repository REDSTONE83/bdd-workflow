package com.example.bddworkflow.todo.service;

import com.example.bddworkflow.common.PageResponse;
import com.example.bddworkflow.todo.dto.CreateTodoRequest;
import com.example.bddworkflow.todo.dto.TodoResponse;
import com.example.bddworkflow.todo.dto.UpdateTodoRequest;

import com.example.bddworkflow.harness.Requirement;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Requirement("REQ-002")
@Service
public class TodoService {

    @Transactional
    public TodoResponse createTodo(UUID userId, CreateTodoRequest request) {
        throw new UnsupportedOperationException("REQ-002: createTodo not yet implemented");
    }

    @Transactional(readOnly = true)
    public PageResponse<TodoResponse> listTodos(UUID userId, Pageable pageable) {
        throw new UnsupportedOperationException("REQ-002: listTodos not yet implemented");
    }

    @Transactional
    public TodoResponse updateTodo(UUID userId, UUID todoId, UpdateTodoRequest body) {
        throw new UnsupportedOperationException("REQ-002: updateTodo not yet implemented");
    }

    @Transactional
    public void deleteTodo(UUID userId, UUID todoId) {
        throw new UnsupportedOperationException("REQ-002: deleteTodo not yet implemented");
    }
}
