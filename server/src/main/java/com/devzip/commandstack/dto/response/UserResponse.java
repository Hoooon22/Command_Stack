package com.devzip.commandstack.dto.response;

import com.devzip.commandstack.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String googleId;
    private String email;
    private String name;
    private String pictureUrl;
    private boolean hasCalendarAccess;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .googleId(user.getGoogleId())
                .email(user.getEmail())
                .name(user.getName())
                .pictureUrl(user.getPictureUrl())
                .hasCalendarAccess(user.getAccessToken() != null)
                .build();
    }
}
