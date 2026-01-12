package com.devzip.commandstack.dto.response;

import com.devzip.commandstack.domain.Context;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class ContextResponse {

    private Long id;
    private String namespace;
    private String description;
    private String color;

    public static ContextResponse from(Context context) {
        return ContextResponse.builder()
                .id(context.getId())
                .namespace(context.getNamespace())
                .description(context.getDescription())
                .color(context.getColor())
                .build();
    }
}
