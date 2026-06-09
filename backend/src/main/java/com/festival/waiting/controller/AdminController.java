package com.festival.waiting.controller;

import com.festival.waiting.domain.User;
import com.festival.waiting.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "[최상위 운영자] 관리 API", description = "시스템 어드민(ROLE_ADMIN) 전용이며, 신규 주최측(ROLE_ORGANIZER)의 승인을 처리합니다.")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    @Operation(summary = "승인 대기 중인 주최측 계정 목록 조회", description = "승인이 나지 않은 가입 주최측(ROLE_ORGANIZER) 목록을 구합니다.")
    @GetMapping("/organizers/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingOrganizers() {
        List<User> organizers = userService.getPendingOrganizers();
        List<Map<String, Object>> result = organizers.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("name", u.getName());
            map.put("phoneNumber", u.getPhoneNumber());
            map.put("role", u.getRole());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "주최측 계정 승인 처리", description = "최상위 운영자가 특정 주최측 계정을 승인 처리(isApproved = true)하여 축제 등록이 가능하게 합니다.")
    @PostMapping("/organizers/{organizerId}/approve")
    public ResponseEntity<String> approveOrganizer(@PathVariable("organizerId") Long organizerId) {
        userService.approveOrganizer(organizerId);
        return ResponseEntity.ok("주최자 계정이 승인되었습니다. ID: " + organizerId);
    }
}
