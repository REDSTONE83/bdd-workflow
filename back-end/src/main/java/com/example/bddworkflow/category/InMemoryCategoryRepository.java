package com.example.bddworkflow.category;

import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class InMemoryCategoryRepository {

    private final AtomicLong ids = new AtomicLong(1);
    private final ConcurrentMap<Long, Category> storage = new ConcurrentHashMap<>();

    public Category save(Long userId, String name, String color, String description, Integer displayOrder) {
        long id = ids.getAndIncrement();
        Category category = new Category(id, userId, name, color, description, displayOrder);
        storage.put(id, category);
        return category;
    }

    public Optional<Category> findById(Long id) {
        return Optional.ofNullable(storage.get(id));
    }

    public List<Category> findAllByUserId(Long userId) {
        List<Category> result = new ArrayList<>();
        for (Category category : storage.values()) {
            if (category.userId().equals(userId)) {
                result.add(category);
            }
        }
        result.sort(Comparator
                .comparingInt(Category::displayOrder)
                .thenComparingLong(Category::id));
        return result;
    }

    public Optional<Category> findByUserIdAndName(Long userId, String name) {
        for (Category category : storage.values()) {
            if (category.userId().equals(userId) && category.name().equals(name)) {
                return Optional.of(category);
            }
        }
        return Optional.empty();
    }

    public Optional<Integer> findMaxDisplayOrderByUserId(Long userId) {
        Integer max = null;
        for (Category category : storage.values()) {
            if (!category.userId().equals(userId)) {
                continue;
            }
            if (max == null || category.displayOrder() > max) {
                max = category.displayOrder();
            }
        }
        return Optional.ofNullable(max);
    }

    public Category replace(Category category) {
        storage.put(category.id(), category);
        return category;
    }

    public void deleteById(Long id) {
        storage.remove(id);
    }

    public void deleteAll() {
        storage.clear();
        ids.set(1);
    }
}
