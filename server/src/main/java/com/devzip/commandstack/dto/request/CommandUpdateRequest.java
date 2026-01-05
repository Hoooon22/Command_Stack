package com.devzip.commandstack.dto.request;

import com.devzip.commandstack.domain.Command.CommandType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommandUpdateRequest {

    @NotBlank(message = "Command syntax is required")
    private String syntax;

    private String details;

    @NotNull(message = "Command type is required")
    private CommandType type;

    @NotNull(message = "Context ID is required")
    private Long contextId;

    private LocalDateTime deadline;
}
