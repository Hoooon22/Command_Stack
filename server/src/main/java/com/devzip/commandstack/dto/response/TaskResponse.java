package com.devzip.commandstack.dto.response;

import com.devzip.commandstack.domain.Task;
import com.devzip.commandstack.domain.Task.TaskStatus;
import com.devzip.commandstack.domain.Task.TaskType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Builder
public class TaskResponse {

    private Long id;
    private String syntax;
    private String details;
    private TaskStatus status;
    private TaskType type;
    private Long contextId;
    private LocalDateTime deadline;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public static TaskResponse from(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .syntax(task.getSyntax())
                .details(task.getDetails())
                .status(task.getStatus())
                .type(task.getType())
                .contextId(task.getContextId())
                .deadline(task.getDeadline())
                .startedAt(task.getStartedAt())
                .completedAt(task.getCompletedAt())
                .build();
    }
}
