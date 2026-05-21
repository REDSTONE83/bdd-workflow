package com.example.bddworkflow.category;

public class DuplicateCategoryNameException extends RuntimeException {

    public DuplicateCategoryNameException(String name) {
        super("Category name already exists: " + name);
    }
}
