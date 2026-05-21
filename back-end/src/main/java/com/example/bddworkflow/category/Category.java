package com.example.bddworkflow.category;

import com.example.bddworkflow.harness.Requirement;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "category",
        uniqueConstraints = @UniqueConstraint(name = "uk_category_user_name", columnNames = {"user_id", "name"})
)
@Requirement("REQ-003")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Requirement("REQ-003")
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Requirement("REQ-003")
    @Column(nullable = false, length = 50)
    private String name;

    @Requirement("REQ-003")
    @Column(length = 7)
    private String color;

    @Requirement("REQ-003")
    @Column(length = 500)
    private String description;

    @Requirement("REQ-003")
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    protected Category() {
    }

    public Category(Long id, Long userId, String name, String color, String description, Integer displayOrder) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.color = color;
        this.description = description;
        this.displayOrder = displayOrder;
    }

    public Long id() {
        return id;
    }

    public Long userId() {
        return userId;
    }

    public String name() {
        return name;
    }

    public String color() {
        return color;
    }

    public String description() {
        return description;
    }

    public Integer displayOrder() {
        return displayOrder;
    }
}
