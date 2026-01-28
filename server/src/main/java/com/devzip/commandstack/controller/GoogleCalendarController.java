package com.devzip.commandstack.controller;

import com.devzip.commandstack.dto.response.GoogleCalendarEventResponse;
import com.devzip.commandstack.service.AuthService;
import com.devzip.commandstack.service.GoogleCalendarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarController {

    private final GoogleCalendarService googleCalendarService;
    private final AuthService authService;

    /**
     * Google Calendar 이벤트 조회
     */
    @GetMapping("/events")
    public ResponseEntity<?> getEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        return authService.getCurrentUser()
                .map(user -> {
                    List<GoogleCalendarEventResponse> events = googleCalendarService.getEvents(user, start, end);
                    return ResponseEntity.ok((Object) events);
                })
                .orElseGet(() -> ResponseEntity.status(401).body(
                        Map.of("error", "Not authenticated")));
    }

    /**
     * 수동 동기화 트리거
     */
    @PostMapping("/sync")
    public ResponseEntity<Map<String, String>> syncCalendar() {
        return authService.getCurrentUser()
                .map(user -> {
                    googleCalendarService.syncEventsFromGoogle(user);
                    log.info("Manual sync completed for user: {}", user.getEmail());
                    return ResponseEntity.ok(Map.of("message", "Sync completed"));
                })
                .orElse(ResponseEntity.status(401).body(
                        Map.of("error", "Not authenticated")));
    }
}
