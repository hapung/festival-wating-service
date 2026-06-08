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
}
