package com.devzip.commandstack.dto.request;

import com.devzip.commandstack.domain.Task.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TaskUpdateRequest {

    @NotBlank(message = "Command syntax is required")
    private String syntax;

    private String details;

    @NotNull(message = "Command type is required")
    private TaskType type;

    @NotNull(message = "Context ID is required")
    private Long contextId;

    private LocalDateTime deadline;

    private boolean syncToGoogle = false;
}
