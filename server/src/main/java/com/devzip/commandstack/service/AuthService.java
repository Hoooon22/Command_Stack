package com.devzip.commandstack.service;

import com.devzip.commandstack.domain.User;
import com.devzip.commandstack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OAuth2AuthorizedClientService authorizedClientService;

    @Transactional
    public User processOAuth2Login(OAuth2AuthenticationToken authentication) {
        OAuth2User oauth2User = authentication.getPrincipal();
        Map<String, Object> attributes = oauth2User.getAttributes();

        String googleId = (String) attributes.get("sub");
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String pictureUrl = (String) attributes.get("picture");

        // 토큰 정보 가져오기
        OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                authentication.getAuthorizedClientRegistrationId(),
                authentication.getName());

        String tokenValue = null;
        String refreshTokenValue = null;
        LocalDateTime tokenExpiresAt = null;

        if (client != null) {
            tokenValue = client.getAccessToken().getTokenValue();
            if (client.getRefreshToken() != null) {
                refreshTokenValue = client.getRefreshToken().getTokenValue();
            }
            if (client.getAccessToken().getExpiresAt() != null) {
                tokenExpiresAt = LocalDateTime.ofInstant(
                        client.getAccessToken().getExpiresAt(),
                        java.time.ZoneId.systemDefault());
            }
        }

        final String accessToken = tokenValue;
        final String refreshToken = refreshTokenValue;
        final LocalDateTime expiresAt = tokenExpiresAt;

        // 기존 사용자 조회 또는 새로 생성
        User user = userRepository.findByGoogleId(googleId)
                .map(existingUser -> {
                    existingUser.setEmail(email);
                    existingUser.setName(name);
                    existingUser.setPictureUrl(pictureUrl);
                    existingUser.updateTokens(accessToken, refreshToken, expiresAt);
                    return existingUser;
                })
                .orElseGet(() -> User.builder()
                        .googleId(googleId)
                        .email(email)
                        .name(name)
                        .pictureUrl(pictureUrl)
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .tokenExpiresAt(expiresAt)
                        .build());

        return userRepository.save(user);
    }

    public Optional<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oauth2User = oauthToken.getPrincipal();
            String googleId = (String) oauth2User.getAttributes().get("sub");
            return userRepository.findByGoogleId(googleId);
        }

        return Optional.empty();
    }

    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.isAuthenticated()
                && authentication instanceof OAuth2AuthenticationToken;
    }

    private final Map<String, TokenInfo> oneTimeAuthTokens = new java.util.concurrent.ConcurrentHashMap<>();

    private record TokenInfo(Authentication authentication, LocalDateTime expiresAt) {
    }

    public String createOneTimeToken(Authentication authentication) {
        // Generate a random UUID token
        String token = java.util.UUID.randomUUID().toString();
        // Store it with 1 minute expiration
        oneTimeAuthTokens.put(token, new TokenInfo(authentication, LocalDateTime.now().plusMinutes(1)));

        // Clean up expired tokens lazily (optional, but good practice)
        oneTimeAuthTokens.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(LocalDateTime.now()));

        return token;
    }

    public Authentication exchangeToken(String token) {
        TokenInfo info = oneTimeAuthTokens.remove(token);

        if (info == null) {
            return null;
        }

        if (info.expiresAt().isBefore(LocalDateTime.now())) {
            return null;
        }

        return info.authentication();
    }
}
