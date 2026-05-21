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

import com.example.bddworkflow.harness.Requirement;
import lombok.RequiredArgsConstructor;
import org.openapitools.jackson.nullable.JsonNullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.regex.Pattern;

@Requirement("REQ-003")
@Service
@RequiredArgsConstructor
public class CategoryService {

    static final int DISPLAY_ORDER_STEP = 1024;
    static final int NAME_MAX_LENGTH = 50;
    static final int DESCRIPTION_MAX_LENGTH = 500;
    static final Pattern COLOR_PATTERN = Pattern.compile("^#[0-9A-Fa-f]{6}$");

    private final CategoryRepository categoryRepository;

    @Transactional
    public CreateCategoryResponse createCategory(UUID userId, CreateCategoryRequest request) {
        String name = normalizeName(request.name());
        String color = request.color();
        validateColor(color);
        String description = request.description();
        validateDescription(description);
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

    private static final Sort DEFAULT_LIST_SORT = Sort.by(Sort.Order.asc("displayOrder"), Sort.Order.asc("id"));

    @Transactional(readOnly = true)
    public PageResponse<CategoryResponse> listCategories(UUID userId, Pageable pageable) {
        Pageable effective = pageable.getSort().isUnsorted()
                ? (pageable.isPaged()
                        ? PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), DEFAULT_LIST_SORT)
                        : PageRequest.of(0, Integer.MAX_VALUE, DEFAULT_LIST_SORT))
                : pageable;
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
            String value = body.name().get();
            if (value == null) {
                throw new CategoryValidationException("name", "이름은 null일 수 없습니다.");
            }
            newName = normalizeName(value);
            if (!newName.equals(existing.name())
                    && categoryRepository.findByUserIdAndName(userId, newName).isPresent()) {
                throw new DuplicateCategoryNameException(newName);
            }
        }

        if (body.color().isPresent()) {
            newColor = body.color().get();
            validateColor(newColor);
        }

        if (body.description().isPresent()) {
            newDescription = body.description().get();
            validateDescription(newDescription);
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
        categoryRepository.deleteById(existing.id());
    }

    private String normalizeName(String rawName) {
        if (rawName == null) {
            throw new CategoryValidationException("name", "이름은 필수입니다.");
        }
        String trimmed = rawName.trim();
        if (trimmed.isEmpty()) {
            throw new CategoryValidationException("name", "이름은 공백일 수 없습니다.");
        }
        if (trimmed.length() > NAME_MAX_LENGTH) {
            throw new CategoryValidationException("name", "이름은 " + NAME_MAX_LENGTH + "자를 초과할 수 없습니다.");
        }
        return trimmed;
    }

    private void validateColor(String color) {
        if (color == null) {
            return;
        }
        if (!COLOR_PATTERN.matcher(color).matches()) {
            throw new CategoryValidationException("color", "색상 형식이 잘못되었습니다.");
        }
    }

    private void validateDescription(String description) {
        if (description == null) {
            return;
        }
        if (description.length() > DESCRIPTION_MAX_LENGTH) {
            throw new CategoryValidationException("description", "설명은 " + DESCRIPTION_MAX_LENGTH + "자를 초과할 수 없습니다.");
        }
    }
}
