package com.example.bddworkflow.category.service;

import com.example.bddworkflow.category.repository.CategoryRepository;

import com.example.bddworkflow.harness.Requirement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Requirement("REQ-003")
@Service
@RequiredArgsConstructor
public class CategorySeedService {

    private static final List<DefaultCategory> DEFAULTS = List.of(
            new DefaultCategory("업무", "#2563EB", 1024),
            new DefaultCategory("개인", "#16A34A", 2048),
            new DefaultCategory("기타", "#6B7280", 3072)
    );

    private final CategoryRepository categoryRepository;

    @Transactional
    public void seedDefaults(UUID userId) {
        for (DefaultCategory defaultCategory : DEFAULTS) {
            categoryRepository.save(
                    userId,
                    defaultCategory.name(),
                    defaultCategory.color(),
                    null,
                    defaultCategory.displayOrder()
            );
        }
    }

    private record DefaultCategory(String name, String color, Integer displayOrder) {
    }
}
