package com.devzip.commandstack.controller;

import com.devzip.commandstack.domain.User;
import com.devzip.commandstack.dto.response.UserResponse;
import com.devzip.commandstack.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
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
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        log.info("OAuth2 login success for user: {}", authentication.getName());

        // 사용자 정보 저장/업데이트
        User user = authService.processOAuth2Login(authentication);
        log.info("User saved/updated: {}", user.getEmail());

        // 세션 전송을 위한 1회용 토큰 생성
        String oneTimeToken = authService.createOneTimeToken(authentication);

        // 세션에서 source 확인 (web 또는 app)
        String source = (String) request.getSession().getAttribute("oauth_source");
        log.info("OAuth source: {}", source);

        if ("web".equals(source)) {
            // 웹 브라우저: 웹 페이지로 리다이렉트 (해시 라우팅 사용)
            String webRedirectUrl = "http://localhost:5173#/auth/callback?token=" + oneTimeToken;
            log.info("Redirecting to web: {}", webRedirectUrl);
            response.sendRedirect(webRedirectUrl);
        } else {
            // Electron 앱: 중간 HTML 페이지로 딥링크 실행
            // HTTP 302 리다이렉트 대신 JavaScript로 딥링크를 열어야 브라우저가 멈추지 않음
            String deepLink = "commandstack://auth-success?token=" + oneTimeToken;
            log.info("Opening deep link via JavaScript: {}", deepLink);

            response.setContentType("text/html;charset=UTF-8");
            String html = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Redirecting to CommandStack...</title>
                        <style>
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                background-color: #1e1e1e;
                                color: #00ff00;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                text-align: center;
                            }
                            .container { max-width: 400px; }
                            h1 { font-size: 24px; margin-bottom: 20px; }
                            p { color: #888; margin-bottom: 20px; }
                            .spinner {
                                border: 3px solid #333;
                                border-top: 3px solid #00ff00;
                                border-radius: 50%%;
                                width: 40px;
                                height: 40px;
                                animation: spin 1s linear infinite;
                                margin: 0 auto 20px;
                            }
                            @keyframes spin {
                                0%% { transform: rotate(0deg); }
                                100%% { transform: rotate(360deg); }
                            }
                            a {
                                color: #00ff00;
                                text-decoration: underline;
                                cursor: pointer;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="spinner"></div>
                            <h1>$ AUTHENTICATING...</h1>
                            <p>Redirecting to CommandStack app</p>
                            <p><a href="%s" id="deeplink">Click here if not redirected</a></p>
                        </div>
                        <script>
                            // 자동으로 딥링크 실행
                            window.location.href = "%s";

                            // 3초 후에도 이 페이지가 보이면 안내 메시지 표시
                            setTimeout(function() {
                                document.querySelector('h1').innerText = '$ APP OPENED';
                                document.querySelector('p').innerText = 'You can close this tab.';
                            }, 2000);
                        </script>
                    </body>
                    </html>
                    """.formatted(deepLink, deepLink);

            response.getWriter().write(html);
        }
    }

    /**
     * 1회용 토큰을 세션으로 교환
     */
    @PostMapping("/exchange")
    public ResponseEntity<?> exchangeToken(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        org.springframework.security.core.Authentication auth = authService.exchangeToken(token);

        if (auth != null) {
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
            return ResponseEntity.ok(Map.of("status", "success"));
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
        }
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
