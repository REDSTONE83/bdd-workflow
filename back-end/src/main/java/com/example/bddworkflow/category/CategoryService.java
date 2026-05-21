package com.example.bddworkflow.category;

import com.example.bddworkflow.harness.Requirement;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Requirement("REQ-003")
@Service
public class CategoryService {

    static final int DISPLAY_ORDER_STEP = 1024;
    static final int NAME_MAX_LENGTH = 50;
    static final int DESCRIPTION_MAX_LENGTH = 500;
    static final Pattern COLOR_PATTERN = Pattern.compile("^#[0-9A-Fa-f]{6}$");

    private final InMemoryCategoryRepository categoryRepository;

    public CategoryService(InMemoryCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public CreateCategoryResponse createCategory(Long userId, CreateCategoryRequest request) {
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

    public ListCategoriesResponse listCategories(Long userId) {
        List<CategoryResponse> categories = categoryRepository.findAllByUserId(userId).stream()
                .map(category -> new CategoryResponse(
                        category.id(),
                        category.name(),
                        category.color(),
                        category.description(),
                        category.displayOrder()
                ))
                .toList();
        return new ListCategoriesResponse(categories);
    }

    public CategoryResponse updateCategory(Long userId, Long categoryId, ObjectNode body) {
        Category existing = categoryRepository.findById(categoryId)
                .filter(c -> c.userId().equals(userId))
                .orElseThrow(() -> new CategoryNotFoundException(categoryId));

        String newName = existing.name();
        String newColor = existing.color();
        String newDescription = existing.description();
        Integer newDisplayOrder = existing.displayOrder();

        if (body.has("name")) {
            JsonNode nameNode = body.get("name");
            if (nameNode.isNull()) {
                throw new CategoryValidationException("name", "이름은 null일 수 없습니다.");
            }
            newName = normalizeName(nameNode.asText());
            if (!newName.equals(existing.name())
                    && categoryRepository.findByUserIdAndName(userId, newName).isPresent()) {
                throw new DuplicateCategoryNameException(newName);
            }
        }

        if (body.has("color")) {
            JsonNode colorNode = body.get("color");
            newColor = colorNode.isNull() ? null : colorNode.asText();
            validateColor(newColor);
        }

        if (body.has("description")) {
            JsonNode descNode = body.get("description");
            newDescription = descNode.isNull() ? null : descNode.asText();
            validateDescription(newDescription);
        }

        if (body.has("displayOrder")) {
            JsonNode orderNode = body.get("displayOrder");
            if (orderNode.isNull()) {
                throw new CategoryValidationException("displayOrder", "정렬 순서는 null일 수 없습니다.");
            }
            newDisplayOrder = orderNode.asInt();
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

    public void deleteCategory(Long userId, Long categoryId) {
        Category existing = categoryRepository.findById(categoryId)
                .filter(c -> c.userId().equals(userId))
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
