package com.festival.waiting.dto;

import com.festival.waiting.domain.Festival;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Schema(description = "위치 및 시간 기반으로 추천된 축제 및 주변 연계 관광지 패키지 응답 모델입니다.")
@Getter
public class FestivalRecommendResponse {

    @Schema(description = "축제 고유 ID", example = "1")
    private final Long festivalId;

    @Schema(description = "축제 이름", example = "양평 용문산 산나물 축제")
    private final String name;

    @Schema(description = "축제 상세 소개", example = "용문산의 청정 산나물을 맛보고 다양한 전통 체험을 즐기는 축제입니다.")
    private final String description;

    @Schema(description = "축제 개최 주소/위치", example = "경기도 양평군 용문면 용문산로 110-2")
    private final String location;

    @Schema(description = "축제 시작일", example = "2026-05-01")
    private final LocalDate startDate;

    @Schema(description = "축제 종료일", example = "2026-05-15")
    private final LocalDate endDate;

    @Schema(description = "사용자 현재 위치로부터 축제장까지의 거리 (단위: km)", example = "12.4")
    private final Double distanceKm;

    @Schema(description = "축제장 주변에 함께 둘러볼 수 있는 연계 관광지 목록")
    private final List<TouristSpotResponse> nearbySpots;

    public FestivalRecommendResponse(Long festivalId, String name, String description, String location, 
                                     LocalDate startDate, LocalDate endDate, Double distanceKm, 
                                     List<TouristSpotResponse> nearbySpots) {
        this.festivalId = festivalId;
        this.name = name;
        this.description = description;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.distanceKm = distanceKm;
        this.nearbySpots = nearbySpots;
    }

    public static FestivalRecommendResponse from(Festival festival, double distanceKm) {
        List<TouristSpotResponse> spots = festival.getTouristSpots().stream()
                .map(TouristSpotResponse::from)
                .collect(Collectors.toList());

        return new FestivalRecommendResponse(
                festival.getId(),
                festival.getName(),
                festival.getDescription(),
                festival.getLocation(),
                festival.getStartDate(),
                festival.getEndDate(),
                distanceKm,
                spots
        );
    }
}
