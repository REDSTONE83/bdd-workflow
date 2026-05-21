package com.example.bddworkflow.category.exception;

import com.example.bddworkflow.category.domain.Category;

public class DuplicateCategoryNameException extends RuntimeException {

    public DuplicateCategoryNameException(String name) {
        super("Category name already exists: " + name);
    }
}
