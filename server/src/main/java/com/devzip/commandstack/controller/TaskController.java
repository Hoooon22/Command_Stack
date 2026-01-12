package com.devzip.commandstack.controller;

import com.devzip.commandstack.dto.request.TaskCreateRequest;
import com.devzip.commandstack.dto.request.TaskUpdateRequest;
import com.devzip.commandstack.dto.request.StatusUpdateRequest;
import com.devzip.commandstack.dto.response.TaskResponse;
import com.devzip.commandstack.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskCreateRequest request) {
        TaskResponse response = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks(
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) Long contextId) {

        List<TaskResponse> commands;

        if (contextId != null) {
            commands = taskService.getTasksByContext(contextId);
        } else if ("active".equals(filter)) {
            commands = taskService.getActiveTasks();
        } else if ("archived".equals(filter)) {
            commands = taskService.getArchivedTasks();
        } else {
            commands = taskService.getAllTasks();
        }

        return ResponseEntity.ok(commands);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long id) {
        TaskResponse response = taskService.getTaskById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskUpdateRequest request) {
        TaskResponse response = taskService.updateTask(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        TaskResponse response = taskService.updateStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
