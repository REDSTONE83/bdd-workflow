package com.example.bddworkflow.category.exception;

public class CategoryValidationException extends RuntimeException {

    private final String field;

    public CategoryValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String field() {
        return field;
    }
}
