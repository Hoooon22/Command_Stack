package com.devzip.commandstack.repository;

import com.devzip.commandstack.domain.Context;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContextRepository extends JpaRepository<Context, Long> {

    Optional<Context> findByNamespace(String namespace);

    boolean existsByNamespace(String namespace);
}
