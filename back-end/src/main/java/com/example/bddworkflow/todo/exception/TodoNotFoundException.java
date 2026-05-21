package com.example.bddworkflow.todo.exception;

import java.util.UUID;

public class TodoNotFoundException extends RuntimeException {

    public TodoNotFoundException(UUID todoId) {
        super("Todo not found: " + todoId);
    }
}
