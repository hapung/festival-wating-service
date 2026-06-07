package com.festival.waiting.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "사용자가 카드를 통해 위치 및 가용 시간을 직접 입력하여 축제 추천을 받기 위한 요청 모델입니다.")
@Getter
@Setter
@NoArgsConstructor
public class LocationRecommendRequest {

    @Schema(
        description = "사용자의 현재 위치 또는 기준 주소입니다 (예: '서울시 서초구 반포동'). 위도/경도가 없어도 Kakao 로컬 API를 통해 자동 변환됩니다.",
        example = "경기도 양평군 용문면"
    )
    private String address;

    @Schema(
        description = "사용자 기준 위도(Latitude) 정보입니다. null인 경우 address 필드를 주소 파싱하여 사용합니다.",
        example = "37.5665"
    )
    private Double latitude;

    @Schema(
        description = "사용자 기준 경도(Longitude) 정보입니다. null인 경우 address 필드를 주소 파싱하여 사용합니다.",
        example = "126.9780"
    )
    private Double longitude;

    @Schema(
        description = "관광에 투입할 수 있는 사용 가능한 가용 시간(시간 단위)입니다.",
        example = "4"
    )
    private Integer availableHours;

    @Schema(
        description = "현재 위치 기준 최대 이동 선호 거리(km 단위)입니다. 이 반경 내의 축제를 추천합니다.",
        example = "50.0"
    )
    private Double maxDistanceKm;

    @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd")
    @Schema(
        description = "방문하려는 날짜입니다 (예: '2026-06-07'). 지정한 날짜에 활성화되어 있는(진행 중인) 축제만 필터링합니다. 기본값은 오늘입니다.",
        example = "2026-06-07"
    )
    private java.time.LocalDate visitDate;

    public LocationRecommendRequest(String address, Double latitude, Double longitude, Integer availableHours, Double maxDistanceKm, java.time.LocalDate visitDate) {
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.availableHours = availableHours;
        this.maxDistanceKm = maxDistanceKm;
        this.visitDate = visitDate;
    }
}
