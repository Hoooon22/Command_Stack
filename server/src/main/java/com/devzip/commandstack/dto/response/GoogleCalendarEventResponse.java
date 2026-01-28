package com.devzip.commandstack.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleCalendarEventResponse {
    private String id;
    private String summary;
    private String description;
    private String start;
    private String end;
    private String htmlLink;
    private boolean isAllDay;
}
