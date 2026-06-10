package com.festival.waiting.controller;

import com.festival.waiting.dto.AiCurationRequest;
import com.festival.waiting.dto.BoothDetailResponse;
import com.festival.waiting.service.AiCurationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(
    name = "AI 큐레이터 API", 
    description = "ennoia AI 엔진이 자연어 요구사항을 바탕으로 실시간 대기 현황과 특산물 정보를 결합하여 지능적으로 부스를 필터링하고 추천받을 수 있는 인터페이스를 제공합니다."
)
@RestController
@RequiredArgsConstructor
public class AiCurationController {

    private final AiCurationService aiCurationService;

    @Operation(
        summary = "[AI 에이전트 연동] 실시간 대기 정보를 반영한 부스 추천",
        description = "사용자의 자연어 질의(예: '사람이 적고 특산품이 들어간 메뉴를 먹고 싶어')를 받아 실시간 대기 수(currentWaitingCount)와 특산품 판매 여부(isSpecialty)를 기반으로 최적의 부스를 선별하여 추천 리스트를 정렬해 반환합니다."
    )
    @PostMapping("/api/ai/curate-booths")
    public ResponseEntity<List<BoothDetailResponse>> curateBooths(
            @RequestBody com.festival.waiting.dto.AiCurationRequest request
    ) {
        List<BoothDetailResponse> curatedList = aiCurationService.curateBooths(request);
        return ResponseEntity.ok(curatedList);
    }

    @Operation(
        summary = "[AI 에이전트 연동] 자연어 질의 기반 통합 큐레이션 조회",
        description = "프론트엔드 자연어 챗봇 질의(예: '양평 주변 쾌적한 관광단지 추천해줘')에 맞춤형 혼잡도 및 관광지 추천 데이터를 반환합니다."
    )
    @org.springframework.web.bind.annotation.GetMapping("/api/ai/curate")
    public ResponseEntity<com.festival.waiting.dto.AiCurationResponse> curateByQuery(
            @org.springframework.web.bind.annotation.RequestParam(value = "query", required = false) String query
    ) {
        String targetQuery = (query != null && !query.trim().isEmpty()) ? query : "";
        com.festival.waiting.dto.AiCurationResponse response = aiCurationService.curateByQuery(targetQuery);
        return ResponseEntity.ok(response);
    }
}
