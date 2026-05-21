package com.example.bddworkflow.category;

import com.example.bddworkflow.harness.Requirement;
import org.springframework.stereotype.Service;

import java.util.List;

@Requirement("REQ-003")
@Service
public class CategorySeedService {

    private static final List<DefaultCategory> DEFAULTS = List.of(
            new DefaultCategory("업무", "#2563EB", 1024),
            new DefaultCategory("개인", "#16A34A", 2048),
            new DefaultCategory("기타", "#6B7280", 3072)
    );

    private final InMemoryCategoryRepository categoryRepository;

    public CategorySeedService(InMemoryCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public void seedDefaults(Long userId) {
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
