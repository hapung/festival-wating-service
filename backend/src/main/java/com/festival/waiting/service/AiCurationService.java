package com.festival.waiting.service;

import com.festival.waiting.domain.Booth;
import com.festival.waiting.dto.AiCurationRequest;
import com.festival.waiting.dto.BoothDetailResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCurationService {

    private final FestivalService festivalService;

    /**
     * 사용자의 자연어 요구사항(질의)과 현장 부스의 실시간 대기열 정보를 분석하여 맞춤 부스를 큐레이션합니다.
     * ennoia AI 플랫폼의 Function Calling 백엔드 규격으로 연동됩니다.
     */
    @Transactional(readOnly = true)
    public List<BoothDetailResponse> curateBooths(AiCurationRequest request) {
        log.info("[AI 부스 큐레이션 실행] 축제 ID: {}, 질의어: '{}'", request.getFestivalId(), request.getUserMessage());

        // 1. 해당 축제의 등록 부스 전체 로드
        List<Booth> allBooths = festivalService.getBoothsByFestival(request.getFestivalId());

        String query = request.getUserMessage().toLowerCase();

        // 2. 키워드 및 대기 상태에 따른 지능형 필터링
        List<Booth> filteredBooths = allBooths.stream()
                .filter(booth -> {
                    // "사람 많은 건 싫어", "대기 적은", "한적한" 키워드 매칭
                    if (query.contains("사람 없는") || query.contains("사람 적은") || 
                        query.contains("대기 적은") || query.contains("대기 없는") || 
                        query.contains("사람 많은건 싫어") || query.contains("한적한")) {
                        
                        // 혼잡도가 높은 부스는 필터링 (대기 5팀 이상 부스는 배제)
                        if (booth.getCurrentWaitingCount() >= 5) {
                            return false;
                        }
                    }

                    // "특산품", "특산물", "로컬 푸드" 키워드 매칭
                    if (query.contains("특산품") || query.contains("특산물") || 
                        query.contains("로컬") || query.contains("향토")) {
                        
                        // 부스 상품 중 지역 특산물 속성(isSpecialty = true)이 최소 1개 이상 존재해야 함
                        boolean hasSpecialty = booth.getProducts().stream()
                                .anyMatch(p -> p.getIsSpecialty() != null && p.getIsSpecialty());
                        if (!hasSpecialty) {
                            return false;
                        }
                    }
                    
                    return true;
                })
                .collect(Collectors.toList());

        // 3. 큐레이션 가중치 정렬 적용
        if (query.contains("사람 없는") || query.contains("사람 적은") || 
            query.contains("대기 적은") || query.contains("대기 없는") || 
            query.contains("사람 많은건 싫어") || query.contains("한적한")) {
            // 대기 팀 수가 가장 적은 쾌적한 부스 순서로 오름차순 정렬
            filteredBooths.sort(Comparator.comparingInt(Booth::getCurrentWaitingCount));
        } else if (query.contains("인기") || query.contains("맛집") || query.contains("추천")) {
            // 대기 팀 수가 많은 핫플레이스 위주로 내림차순 정렬
            filteredBooths.sort((b1, b2) -> Integer.compare(b2.getCurrentWaitingCount(), b1.getCurrentWaitingCount()));
        }

        log.info("[AI 부스 큐레이션 완료] 매칭 부스 수: {}개 (전체: {}개)", filteredBooths.size(), allBooths.size());

        return filteredBooths.stream()
                .map(BoothDetailResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * [AI 에이전트 연동] 자연어 질의 기반 통합 큐레이션 서비스
     * 프론트엔드 AI 질의창의 'GET /api/ai/curate?query=...' 규격을 충족합니다.
     */
    @Transactional(readOnly = true)
    public com.festival.waiting.dto.AiCurationResponse curateByQuery(String query) {
        log.info("[AI 자연어 질의 큐레이션 실행] 쿼리: '{}'", query);

        String parsedLocation = "전국";
        String aiRecommendationReason = "요청하신 조건에 부합하는 쾌적한 관광지와 축제 인근 추천 정보입니다.";
        java.util.List<com.festival.waiting.dto.RecommendedSpotDto> recommendedSpots = new java.util.ArrayList<>();

        // 1. 간단한 자연어 파싱 키워드 매칭
        if (query.contains("양평") || query.contains("용문산")) {
            parsedLocation = "양평 용문산";
            aiRecommendationReason = "현재 양평 용문산 인근 관광지는 전반적으로 보통(45%) 수준의 혼잡도를 보이고 있어 이동하기에 쾌적합니다. 용문사와 들꽃수목원을 추천해 드립니다.";
            recommendedSpots.add(new com.festival.waiting.dto.RecommendedSpotDto("용문산 용문사", 45, "보통", 1.2));
            recommendedSpots.add(new com.festival.waiting.dto.RecommendedSpotDto("들꽃수목원", 20, "쾌적", 2.8));
        } else if (query.contains("강릉") || query.contains("단오")) {
            parsedLocation = "강원도 강릉";
            aiRecommendationReason = "강릉 지역 축제 인근 관광단지는 단오제 여파로 다소 혼잡한 편이지만, 해변 산책길 인근은 혼잡도가 보통(55%)으로 원활하게 접근 가능합니다.";
            recommendedSpots.add(new com.festival.waiting.dto.RecommendedSpotDto("강릉 경포대", 55, "보통", 1.5));
            recommendedSpots.add(new com.festival.waiting.dto.RecommendedSpotDto("강문해변", 75, "혼잡", 3.1));
        } else {
            // 기본 더미 데이터
            parsedLocation = "서울/인근";
            aiRecommendationReason = "전체 리스트 중 실시간 대기 인원이 적은 쾌적한 부스와 인근 명소를 골라 추천합니다.";
            recommendedSpots.add(new com.festival.waiting.dto.RecommendedSpotDto("서울 올림픽공원 장미광장", 30, "쾌적", 0.8));
            recommendedSpots.add(new com.festival.waiting.dto.RecommendedSpotDto("한강공원 망원지구", 65, "보통", 2.3));
        }

        return new com.festival.waiting.dto.AiCurationResponse(query, parsedLocation, recommendedSpots, aiRecommendationReason);
    }
}
