package com.festival.waiting.controller;

import com.festival.waiting.domain.Festival;
import com.festival.waiting.domain.User;
import com.festival.waiting.dto.FestivalRegisterRequest;
import com.festival.waiting.service.FestivalService;
import com.festival.waiting.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "[주최측] 관리 API", description = "승인 완료된 주최자(ROLE_ORGANIZER) 전용이며, 축제 개최 및 입점 신청 상인(ROLE_MERCHANT) 승인을 처리합니다.")
@RestController
@RequestMapping("/api/organizer")
@RequiredArgsConstructor
public class OrganizerController {

    private final FestivalService festivalService;
    private final UserService userService;

    @Operation(summary = "축제 개최 등록", description = "주최측 권한으로 신규 축제를 시스템에 등록합니다.")
    @PostMapping("/festivals")
    public ResponseEntity<Map<String, Object>> createFestival(
            @RequestBody FestivalRegisterRequest request,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal
    ) {
        Festival festival = festivalService.createFestival(
                request.getName(),
                request.getDescription(),
                request.getLocation(),
                request.getStartDate(),
                request.getEndDate(),
                principal.getUsername()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("festivalId", festival.getId());
        response.put("name", festival.getName());
        response.put("location", festival.getLocation());
        response.put("startDate", festival.getStartDate().toString());
        response.put("endDate", festival.getEndDate().toString());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "입점 신청 상인 목록 조회", description = "승인이 나지 않은 가입 상인(ROLE_MERCHANT) 목록을 구합니다.")
    @GetMapping("/merchants/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingMerchants() {
        List<User> merchants = userService.getPendingMerchants();
        List<Map<String, Object>> result = merchants.stream().map(u -> {
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

    @Operation(summary = "입점 상인 승인 처리", description = "주최측이 상인 계정을 승인 처리(isApproved = true)하여 해당 상인이 부스/메뉴판 관리가 가능하게 허용합니다.")
    @PostMapping("/merchants/{merchantId}/approve")
    public ResponseEntity<String> approveMerchant(@PathVariable("merchantId") Long merchantId) {
        userService.approveMerchant(merchantId);
        return ResponseEntity.ok("상인 계정이 승인되었습니다. ID: " + merchantId);
    }
}
