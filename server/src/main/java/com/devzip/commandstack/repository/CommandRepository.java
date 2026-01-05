package com.devzip.commandstack.repository;

import com.devzip.commandstack.domain.Command;
import com.devzip.commandstack.domain.Command.CommandStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommandRepository extends JpaRepository<Command, Long> {

    List<Command> findByStatusNot(CommandStatus status);

    List<Command> findByStatus(CommandStatus status);

    List<Command> findByContextId(Long contextId);

    List<Command> findByContextIdAndStatusNot(Long contextId, CommandStatus status);

    List<Command> findByStatusOrderByDeadlineAsc(CommandStatus status);

    List<Command> findByStatusNotOrderByDeadlineAsc(CommandStatus status);
}
