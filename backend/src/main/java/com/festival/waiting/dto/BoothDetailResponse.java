package com.festival.waiting.dto;

import com.festival.waiting.domain.Booth;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import java.util.List;
import java.util.stream.Collectors;

@Schema(description = "축제 현장 내 부스의 정보와 판매 메뉴, 실시간 대기 현황을 종합적으로 응답하는 모델입니다.")
@Getter
public class BoothDetailResponse {

    @Schema(description = "부스 고유 식별 ID", example = "5")
    private final Long boothId;

    @Schema(description = "부스 이름", example = "장터 산나물 비빔밥")
    private final String name;

    @Schema(description = "부스 소개", example = "용문산 청정 산나물 비빔밥 전문")
    private final String description;

    @Schema(description = "부스 상세 위치 정보", example = "먹거리 존 B-12")
    private final String locationDescription;

    @Schema(description = "현재 실시간 대기 중인 전체 팀 수", example = "3")
    private final Integer currentWaitingCount;

    @Schema(description = "부스 대표 이미지 URL 경로", example = "/uploads/abc.png")
    private final String imageUrl;

    @Schema(description = "부스가 소속된 축제의 고유 식별 ID", example = "1")
    private final Long festivalId;

    @Schema(description = "부스 메뉴 및 상품 정보 리스트")
    private final List<ProductDetailResponse> products;

    @Schema(description = "부스 진입 및 메뉴 주문/대기를 위한 QR 코드 이미지 URL", example = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:8080/booth.html?boothId=5")
    private final String qrCodeUrl;

    public BoothDetailResponse(Long boothId, String name, String description, String locationDescription, 
                               Integer currentWaitingCount, String qrCodeUrl, String imageUrl, Long festivalId, List<ProductDetailResponse> products) {
        this.boothId = boothId;
        this.name = name;
        this.description = description;
        this.locationDescription = locationDescription;
        this.currentWaitingCount = currentWaitingCount;
        this.qrCodeUrl = qrCodeUrl;
        this.imageUrl = imageUrl;
        this.festivalId = festivalId;
        this.products = products;
    }

    public static BoothDetailResponse from(Booth booth) {
        List<ProductDetailResponse> prodResponses = booth.getProducts().stream()
                .map(ProductDetailResponse::from)
                .collect(Collectors.toList());

        String baseUrl = "http://localhost:8080";
        try {
            baseUrl = org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        } catch (Exception e) {
            // Fallback for tests or non-web contexts
        }

        String targetUrl = baseUrl + "/booth.html?boothId=" + booth.getId();
        String qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + targetUrl;

        return new BoothDetailResponse(
                booth.getId(),
                booth.getName(),
                booth.getDescription(),
                booth.getLocationDescription(),
                booth.getCurrentWaitingCount(),
                qrCodeUrl,
                booth.getImageUrl(),
                booth.getFestival() != null ? booth.getFestival().getId() : null,
                prodResponses
        );
    }

    @Schema(description = "메뉴/상품 상세 정보")
    @Getter
    public static class ProductDetailResponse {
        @Schema(description = "상품 ID", example = "10")
        private final Long productId;
        
        @Schema(description = "상품명", example = "산채 비빔밥")
        private final String name;
        
        @Schema(description = "가격 (원)", example = "9000")
        private final Integer price;
        
        @Schema(description = "상품 설명", example = "용문산 특산 산나물을 가득 넣은 맛깔나는 비빔밥")
        private final String description;
        
        @Schema(description = "지역 명물/특산물 해당 여부", example = "true")
        private final Boolean isSpecialty;

        @Schema(description = "상품 이미지 URL 경로", example = "/uploads/def.png")
        private final String imageUrl;

        public ProductDetailResponse(Long productId, String name, Integer price, String description, Boolean isSpecialty, String imageUrl) {
            this.productId = productId;
            this.name = name;
            this.price = price;
            this.description = description;
            this.isSpecialty = isSpecialty;
            this.imageUrl = imageUrl;
        }

        public static ProductDetailResponse from(com.festival.waiting.domain.Product product) {
            return new ProductDetailResponse(
                    product.getId(),
                    product.getName(),
                    product.getPrice(),
                    product.getDescription(),
                    product.getIsSpecialty(),
                    product.getImageUrl()
            );
        }
    }
}
