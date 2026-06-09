package com.festival.waiting.controller;

import com.festival.waiting.domain.User;
import com.festival.waiting.dto.CustomerTokenRequest;
import com.festival.waiting.dto.TokenResponse;
import com.festival.waiting.dto.UserLoginRequest;
import com.festival.waiting.dto.UserRegisterRequest;
import com.festival.waiting.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "인증 API", description = "주최자, 상인의 회원가입/로그인 및 손님의 무가입 번호 인증 토큰 발급을 지원합니다.")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Operation(summary = "주최자 및 상인 회원가입", description = "주최자(ROLE_ORGANIZER) 또는 상인(ROLE_MERCHANT)으로 신규 회원 가입합니다. 가입 후 승인 대기 상태가 됩니다.")
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody UserRegisterRequest request) {
        User user = userService.registerUser(
                request.getUsername(),
                request.getPassword(),
                request.getName(),
                request.getPhoneNumber(),
                request.getRole()
        );
        return ResponseEntity.ok(user.getName() + "님 회원가입이 완료되었습니다. (최상위 운영자/주최자의 최종 승인을 기다려주세요.)");
    }

    @Operation(summary = "로그인 (토큰 발급)", description = "어드민, 주최자, 상인의 아이디/비밀번호 로그인을 진행하고 JWT 토큰을 발급합니다.")
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody UserLoginRequest request) {
        String token = userService.loginUser(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(new TokenResponse(token));
    }

    @Operation(summary = "손님 무가입 번호인증 (토큰 발급)", description = "손님이 휴대폰 번호를 전송하여 가입 없이 24시간 동안 유지되는 축제용 JWT 토큰을 발급받습니다.")
    @PostMapping("/customer-token")
    public ResponseEntity<TokenResponse> getCustomerToken(@RequestBody CustomerTokenRequest request) {
        String token = userService.getOrCreateCustomerToken(request.getPhoneNumber(), request.getFestivalId());
        return ResponseEntity.ok(new TokenResponse(token));
    }
}
