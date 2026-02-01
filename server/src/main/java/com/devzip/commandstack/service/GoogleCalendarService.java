package com.devzip.commandstack.service;

import com.devzip.commandstack.domain.Context;
import com.devzip.commandstack.domain.Task;
import com.devzip.commandstack.domain.User;
import com.devzip.commandstack.dto.response.GoogleCalendarEventResponse;
import com.devzip.commandstack.repository.ContextRepository;
import com.devzip.commandstack.repository.TaskRepository;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.Events;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import lombok.RequiredArgsConstructor;

@Service
@Slf4j
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final TaskRepository taskRepository;
    private final ContextRepository contextRepository;
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    @Value("${google.calendar.application-name:CommandStack}")
    private String applicationName;

    /**
     * 사용자의 Access Token으로 Calendar 서비스 객체 생성
     */
    private Calendar getCalendarService(User user) throws GeneralSecurityException, IOException {
        HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

        // Access Token으로 credentials 생성
        AccessToken accessToken = new AccessToken(
                user.getAccessToken(),
                Date.from(user.getTokenExpiresAt().atZone(ZoneId.systemDefault()).toInstant()));
        GoogleCredentials credentials = GoogleCredentials.create(accessToken);

        return new Calendar.Builder(httpTransport, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                .setApplicationName(applicationName)
                .build();
    }

    /**
     * Task를 Google Calendar 이벤트로 생성
     */
    public String createEvent(User user, Task task) {
        try {
            Calendar service = getCalendarService(user);

            Event event = new Event()
                    .setSummary(task.getSyntax())
                    .setDescription(task.getDetails());

            // 시작 시간 설정 (startedAt이 있으면 사용, 없으면 deadline-1시간 또는 현재 시간)
            LocalDateTime startTime = task.getStartedAt() != null
                    ? task.getStartedAt()
                    : (task.getDeadline() != null ? task.getDeadline().minusHours(1) : LocalDateTime.now());
            LocalDateTime endTime = task.getDeadline() != null
                    ? task.getDeadline()
                    : (task.getStartedAt() != null ? task.getStartedAt().plusHours(1)
                            : LocalDateTime.now().plusHours(1));

            EventDateTime start = new EventDateTime()
                    .setDateTime(new com.google.api.client.util.DateTime(
                            Date.from(startTime.atZone(ZoneId.systemDefault()).toInstant())))
                    .setTimeZone("Asia/Seoul");

            EventDateTime end = new EventDateTime()
                    .setDateTime(new com.google.api.client.util.DateTime(
                            Date.from(endTime.atZone(ZoneId.systemDefault()).toInstant())))
                    .setTimeZone("Asia/Seoul");

            event.setStart(start);
            event.setEnd(end);

            Event createdEvent = service.events().insert("primary", event).execute();
            log.info("Created Google Calendar event: {}", createdEvent.getId());

            return createdEvent.getId();
        } catch (Exception e) {
            log.error("Failed to create Google Calendar event", e);
            return null;
        }
    }

    /**
     * Google Calendar 이벤트 업데이트
     */
    public void updateEvent(User user, Task task) {
        if (task.getGoogleEventId() == null) {
            log.warn("Task has no Google Event ID, skipping update");
            return;
        }

        try {
            Calendar service = getCalendarService(user);

            Event event = service.events().get("primary", task.getGoogleEventId()).execute();
            event.setSummary(task.getSyntax());
            event.setDescription(task.getDetails());

            if (task.getDeadline() != null || task.getStartedAt() != null) {
                LocalDateTime startTime = task.getStartedAt() != null
                        ? task.getStartedAt()
                        : (task.getDeadline() != null ? task.getDeadline().minusHours(1) : LocalDateTime.now());
                LocalDateTime endTime = task.getDeadline() != null
                        ? task.getDeadline()
                        : (task.getStartedAt() != null ? task.getStartedAt().plusHours(1)
                                : LocalDateTime.now().plusHours(1));

                EventDateTime start = new EventDateTime()
                        .setDateTime(new com.google.api.client.util.DateTime(
                                Date.from(startTime.atZone(ZoneId.systemDefault()).toInstant())))
                        .setTimeZone("Asia/Seoul");

                EventDateTime end = new EventDateTime()
                        .setDateTime(new com.google.api.client.util.DateTime(
                                Date.from(endTime.atZone(ZoneId.systemDefault()).toInstant())))
                        .setTimeZone("Asia/Seoul");

                event.setStart(start);
                event.setEnd(end);
            }

            service.events().update("primary", task.getGoogleEventId(), event).execute();
            log.info("Updated Google Calendar event: {}", task.getGoogleEventId());
        } catch (Exception e) {
            log.error("Failed to update Google Calendar event", e);
        }
    }

    /**
     * Google Calendar 이벤트 삭제
     */
    public void deleteEvent(User user, String eventId) {
        if (eventId == null) {
            return;
        }

        try {
            Calendar service = getCalendarService(user);
            service.events().delete("primary", eventId).execute();
            log.info("Deleted Google Calendar event: {}", eventId);
        } catch (Exception e) {
            log.error("Failed to delete Google Calendar event", e);
        }
    }

    /**
     * Google Calendar 이벤트 목록 조회
     */
    public List<GoogleCalendarEventResponse> getEvents(User user, LocalDateTime start, LocalDateTime end) {
        List<GoogleCalendarEventResponse> result = new ArrayList<>();

        try {
            Calendar service = getCalendarService(user);

            com.google.api.client.util.DateTime timeMin = new com.google.api.client.util.DateTime(
                    Date.from(start.atZone(ZoneId.systemDefault()).toInstant()));
            com.google.api.client.util.DateTime timeMax = new com.google.api.client.util.DateTime(
                    Date.from(end.atZone(ZoneId.systemDefault()).toInstant()));

            Events events = service.events().list("primary")
                    .setTimeMin(timeMin)
                    .setTimeMax(timeMax)
                    .setOrderBy("startTime")
                    .setSingleEvents(true)
                    .setMaxResults(100)
                    .execute();

            List<Event> items = events.getItems();
            if (items != null) {
                for (Event event : items) {
                    boolean isAllDay = event.getStart().getDate() != null;

                    String startStr = isAllDay
                            ? event.getStart().getDate().toString()
                            : event.getStart().getDateTime().toString();
                    String endStr = isAllDay
                            ? event.getEnd().getDate().toString()
                            : event.getEnd().getDateTime().toString();

                    result.add(GoogleCalendarEventResponse.builder()
                            .id(event.getId())
                            .summary(event.getSummary())
                            .description(event.getDescription())
                            .start(startStr)
                            .end(endStr)
                            .htmlLink(event.getHtmlLink())
                            .isAllDay(isAllDay)
                            .build());
                }
            }

            log.info("Retrieved {} events from Google Calendar", result.size());
        } catch (Exception e) {
            log.error("Failed to get Google Calendar events", e);
        }

        return result;
    }

    /**
     * Google Calendar 이벤트를 Task로 동기화 (Google -> DB)
     */
    @Transactional
    public void syncEventsFromGoogle(User user) {
        // 1. "Google" Context 확인 및 생성
        Context googleContext = contextRepository.findByNamespace(Context.NAMESPACE_GOOGLE)
                .orElseGet(() -> {
                    Context ctx = Context.builder()
                            .namespace(Context.NAMESPACE_GOOGLE)
                            .description("Synced from Google Calendar")
                            .color("#4285F4") // Google Blue
                            .build();
                    return contextRepository.save(ctx);
                });

        // 2. 동기화 범위 설정 (예: 1주일 전 ~ 3개월 후)
        LocalDateTime start = LocalDateTime.now().minusWeeks(1);
        LocalDateTime end = LocalDateTime.now().plusMonths(3);
        List<GoogleCalendarEventResponse> events = getEvents(user, start, end);

        // 3. Task로 저장 또는 업데이트
        for (GoogleCalendarEventResponse event : events) {
            taskRepository.findByGoogleEventId(event.getId())
                    .ifPresentOrElse(task -> {
                        // 기존 Task 업데이트
                        LocalDateTime deadline = parseDateTime(event.getEnd());
                        LocalDateTime startedAt = parseDateTime(event.getStart());

                        task.update(
                                event.getSummary(),
                                event.getDescription(),
                                Task.TaskType.SCHEDULE,
                                task.getContextId(), // 기존 컨텍스트 유지
                                startedAt,
                                deadline,
                                true // syncToGoogle 유지
                        );

                    }, () -> {
                        // 새 Task 생성
                        LocalDateTime deadline = parseDateTime(event.getEnd());
                        LocalDateTime startedAt = parseDateTime(event.getStart());

                        Task newTask = Task.builder()
                                .syntax(event.getSummary())
                                .details(event.getDescription())
                                .status(Task.TaskStatus.PENDING) // 혹은 SCHEDULE용 상태가 있다면?
                                .type(Task.TaskType.SCHEDULE)
                                .contextId(googleContext.getId())
                                .deadline(deadline)
                                .startedAt(startedAt)
                                .googleEventId(event.getId())
                                .syncToGoogle(true)
                                .userId(user.getId())
                                .build();
                        taskRepository.save(newTask);
                    });
        }
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null)
            return null;
        // 구글 캘린더 API 응답은 ISO 포맷 (yyyy-MM-dd'T'HH:mm:ss.SSS or yyyy-MM-dd)
        // DateTimeFormatter.ISO_DATE_TIME 등으로 파싱 시도
        // 날짜만 있는 경우 (All day) 처리 필요
        try {
            if (dateTimeStr.length() <= 10) { // yyyy-MM-dd
                return java.time.LocalDate.parse(dateTimeStr).atStartOfDay();
            }
            return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            log.error("Failed to parse date: {}", dateTimeStr, e);
            return LocalDateTime.now();
        }
    }
}
