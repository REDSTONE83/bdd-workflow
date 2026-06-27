package com.example.bddworkflow.todo.repository;

import com.example.bddworkflow.harness.Requirement;
import com.example.bddworkflow.todo.domain.Priority;
import com.example.bddworkflow.todo.domain.Todo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TodoRepository extends JpaRepository<Todo, UUID> {

    default Todo save(UUID userId, String title, String description, LocalDate dueDate,
                      Priority priority, boolean completed, UUID categoryId) {
        return save(new Todo(null, userId, title, description, dueDate, priority, completed, categoryId));
    }

    Page<Todo> findAllByUserId(UUID userId, Pageable pageable);

    @Query("""
            select t from Todo t
            where t.userId = :userId
            order by t.completed asc,
                     case t.priority
                         when com.example.bddworkflow.todo.domain.Priority.HIGH then 0
                         when com.example.bddworkflow.todo.domain.Priority.MEDIUM then 1
                         when com.example.bddworkflow.todo.domain.Priority.LOW then 2
                     end asc,
                     t.id asc
            """)
    Page<Todo> findAllByUserIdOrderedForListing(@Param("userId") UUID userId, Pageable pageable);

    @Requirement("REQ-040")
    @Query("""
            select t from Todo t
            where t.userId = :userId
              and (:search is null
                   or lower(t.title) like concat('%', :search, '%')
                   or lower(t.description) like concat('%', :search, '%'))
              and (:completed is null or t.completed = :completed)
              and (:priority is null or t.priority = :priority)
              and (:categoryId is null or t.categoryId = :categoryId)
              and (:uncategorized = false or t.categoryId is null)
              and (:dueDateFrom is null or t.dueDate >= :dueDateFrom)
              and (:dueDateTo is null or t.dueDate <= :dueDateTo)
            """)
    Page<Todo> findAllByUserIdMatchingFilter(
            @Param("userId") UUID userId,
            @Param("search") String search,
            @Param("completed") Boolean completed,
            @Param("priority") Priority priority,
            @Param("categoryId") UUID categoryId,
            @Param("uncategorized") boolean uncategorized,
            @Param("dueDateFrom") LocalDate dueDateFrom,
            @Param("dueDateTo") LocalDate dueDateTo,
            Pageable pageable);

    @Requirement({"REQ-023", "REQ-040"})
    @Query("""
            select t from Todo t
            where t.userId = :userId
              and (:search is null
                   or lower(t.title) like concat('%', :search, '%')
                   or lower(t.description) like concat('%', :search, '%'))
              and (:completed is null or t.completed = :completed)
              and (:priority is null or t.priority = :priority)
              and (:categoryId is null or t.categoryId = :categoryId)
              and (:uncategorized = false or t.categoryId is null)
              and (:dueDateFrom is null or t.dueDate >= :dueDateFrom)
              and (:dueDateTo is null or t.dueDate <= :dueDateTo)
            order by t.completed asc,
                     case t.priority
                         when com.example.bddworkflow.todo.domain.Priority.HIGH then 0
                         when com.example.bddworkflow.todo.domain.Priority.MEDIUM then 1
                         when com.example.bddworkflow.todo.domain.Priority.LOW then 2
                     end asc,
                     t.id asc
            """)
    Page<Todo> findAllByUserIdMatchingFilterOrderedForListing(
            @Param("userId") UUID userId,
            @Param("search") String search,
            @Param("completed") Boolean completed,
            @Param("priority") Priority priority,
            @Param("categoryId") UUID categoryId,
            @Param("uncategorized") boolean uncategorized,
            @Param("dueDateFrom") LocalDate dueDateFrom,
            @Param("dueDateTo") LocalDate dueDateTo,
            Pageable pageable);

    List<Todo> findAllByCategoryId(UUID categoryId);

    Optional<Todo> findByIdAndUserId(UUID id, UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Todo t set t.categoryId = null where t.categoryId = :categoryId")
    int detachCategoryFromAllTodos(@Param("categoryId") UUID categoryId);
}
