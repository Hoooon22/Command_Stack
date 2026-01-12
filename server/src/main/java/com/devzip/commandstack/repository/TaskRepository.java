package com.devzip.commandstack.repository;

import com.devzip.commandstack.domain.Task;
import com.devzip.commandstack.domain.Task.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatusNot(TaskStatus status);

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByContextId(Long contextId);

    List<Task> findByContextIdAndStatusNot(Long contextId, TaskStatus status);

    List<Task> findByStatusOrderByDeadlineAsc(TaskStatus status);

    List<Task> findByStatusNotOrderByDeadlineAsc(TaskStatus status);
}
