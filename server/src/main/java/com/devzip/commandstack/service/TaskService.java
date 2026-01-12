package com.devzip.commandstack.service;

import com.devzip.commandstack.domain.Task;
import com.devzip.commandstack.domain.Task.TaskStatus;
import com.devzip.commandstack.dto.request.TaskCreateRequest;
import com.devzip.commandstack.dto.request.TaskUpdateRequest;
import com.devzip.commandstack.dto.request.StatusUpdateRequest;
import com.devzip.commandstack.dto.response.TaskResponse;
import com.devzip.commandstack.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;

    @Transactional
    public TaskResponse createTask(TaskCreateRequest request) {
        Task task = Task.builder()
                .syntax(request.getSyntax())
                .details(request.getDetails() != null ? request.getDetails() : "No additional details provided.")
                .status(TaskStatus.PENDING)
                .type(request.getType())
                .contextId(request.getContextId())
                .deadline(request.getDeadline())
                .build();

        Task savedTask = taskRepository.save(task);
        return TaskResponse.from(savedTask);
    }

    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getActiveTasks() {
        return taskRepository.findByStatusNot(TaskStatus.EXIT_SUCCESS).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getArchivedTasks() {
        return taskRepository.findByStatus(TaskStatus.EXIT_SUCCESS).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByContext(Long contextId) {
        return taskRepository.findByContextId(contextId).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id:" + id));
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id:" + id));

        task.update(
                request.getSyntax(),
                request.getDetails(),
                request.getType(),
                request.getContextId(),
                request.getDeadline()
        );

        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateStatus(Long id, StatusUpdateRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id:" + id));

        task.updateStatus(request.getStatus());

        return TaskResponse.from(task);
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new IllegalArgumentException("Task not found with id:" + id);
        }
        taskRepository.deleteById(id);
    }
}
