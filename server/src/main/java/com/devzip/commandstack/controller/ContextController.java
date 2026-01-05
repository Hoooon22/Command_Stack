package com.devzip.commandstack.controller;

import com.devzip.commandstack.dto.request.ContextCreateRequest;
import com.devzip.commandstack.dto.response.ContextResponse;
import com.devzip.commandstack.service.ContextService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contexts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContextController {

    private final ContextService contextService;

    @PostMapping
    public ResponseEntity<ContextResponse> createContext(@Valid @RequestBody ContextCreateRequest request) {
        ContextResponse response = contextService.createContext(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ContextResponse>> getAllContexts() {
        List<ContextResponse> contexts = contextService.getAllContexts();
        return ResponseEntity.ok(contexts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContextResponse> getContextById(@PathVariable Long id) {
        ContextResponse response = contextService.getContextById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContextResponse> updateContext(
            @PathVariable Long id,
            @Valid @RequestBody ContextCreateRequest request) {
        ContextResponse response = contextService.updateContext(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContext(@PathVariable Long id) {
        contextService.deleteContext(id);
        return ResponseEntity.noContent().build();
    }
}
