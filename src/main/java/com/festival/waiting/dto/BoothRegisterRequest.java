package com.festival.waiting.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Schema(description = "상인이 자신의 부스(상점) 및 메뉴/특산물 정보를 등록하기 위한 요청 데이터 모델입니다.")
@Getter
@Setter
@NoArgsConstructor
public class BoothRegisterRequest {

    @Schema(description = "부스가 소속된 축제의 고유 식별 ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long festivalId;

    @Schema(description = "상인이 운영할 부스의 이름", example = "장터 산나물 비빔밥", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "부스 판매 품목 및 특색 소개", example = "양평 용문산 산나물을 듬뿍 넣은 건강하고 고소한 비빔밥 전문 부스입니다.")
    private String description;

    @Schema(description = "축제 현장 내 부스의 물리적 입점 위치 (예: '먹거리 장터 B-12 구역')", example = "먹거리 존 B-12", requiredMode = Schema.RequiredMode.REQUIRED)
    private String locationDescription;

    @Schema(description = "부스에서 판매할 메뉴(메뉴판) 및 지역 특산물 목록입니다.")
    private List<ProductDto> products;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ProductDto {
        @Schema(description = "판매할 메뉴 또는 상품의 이름", example = "산채 비빔밥", requiredMode = Schema.RequiredMode.REQUIRED)
        private String name;

        @Schema(description = "메뉴/상품의 가격 (원 단위)", example = "9000", requiredMode = Schema.RequiredMode.REQUIRED)
        private Integer price;

        @Schema(description = "상품에 대한 상세 설명 및 재료 정보", example = "해발 800m 이상 고지대 산나물 6종이 들어간 시그니처 비빔밥")
        private String description;

        @Schema(description = "지역의 대표 명물/특산물 해당 여부", example = "true")
        private Boolean isSpecialty = false;
    }
}
