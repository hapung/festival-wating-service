package com.festival.waiting.dto;

import com.festival.waiting.domain.TouristSpot;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

@Schema(description = "축제 주변 연계 관광지 정보 응답 모델입니다.")
@Getter
public class TouristSpotResponse {

    @Schema(description = "관광지 고유 ID", example = "10")
    private final Long spotId;

    @Schema(description = "관광지명", example = "용문사 은행나무")
    private final String name;

    @Schema(description = "관광지 소개/설명", example = "천년의 세월을 간직한 동양 최대의 은행나무입니다.")
    private final String description;

    @Schema(description = "관광지 물리적 주소/위치", example = "경기도 양평군 용문면 용문산로 782")
    private final String location;

    @Schema(description = "축제 행사지로부터의 거리 (단위: km)", example = "1.2")
    private final Double distanceKm;

    @Schema(description = "관광지 집중률 (방문자 혼잡도 지수: 0 ~ 100, 수치가 낮을수록 쾌적하고 높을수록 붐빔)", example = "65")
    private final Integer congestionRate;

    public TouristSpotResponse(Long spotId, String name, String description, String location, Double distanceKm, Integer congestionRate) {
        this.spotId = spotId;
        this.name = name;
        this.description = description;
        this.location = location;
        this.distanceKm = distanceKm;
        this.congestionRate = congestionRate;
    }

    public static TouristSpotResponse from(TouristSpot spot) {
        return new TouristSpotResponse(
                spot.getId(),
                spot.getName(),
                spot.getDescription(),
                spot.getLocation(),
                spot.getDistanceKm(),
                spot.getCongestionRate()
        );
    }
}
