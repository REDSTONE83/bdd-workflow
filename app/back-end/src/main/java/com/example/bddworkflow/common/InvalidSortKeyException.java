package com.example.bddworkflow.common;

public class InvalidSortKeyException extends RuntimeException {

    private final String key;

    public InvalidSortKeyException(String key) {
        super("Invalid sort key: " + key);
        this.key = key;
    }

    public String key() {
        return key;
    }
}
