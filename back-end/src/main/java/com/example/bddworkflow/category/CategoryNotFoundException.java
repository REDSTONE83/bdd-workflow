package com.example.bddworkflow.category;

public class CategoryNotFoundException extends RuntimeException {

    public CategoryNotFoundException(Long categoryId) {
        super("Category not found: " + categoryId);
    }
}
