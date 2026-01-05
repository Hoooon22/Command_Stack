package com.devzip.commandstack.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "commands")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Command {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String syntax;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommandStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommandType type;

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
            status = CommandStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void updateStatus(CommandStatus newStatus) {
        this.status = newStatus;

        if (newStatus == CommandStatus.EXECUTING && this.startedAt == null) {
            this.startedAt = LocalDateTime.now();
        }

        if ((newStatus == CommandStatus.EXIT_SUCCESS || newStatus == CommandStatus.SIGKILL)
            && this.completedAt == null) {
            this.completedAt = LocalDateTime.now();
        }
    }

    public void update(String syntax, String details, CommandType type, Long contextId, LocalDateTime deadline) {
        this.syntax = syntax;
        this.details = details;
        this.type = type;
        this.contextId = contextId;
        this.deadline = deadline;
    }

    public enum CommandStatus {
        PENDING,
        EXECUTING,
        EXIT_SUCCESS,
        SIGKILL
    }

    public enum CommandType {
        TASK,
        SCHEDULE
    }
}
