package com.festival.waiting.dto;

import com.festival.waiting.domain.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRegisterRequest {
    private String username;
    private String password;
    private String name;
    private String phoneNumber;
    private User.Role role;
}
