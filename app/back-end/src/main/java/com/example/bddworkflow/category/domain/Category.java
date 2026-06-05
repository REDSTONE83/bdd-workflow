package com.example.bddworkflow.category.domain;

import com.example.bddworkflow.harness.Requirement;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "category",
        uniqueConstraints = @UniqueConstraint(name = "uk_category_user_name", columnNames = {"user_id", "name"})
)
@EntityListeners(AuditingEntityListener.class)
@Requirement({"REQ-016", "REQ-017", "REQ-018", "REQ-019", "REQ-020"})
public class Category {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Requirement({"REQ-016", "REQ-017", "REQ-018", "REQ-019", "REQ-020"})
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Requirement({"REQ-016", "REQ-017", "REQ-018", "REQ-019", "REQ-020"})
    @Column(nullable = false, length = 50)
    private String name;

    @Requirement({"REQ-016", "REQ-017", "REQ-018", "REQ-020"})
    @Column(length = 7)
    private String color;

    @Requirement({"REQ-017", "REQ-018"})
    @Column(length = 500)
    private String description;

    @Requirement({"REQ-016", "REQ-017", "REQ-018", "REQ-020"})
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Requirement({"REQ-016", "REQ-017", "REQ-018", "REQ-019", "REQ-020"})
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Requirement({"REQ-016", "REQ-017", "REQ-018", "REQ-019", "REQ-020"})
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Category() {
    }

    public Category(UUID id, UUID userId, String name, String color, String description, Integer displayOrder) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.color = color;
        this.description = description;
        this.displayOrder = displayOrder;
    }

    public UUID id() {
        return id;
    }

    public UUID userId() {
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

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }
}
