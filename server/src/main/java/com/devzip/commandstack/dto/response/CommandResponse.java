package com.devzip.commandstack.dto.response;

import com.devzip.commandstack.domain.Command;
import com.devzip.commandstack.domain.Command.CommandStatus;
import com.devzip.commandstack.domain.Command.CommandType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Builder
public class CommandResponse {

    private Long id;
    private String syntax;
    private String details;
    private CommandStatus status;
    private CommandType type;
    private Long contextId;
    private LocalDateTime deadline;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public static CommandResponse from(Command command) {
        return CommandResponse.builder()
                .id(command.getId())
                .syntax(command.getSyntax())
                .details(command.getDetails())
                .status(command.getStatus())
                .type(command.getType())
                .contextId(command.getContextId())
                .deadline(command.getDeadline())
                .startedAt(command.getStartedAt())
                .completedAt(command.getCompletedAt())
                .build();
    }
}
