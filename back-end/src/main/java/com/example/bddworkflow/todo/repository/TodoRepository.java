package com.example.bddworkflow.todo.repository;

import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.domain.Todo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TodoRepository extends JpaRepository<Todo, UUID> {

    default Todo save(UUID userId, String title, String description, LocalDate dueDate,
                      Priority priority, boolean completed, UUID categoryId) {
        return save(new Todo(null, userId, title, description, dueDate, priority, completed, categoryId));
    }

    Page<Todo> findAllByUserId(UUID userId, Pageable pageable);

    List<Todo> findAllByCategoryId(UUID categoryId);

    Optional<Todo> findByIdAndUserId(UUID id, UUID userId);
}
