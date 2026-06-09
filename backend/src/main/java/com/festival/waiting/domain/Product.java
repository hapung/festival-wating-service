package com.festival.waiting.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 모든 연관관계는 FetchType.LAZY 적용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booth_id", nullable = false)
    private Booth booth;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Integer price;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Boolean isSpecialty = false; // 지역 특산품 여부

    @Column(length = 255)
    @lombok.Setter
    private String imageUrl;

    public Product(Booth booth, String name, Integer price, String description, Boolean isSpecialty) {
        this.booth = booth;
        this.name = name;
        this.price = price;
        this.description = description;
        this.isSpecialty = isSpecialty;
    }

    public Product(Booth booth, String name, Integer price, String description, Boolean isSpecialty, String imageUrl) {
        this.booth = booth;
        this.name = name;
        this.price = price;
        this.description = description;
        this.isSpecialty = isSpecialty;
        this.imageUrl = imageUrl;
    }
}
