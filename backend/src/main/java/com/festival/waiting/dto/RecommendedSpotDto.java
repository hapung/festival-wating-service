package com.festival.waiting.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

@Schema(description = "AI가 추천하는 인근 관광지 정보")
@Getter
public class RecommendedSpotDto {
    @Schema(description = "관광지명", example = "용문산 용문사")
    private final String name;

    @Schema(description = "실시간/예측 혼잡도 지수 (0~100)", example = "45")
    private final int congestionRate;

    @Schema(description = "혼잡 등급 (쾌적/보통/혼잡)", example = "보통")
    private final String level;

    @Schema(description = "축제 부스로부터의 거리 (km)", example = "1.2")
    private final double distanceKm;

    public RecommendedSpotDto(String name, int congestionRate, String level, double distanceKm) {
        this.name = name;
        this.congestionRate = congestionRate;
        this.level = level;
        this.distanceKm = distanceKm;
    }
}
