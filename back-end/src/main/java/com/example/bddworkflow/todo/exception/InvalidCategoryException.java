package com.example.bddworkflow.todo.exception;

import java.util.UUID;

public class InvalidCategoryException extends RuntimeException {

    public InvalidCategoryException(UUID categoryId) {
        super("Invalid category: " + categoryId);
    }
}
