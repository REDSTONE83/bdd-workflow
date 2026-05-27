package com.example.bddworkflow.category.service;

import com.example.bddworkflow.category.domain.Category;
import com.example.bddworkflow.category.exception.CategoryNotFoundException;
import com.example.bddworkflow.category.repository.CategoryRepository;
import com.example.bddworkflow.category.dto.CategoryResponse;
import com.example.bddworkflow.category.exception.CategoryValidationException;
import com.example.bddworkflow.category.dto.CreateCategoryRequest;
import com.example.bddworkflow.category.dto.CreateCategoryResponse;
import com.example.bddworkflow.category.exception.DuplicateCategoryNameException;
import com.example.bddworkflow.category.dto.UpdateCategoryRequest;
import com.example.bddworkflow.common.PageResponse;
import com.example.bddworkflow.todo.service.TodoService;

import com.example.bddworkflow.harness.Requirement;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Requirement("REQ-003")
@Service
@RequiredArgsConstructor
public class CategoryService {

    static final int DISPLAY_ORDER_STEP = 1024;

    private final CategoryRepository categoryRepository;
    private final TodoService todoService;

    @Transactional
    public CreateCategoryResponse createCategory(UUID userId, CreateCategoryRequest request) {
        String name = request.name();
        String color = request.color();
        String description = request.description();
        Integer displayOrder = request.displayOrder() != null
                ? request.displayOrder()
                : categoryRepository.findMaxDisplayOrderByUserId(userId)
                        .map(max -> max + DISPLAY_ORDER_STEP)
                        .orElse(DISPLAY_ORDER_STEP);

        if (categoryRepository.findByUserIdAndName(userId, name).isPresent()) {
            throw new DuplicateCategoryNameException(name);
        }

        Category saved = categoryRepository.save(userId, name, color, description, displayOrder);
        return new CreateCategoryResponse(
                saved.id(),
                saved.name(),
                saved.color(),
                saved.description(),
                saved.displayOrder()
        );
    }

    private static final Sort ID_TIEBREAKER = Sort.by(Sort.Order.asc("id"));

    @Transactional(readOnly = true)
    public PageResponse<CategoryResponse> listCategories(UUID userId, Pageable pageable) {
        Sort effectiveSort = pageable.getSort().and(ID_TIEBREAKER);
        Pageable effective = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), effectiveSort);
        Page<CategoryResponse> page = categoryRepository.findAllByUserId(userId, effective)
                .map(category -> new CategoryResponse(
                        category.id(),
                        category.name(),
                        category.color(),
                        category.description(),
                        category.displayOrder()
                ));
        return PageResponse.from(page);
    }

    @Transactional
    public CategoryResponse updateCategory(UUID userId, UUID categoryId, UpdateCategoryRequest body) {
        Category existing = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new CategoryNotFoundException(categoryId));

        String newName = existing.name();
        String newColor = existing.color();
        String newDescription = existing.description();
        Integer newDisplayOrder = existing.displayOrder();

        if (body.name().isPresent()) {
            newName = body.name().get();
            if (!newName.equals(existing.name())
                    && categoryRepository.findByUserIdAndName(userId, newName).isPresent()) {
                throw new DuplicateCategoryNameException(newName);
            }
        }

        if (body.color().isPresent()) {
            newColor = body.color().get();
        }

        if (body.description().isPresent()) {
            newDescription = body.description().get();
        }

        if (body.displayOrder().isPresent()) {
            Integer value = body.displayOrder().get();
            if (value == null) {
                throw new CategoryValidationException("displayOrder", "정렬 순서는 null일 수 없습니다.");
            }
            newDisplayOrder = value;
        }

        Category updated = new Category(existing.id(), existing.userId(), newName, newColor, newDescription, newDisplayOrder);
        categoryRepository.replace(updated);
        return new CategoryResponse(
                updated.id(),
                updated.name(),
                updated.color(),
                updated.description(),
                updated.displayOrder()
        );
    }

    @Transactional
    public void deleteCategory(UUID userId, UUID categoryId) {
        Category existing = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new CategoryNotFoundException(categoryId));
        todoService.detachCategoryFromAllTodos(existing.id());
        categoryRepository.deleteById(existing.id());
    }
}
