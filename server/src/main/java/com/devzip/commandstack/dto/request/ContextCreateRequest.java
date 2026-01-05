package com.devzip.commandstack.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ContextCreateRequest {

    @NotBlank(message = "Namespace is required")
    private String namespace;

    private String description;
}
