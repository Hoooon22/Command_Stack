package com.devzip.commandstack.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

/**
 * OAuth2 인증 요청 시 source 파라미터를 세션에 저장하는 커스텀 리졸버
 * source=web: 웹 브라우저에서 로그인
 * source=app: Electron 앱에서 로그인
 */
public class CustomAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;

    public CustomAuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest authRequest = defaultResolver.resolve(request);
        return processAuthRequest(request, authRequest);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest authRequest = defaultResolver.resolve(request, clientRegistrationId);
        return processAuthRequest(request, authRequest);
    }

    private OAuth2AuthorizationRequest processAuthRequest(HttpServletRequest request,
            OAuth2AuthorizationRequest authRequest) {
        if (authRequest == null) {
            return null;
        }

        // source 파라미터를 세션에 저장 (web 또는 app)
        String source = request.getParameter("source");
        if (source != null) {
            request.getSession().setAttribute("oauth_source", source);
        } else {
            // 기본값은 web
            request.getSession().setAttribute("oauth_source", "web");
        }

        return authRequest;
    }
}
