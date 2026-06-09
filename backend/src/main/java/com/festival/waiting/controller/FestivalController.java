package com.festival.waiting.controller;

import com.festival.waiting.domain.Booth;
import com.festival.waiting.dto.BoothDetailResponse;
import com.festival.waiting.dto.BoothRegisterRequest;
import com.festival.waiting.dto.FestivalRecommendResponse;
import com.festival.waiting.dto.LocationRecommendRequest;
import com.festival.waiting.service.FestivalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Tag(
    name = "축제 및 부스 관리 API", 
    description = "현 위치 기반 축제 추천, 연계 관광지 목록 노출, 상인의 부스 등록 및 부스 목록과 대기열 실시간 확인 기능을 제공합니다."
)
@RestController
@RequiredArgsConstructor
public class FestivalController {

    private final FestivalService festivalService;

    @org.springframework.beans.factory.annotation.Value("${api.kakao.js-key:}")
    private String kakaoJsKey;

    @org.springframework.beans.factory.annotation.Value("${api.kakao.rest-api-key:}")
    private String kakaoRestApiKey;

    @Operation(summary = "카카오 JavaScript 키 조회", description = "프론트엔드 지도 렌더링에 필요한 카카오 JavaScript 키를 동적으로 제공합니다.")
    @GetMapping("/api/config/kakao-key")
    public ResponseEntity<java.util.Map<String, String>> getKakaoKey() {
        java.util.Map<String, String> result = new java.util.HashMap<>();
        result.put("kakaoJsKey", (kakaoJsKey == null || kakaoJsKey.isEmpty()) ? kakaoRestApiKey : kakaoJsKey);
        return ResponseEntity.ok(result);
    }

    @Operation(
        summary = "[사용자/공통] 위치 및 가용 시간 기반 축제 추천",
        description = "사용자의 위치(한글 주소 또는 위경도 좌표)와 가용 시간을 전달받아 조건 내 추천 축제 목록과 각 축제 주변의 연계 관광지 리스트를 한 번에 조회합니다."
    )
    @GetMapping("/api/festivals/recommend")
    public ResponseEntity<List<FestivalRecommendResponse>> recommendFestivals(
            @ModelAttribute LocationRecommendRequest request
    ) {
        List<FestivalRecommendResponse> result = festivalService.recommendFestivals(request);
        return ResponseEntity.ok(result);
    }

    @Operation(
        summary = "[상인] 부스 및 판매 상품(메뉴) 등록",
        description = "상인이 자신의 부스 이름, 입점 구역 위치 설명과 메뉴 명판(가격, 특산품 여부 및 사진 포함)을 등록하여 축제 도메인에 상점을 입점시킵니다. (승인받은 상인 토큰 필요)"
    )
    @PostMapping("/api/booths")
    public ResponseEntity<BoothDetailResponse> registerBooth(
            @RequestBody BoothRegisterRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.User principal
    ) {
        Booth booth = festivalService.registerBooth(request, principal.getUsername());
        return ResponseEntity.ok(BoothDetailResponse.from(booth));
    }

    @Operation(
        summary = "[상인] 부스 및 판매 상품(메뉴) 수정",
        description = "상인이 자신의 부스 정보와 판매 메뉴 리스트를 수정합니다. (본인 부스만 수정 가능)"
    )
    @PutMapping("/api/booths/{boothId}")
    public ResponseEntity<BoothDetailResponse> updateBooth(
            @PathVariable("boothId") Long boothId,
            @RequestBody BoothRegisterRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.User principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        Booth booth = festivalService.updateBooth(boothId, request, principal.getUsername());
        return ResponseEntity.ok(BoothDetailResponse.from(booth));
    }

    @Operation(
        summary = "[사용자] 특정 축제의 전체 부스 및 실시간 웨이팅 조회",
        description = "축제 고유 식별 ID(festivalId)에 등록된 모든 부스 정보, 메뉴판, 그리고 각 부스별 현재 실시간 대기 인원수(currentWaitingCount)를 한눈에 볼 수 있도록 반환합니다."
    )
    @GetMapping("/api/festivals/{festivalId}/booths")
    public ResponseEntity<List<BoothDetailResponse>> getBoothsByFestival(
            @Parameter(description = "부스 현황을 확인하려는 축제의 고유 식별 ID", example = "1")
            @PathVariable("festivalId") Long festivalId
    ) {
        List<Booth> booths = festivalService.getBoothsByFestival(festivalId);
        List<BoothDetailResponse> response = booths.stream()
                .map(BoothDetailResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @Operation(
        summary = "[사용자/QR진입] 특정 부스 상세 정보 조회",
        description = "부스 고유 식별 ID(boothId)로 부스 정보와 메뉴 목록, 실시간 대기 팀 수, 그리고 부스 상세 페이지 QR코드를 조회합니다."
    )
    @GetMapping("/api/booths/{boothId}")
    public ResponseEntity<BoothDetailResponse> getBoothDetail(
            @Parameter(description = "부스 고유 식별 ID", example = "1")
            @PathVariable("boothId") Long boothId
    ) {
        Booth booth = festivalService.getBoothDetail(boothId);
        return ResponseEntity.ok(BoothDetailResponse.from(booth));
    }

    @Operation(summary = "[테스트] 시스템 캐싱 전체 축제 목록 조회", description = "로컬 DB에 저장된 전체 축제 목록을 가볍게 조회합니다.")
    @GetMapping("/api/festivals")
    public ResponseEntity<List<java.util.Map<String, Object>>> getAllFestivals() {
        List<com.festival.waiting.domain.Festival> festivals = festivalService.getAllFestivals();
        List<java.util.Map<String, Object>> result = festivals.stream().map(f -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("festivalId", f.getId());
            map.put("name", f.getName());
            map.put("description", f.getDescription());
            map.put("location", f.getLocation());
            map.put("startDate", f.getStartDate().toString());
            map.put("endDate", f.getEndDate().toString());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "[테스트] 실시간 관광지 혼잡도 API 단독 진단", description = "특정 관광지 명칭을 넣어 오픈API를 단독 호출해 혼잡도와 밀집 등급을 진단합니다.")
    @GetMapping("/api/spots/congestion")
    public ResponseEntity<java.util.Map<String, Object>> getSpotCongestion(
            @Parameter(description = "혼잡도를 조회하려는 관광지 명칭 (예: 용문산)", example = "용문산")
            @RequestParam("spotName") String spotName
    ) {
        int rate = festivalService.getSpotCongestion(spotName);
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("spotName", spotName);
        result.put("congestionRate", rate);
        String level = "쾌적";
        if (rate >= 80) level = "혼잡";
        else if (rate >= 50) level = "보통";
        result.put("level", level);
        return ResponseEntity.ok(result);
    }
}
