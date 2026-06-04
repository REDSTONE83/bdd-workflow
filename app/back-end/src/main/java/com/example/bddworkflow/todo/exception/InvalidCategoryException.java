package com.example.bddworkflow.todo.exception;

import java.util.UUID;

public class InvalidCategoryException extends RuntimeException {

    private static final String FIELD = "categoryId";

    private final UUID categoryId;

    public InvalidCategoryException(UUID categoryId) {
        super("Invalid category: " + categoryId);
        this.categoryId = categoryId;
    }

    public String field() {
        return FIELD;
    }

    public UUID categoryId() {
        return categoryId;
    }
}
