package com.festival.waiting.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import java.util.List;

@Schema(description = "자연어 기반 AI 큐레이션 통합 응답")
@Getter
public class AiCurationResponse {
    @Schema(description = "사용자 원본 질의어", example = "사람 없고 시원한 용문산 주변 관광지 추천해줘")
    private final String query;

    @Schema(description = "자연어 쿼리에서 파악된 타겟 위치", example = "양평 용문산")
    private final String parsedLocation;

    @Schema(description = "AI 분석에 의해 실시간 큐레이션된 인근 관광지 추천 리스트")
    private final List<RecommendedSpotDto> recommendedSpots;

    @Schema(description = "AI 추천 사유", example = "현재 용문산 관광단지는 혼잡도 보통(45%)으로 비교적 쾌적하며, 1.2km 떨어진 용문사는 가벼운 산책 코스로 추천합니다.")
    private final String aiRecommendationReason;

    public AiCurationResponse(String query, String parsedLocation, List<RecommendedSpotDto> recommendedSpots, String aiRecommendationReason) {
        this.query = query;
        this.parsedLocation = parsedLocation;
        this.recommendedSpots = recommendedSpots;
        this.aiRecommendationReason = aiRecommendationReason;
    }
}
