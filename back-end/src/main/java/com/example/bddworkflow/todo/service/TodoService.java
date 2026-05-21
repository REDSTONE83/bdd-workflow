package com.example.bddworkflow.todo.service;

import com.example.bddworkflow.category.domain.Category;
import com.example.bddworkflow.category.repository.CategoryRepository;
import com.example.bddworkflow.common.PageResponse;
import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.domain.Todo;
import com.example.bddworkflow.todo.dto.CreateTodoRequest;
import com.example.bddworkflow.todo.dto.TodoCategoryInfo;
import com.example.bddworkflow.todo.dto.TodoResponse;
import com.example.bddworkflow.todo.dto.UpdateTodoRequest;
import com.example.bddworkflow.todo.exception.InvalidCategoryException;
import com.example.bddworkflow.todo.exception.TodoNotFoundException;
import com.example.bddworkflow.todo.repository.TodoRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Requirement("REQ-002")
@Service
public class TodoService {

    private final TodoRepository todoRepository;
    private final CategoryRepository categoryRepository;

    public TodoService(TodoRepository todoRepository, CategoryRepository categoryRepository) {
        this.todoRepository = todoRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public TodoResponse createTodo(UUID userId, CreateTodoRequest request) {
        Priority priority = request.priority() != null ? request.priority() : Priority.MEDIUM;
        if (request.categoryId() != null) {
            requireOwnedCategory(userId, request.categoryId());
        }
        Todo saved = todoRepository.save(userId, request.title(), request.description(), request.dueDate(),
                priority, false, request.categoryId());
        return toResponse(saved, lookupCategory(userId, saved.categoryId()));
    }

    @Transactional(readOnly = true)
    public PageResponse<TodoResponse> listTodos(UUID userId, Pageable pageable) {
        Page<Todo> page = pageable.getSort().isUnsorted()
                ? todoRepository.findAllByUserIdOrderedForListing(userId, pageable)
                : todoRepository.findAllByUserId(userId, pageable);
        Map<UUID, Category> categoriesById = loadCategoriesFor(userId, page.getContent());
        Page<TodoResponse> mapped = page.map(t ->
                toResponse(t, t.categoryId() == null ? null : categoriesById.get(t.categoryId())));
        return PageResponse.from(mapped);
    }

    @Transactional
    public TodoResponse updateTodo(UUID userId, UUID todoId, UpdateTodoRequest body) {
        Todo existing = todoRepository.findByIdAndUserId(todoId, userId)
                .orElseThrow(() -> new TodoNotFoundException(todoId));

        String newTitle = existing.title();
        String newDescription = existing.description();
        LocalDate newDueDate = existing.dueDate();
        Priority newPriority = existing.priority();
        boolean newCompleted = existing.completed();
        UUID newCategoryId = existing.categoryId();

        if (body.title().isPresent()) {
            newTitle = body.title().get();
        }
        if (body.description().isPresent()) {
            newDescription = body.description().get();
        }
        if (body.dueDate().isPresent()) {
            newDueDate = body.dueDate().get();
        }
        if (body.priority().isPresent()) {
            newPriority = body.priority().get();
        }
        if (body.completed().isPresent()) {
            newCompleted = body.completed().get();
        }
        if (body.categoryId().isPresent()) {
            UUID value = body.categoryId().get();
            if (value != null) {
                requireOwnedCategory(userId, value);
            }
            newCategoryId = value;
        }

        Todo updated = new Todo(existing.id(), existing.userId(), newTitle, newDescription, newDueDate,
                newPriority, newCompleted, newCategoryId);
        Todo saved = todoRepository.save(updated);
        return toResponse(saved, lookupCategory(userId, saved.categoryId()));
    }

    @Transactional
    public void deleteTodo(UUID userId, UUID todoId) {
        Todo existing = todoRepository.findByIdAndUserId(todoId, userId)
                .orElseThrow(() -> new TodoNotFoundException(todoId));
        todoRepository.deleteById(existing.id());
    }

    @Transactional
    public void detachCategoryFromAllTodos(UUID categoryId) {
        todoRepository.detachCategoryFromAllTodos(categoryId);
    }

    private void requireOwnedCategory(UUID userId, UUID categoryId) {
        categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new InvalidCategoryException(categoryId));
    }

    private Category lookupCategory(UUID userId, UUID categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findByIdAndUserId(categoryId, userId).orElse(null);
    }

    private Map<UUID, Category> loadCategoriesFor(UUID userId, List<Todo> todos) {
        Map<UUID, Category> result = new HashMap<>();
        for (Todo t : todos) {
            UUID cid = t.categoryId();
            if (cid == null || result.containsKey(cid)) continue;
            categoryRepository.findByIdAndUserId(cid, userId).ifPresent(c -> result.put(cid, c));
        }
        return result;
    }

    private TodoResponse toResponse(Todo todo, Category category) {
        TodoCategoryInfo categoryInfo = category == null
                ? null
                : new TodoCategoryInfo(category.id(), category.name(), category.color());
        return new TodoResponse(
                todo.id(),
                todo.title(),
                todo.description(),
                todo.dueDate(),
                todo.priority(),
                todo.completed(),
                categoryInfo
        );
    }
}
