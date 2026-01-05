package com.devzip.commandstack.service;

import com.devzip.commandstack.domain.Command;
import com.devzip.commandstack.domain.Command.CommandStatus;
import com.devzip.commandstack.dto.request.CommandCreateRequest;
import com.devzip.commandstack.dto.request.CommandUpdateRequest;
import com.devzip.commandstack.dto.request.StatusUpdateRequest;
import com.devzip.commandstack.dto.response.CommandResponse;
import com.devzip.commandstack.repository.CommandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommandService {

    private final CommandRepository commandRepository;

    @Transactional
    public CommandResponse createCommand(CommandCreateRequest request) {
        Command command = Command.builder()
                .syntax(request.getSyntax())
                .details(request.getDetails() != null ? request.getDetails() : "No additional details provided.")
                .status(CommandStatus.PENDING)
                .type(request.getType())
                .contextId(request.getContextId())
                .deadline(request.getDeadline())
                .build();

        Command savedCommand = commandRepository.save(command);
        return CommandResponse.from(savedCommand);
    }

    public List<CommandResponse> getAllCommands() {
        return commandRepository.findAll().stream()
                .map(CommandResponse::from)
                .collect(Collectors.toList());
    }

    public List<CommandResponse> getActiveCommands() {
        return commandRepository.findByStatusNot(CommandStatus.EXIT_SUCCESS).stream()
                .map(CommandResponse::from)
                .collect(Collectors.toList());
    }

    public List<CommandResponse> getArchivedCommands() {
        return commandRepository.findByStatus(CommandStatus.EXIT_SUCCESS).stream()
                .map(CommandResponse::from)
                .collect(Collectors.toList());
    }

    public List<CommandResponse> getCommandsByContext(Long contextId) {
        return commandRepository.findByContextId(contextId).stream()
                .map(CommandResponse::from)
                .collect(Collectors.toList());
    }

    public CommandResponse getCommandById(Long id) {
        Command command = commandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Command not found with id: " + id));
        return CommandResponse.from(command);
    }

    @Transactional
    public CommandResponse updateCommand(Long id, CommandUpdateRequest request) {
        Command command = commandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Command not found with id: " + id));

        command.update(
                request.getSyntax(),
                request.getDetails(),
                request.getType(),
                request.getContextId(),
                request.getDeadline()
        );

        return CommandResponse.from(command);
    }

    @Transactional
    public CommandResponse updateStatus(Long id, StatusUpdateRequest request) {
        Command command = commandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Command not found with id: " + id));

        command.updateStatus(request.getStatus());

        return CommandResponse.from(command);
    }

    @Transactional
    public void deleteCommand(Long id) {
        if (!commandRepository.existsById(id)) {
            throw new IllegalArgumentException("Command not found with id: " + id);
        }
        commandRepository.deleteById(id);
    }
}
