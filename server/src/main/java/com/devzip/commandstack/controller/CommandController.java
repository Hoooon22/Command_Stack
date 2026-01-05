package com.devzip.commandstack.controller;

import com.devzip.commandstack.dto.request.CommandCreateRequest;
import com.devzip.commandstack.dto.request.CommandUpdateRequest;
import com.devzip.commandstack.dto.request.StatusUpdateRequest;
import com.devzip.commandstack.dto.response.CommandResponse;
import com.devzip.commandstack.service.CommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/commands")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommandController {

    private final CommandService commandService;

    @PostMapping
    public ResponseEntity<CommandResponse> createCommand(@Valid @RequestBody CommandCreateRequest request) {
        CommandResponse response = commandService.createCommand(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CommandResponse>> getAllCommands(
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) Long contextId) {

        List<CommandResponse> commands;

        if (contextId != null) {
            commands = commandService.getCommandsByContext(contextId);
        } else if ("active".equals(filter)) {
            commands = commandService.getActiveCommands();
        } else if ("archived".equals(filter)) {
            commands = commandService.getArchivedCommands();
        } else {
            commands = commandService.getAllCommands();
        }

        return ResponseEntity.ok(commands);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommandResponse> getCommandById(@PathVariable Long id) {
        CommandResponse response = commandService.getCommandById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommandResponse> updateCommand(
            @PathVariable Long id,
            @Valid @RequestBody CommandUpdateRequest request) {
        CommandResponse response = commandService.updateCommand(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CommandResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        CommandResponse response = commandService.updateStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCommand(@PathVariable Long id) {
        commandService.deleteCommand(id);
        return ResponseEntity.noContent().build();
    }
}
