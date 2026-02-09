package com.devzip.commandstack.service;

import com.devzip.commandstack.domain.User;
import com.devzip.commandstack.repository.UserRepository;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

/**
 * Google OAuth2 Access Token 자동 갱신 서비스
 * Refresh Token을 사용하여 만료된 Access Token을 갱신합니다.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TokenRefreshService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    /**
     * 토큰이 만료되었거나 곧 만료될 예정이면 갱신
     * 만료 5분 전부터 갱신을 시도합니다.
     */
    @Transactional
    public User refreshTokenIfNeeded(User user) {
        if (user == null) {
            return null;
        }

        // 토큰 만료 5분 전부터 갱신
        LocalDateTime refreshThreshold = LocalDateTime.now().plusMinutes(5);

        if (user.getTokenExpiresAt() != null &&
                user.getTokenExpiresAt().isBefore(refreshThreshold)) {

            log.info("Access token expired or expiring soon for user: {}, refreshing...", user.getEmail());
            return refreshAccessToken(user);
        }

        return user;
    }

    /**
     * Refresh Token을 사용하여 새 Access Token을 발급받습니다.
     */
    @Transactional
    public User refreshAccessToken(User user) {
        if (user.getRefreshToken() == null) {
            log.warn("No refresh token available for user: {}", user.getEmail());
            return user;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("client_id", clientId);
            params.add("client_secret", clientSecret);
            params.add("refresh_token", user.getRefreshToken());
            params.add("grant_type", "refresh_token");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    TOKEN_ENDPOINT, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonObject jsonResponse = new Gson().fromJson(response.getBody(), JsonObject.class);

                String newAccessToken = jsonResponse.get("access_token").getAsString();
                int expiresIn = jsonResponse.get("expires_in").getAsInt();
                LocalDateTime newExpiresAt = LocalDateTime.now().plusSeconds(expiresIn);

                // 새 refresh token이 있으면 업데이트 (optional, Google은 보통 반환하지 않음)
                String newRefreshToken = user.getRefreshToken();
                if (jsonResponse.has("refresh_token")) {
                    newRefreshToken = jsonResponse.get("refresh_token").getAsString();
                }

                user.updateTokens(newAccessToken, newRefreshToken, newExpiresAt);
                User savedUser = userRepository.save(user);

                log.info("Successfully refreshed access token for user: {}, expires at: {}",
                        user.getEmail(), newExpiresAt);

                return savedUser;
            } else {
                log.error("Failed to refresh token, status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to refresh access token for user: {}", user.getEmail(), e);
        }

        return user;
    }
}
