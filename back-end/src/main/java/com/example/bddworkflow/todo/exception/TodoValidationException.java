package com.example.bddworkflow.todo.exception;

public class TodoValidationException extends RuntimeException {

    private final String field;

    public TodoValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String field() {
        return field;
    }
}
