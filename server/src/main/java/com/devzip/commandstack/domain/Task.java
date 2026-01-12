package com.devzip.commandstack.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String syntax;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskType type;

    @Column(nullable = false)
    private Long contextId;

    private LocalDateTime deadline;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = TaskStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void updateStatus(TaskStatus newStatus) {
        this.status = newStatus;

        if (newStatus == TaskStatus.EXECUTING && this.startedAt == null) {
            this.startedAt = LocalDateTime.now();
        }

        if ((newStatus == TaskStatus.EXIT_SUCCESS || newStatus == TaskStatus.SIGKILL)
            && this.completedAt == null) {
            this.completedAt = LocalDateTime.now();
        }
    }

    public void update(String syntax, String details, TaskType type, Long contextId, LocalDateTime deadline) {
        this.syntax = syntax;
        this.details = details;
        this.type = type;
        this.contextId = contextId;
        this.deadline = deadline;
    }

    public enum TaskStatus {
        PENDING,
        EXECUTING,
        EXIT_SUCCESS,
        SIGKILL
    }

    public enum TaskType {
        TASK,
        SCHEDULE
    }
}
