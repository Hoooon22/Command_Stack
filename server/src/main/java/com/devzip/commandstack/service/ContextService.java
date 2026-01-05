package com.devzip.commandstack.service;

import com.devzip.commandstack.domain.Context;
import com.devzip.commandstack.dto.request.ContextCreateRequest;
import com.devzip.commandstack.dto.response.ContextResponse;
import com.devzip.commandstack.repository.ContextRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContextService {

    private final ContextRepository contextRepository;

    @Transactional
    public ContextResponse createContext(ContextCreateRequest request) {
        if (contextRepository.existsByNamespace(request.getNamespace())) {
            throw new IllegalArgumentException("Context already exists with namespace: " + request.getNamespace());
        }

        Context context = Context.builder()
                .namespace(request.getNamespace())
                .description(request.getDescription())
                .build();

        Context savedContext = contextRepository.save(context);
        return ContextResponse.from(savedContext);
    }

    public List<ContextResponse> getAllContexts() {
        return contextRepository.findAll().stream()
                .map(ContextResponse::from)
                .collect(Collectors.toList());
    }

    public ContextResponse getContextById(Long id) {
        Context context = contextRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Context not found with id: " + id));
        return ContextResponse.from(context);
    }

    @Transactional
    public ContextResponse updateContext(Long id, ContextCreateRequest request) {
        Context context = contextRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Context not found with id: " + id));

        context.update(request.getNamespace(), request.getDescription());

        return ContextResponse.from(context);
    }

    @Transactional
    public void deleteContext(Long id) {
        if (!contextRepository.existsById(id)) {
            throw new IllegalArgumentException("Context not found with id: " + id);
        }
        contextRepository.deleteById(id);
    }
}
