package com.example.bddworkflow.todo.domain;

import com.example.bddworkflow.harness.Requirement;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "todo")
@EntityListeners(AuditingEntityListener.class)
@Requirement({"REQ-022", "REQ-023", "REQ-024", "REQ-027", "REQ-025", "REQ-026", "REQ-040"})
public class Todo {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Requirement({"REQ-022", "REQ-023", "REQ-024", "REQ-027", "REQ-025", "REQ-026", "REQ-040"})
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Requirement({"REQ-022", "REQ-023", "REQ-024", "REQ-040"})
    @Column(nullable = false, length = 100)
    private String title;

    @Requirement({"REQ-022", "REQ-024", "REQ-040"})
    @Column(length = 1000)
    private String description;

    @Requirement({"REQ-022", "REQ-023", "REQ-024", "REQ-040"})
    @Column(name = "due_date")
    private LocalDate dueDate;

    @Requirement({"REQ-022", "REQ-023", "REQ-024", "REQ-040"})
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Priority priority;

    @Requirement({"REQ-022", "REQ-023", "REQ-024", "REQ-027", "REQ-040"})
    @Column(nullable = false)
    private boolean completed;

    @Requirement({"REQ-022", "REQ-023", "REQ-024", "REQ-026", "REQ-040"})
    @Column(name = "category_id", columnDefinition = "uuid")
    private UUID categoryId;

    @Requirement({"REQ-022", "REQ-023", "REQ-024", "REQ-025", "REQ-026"})
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Requirement({"REQ-022", "REQ-023", "REQ-024", "REQ-027", "REQ-025", "REQ-026"})
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Todo() {
    }

    public Todo(UUID id, UUID userId, String title, String description, LocalDate dueDate,
                Priority priority, boolean completed, UUID categoryId) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.completed = completed;
        this.categoryId = categoryId;
    }

    public UUID id() {
        return id;
    }

    public UUID userId() {
        return userId;
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }

    public LocalDate dueDate() {
        return dueDate;
    }

    public Priority priority() {
        return priority;
    }

    public boolean completed() {
        return completed;
    }

    public UUID categoryId() {
        return categoryId;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }
}
