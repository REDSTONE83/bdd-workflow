package com.example.bddworkflow.category.repository;

import com.example.bddworkflow.category.domain.Category;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    default Category save(UUID userId, String name, String color, String description, Integer displayOrder) {
        return save(new Category(null, userId, name, color, description, displayOrder));
    }

    Page<Category> findAllByUserId(UUID userId, Pageable pageable);

    Optional<Category> findByUserIdAndName(UUID userId, String name);

    Optional<Category> findByIdAndUserId(UUID id, UUID userId);

    @Query("select max(c.displayOrder) from Category c where c.userId = :userId")
    Optional<Integer> findMaxDisplayOrderByUserId(@Param("userId") UUID userId);

    default Category replace(Category category) {
        return save(category);
    }
}
