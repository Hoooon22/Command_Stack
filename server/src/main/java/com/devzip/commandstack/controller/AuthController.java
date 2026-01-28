package com.devzip.commandstack.controller;

import com.devzip.commandstack.domain.User;
import com.devzip.commandstack.dto.response.UserResponse;
import com.devzip.commandstack.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * OAuth2 로그인 성공 후 리다이렉트
     */
    @org.springframework.beans.factory.annotation.Value("${app.auth.redirect-url}")
    private String redirectUrl;

    /**
     * OAuth2 로그인 성공 후 리다이렉트
     */
    @GetMapping("/success")
    public void loginSuccess(OAuth2AuthenticationToken authentication,
            HttpServletResponse response) throws IOException {
        log.info("OAuth2 login success for user: {}", authentication.getName());

        // 사용자 정보 저장/업데이트
        User user = authService.processOAuth2Login(authentication);
        log.info("User saved/updated: {}", user.getEmail());

        // 프론트엔드로 리다이렉트
        response.sendRedirect(redirectUrl);
    }

    /**
     * OAuth2 로그인 실패
     */
    @GetMapping("/failure")
    public void loginFailure(HttpServletResponse response) throws IOException {
        log.error("OAuth2 login failed");
        response.sendRedirect("http://localhost:5173?login=failure");
    }

    /**
     * 현재 로그인한 사용자 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        return authService.getCurrentUser()
                .map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElse(ResponseEntity.ok().body(null));
    }

    /**
     * 인증 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAuthStatus() {
        boolean isAuthenticated = authService.isAuthenticated();
        return ResponseEntity.ok(Map.of(
                "authenticated", isAuthenticated,
                "user", authService.getCurrentUser()
                        .map(UserResponse::from)
                        .orElse(null)));
    }

    /**
     * 로그아웃 성공
     */
    @GetMapping("/logout-success")
    public ResponseEntity<Map<String, String>> logoutSuccess() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    /**
     * Google OAuth 로그인 URL 반환 (프론트엔드에서 사용)
     */
    @GetMapping("/google/url")
    public ResponseEntity<Map<String, String>> getGoogleLoginUrl() {
        // Spring Security가 자동으로 처리하는 URL
        String loginUrl = "/oauth2/authorization/google";
        return ResponseEntity.ok(Map.of("url", loginUrl));
    }
}
