package com.festival.waiting.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tourist_spots")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TouristSpot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 모든 연관관계는 FetchType.LAZY 적용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "festival_id", nullable = false)
    private Festival festival;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 150)
    private String location;

    @Column(nullable = false)
    private Double distanceKm; // 축제지로부터의 거리 (단위: km)

    @Column(nullable = false)
    private Integer congestionRate = 50; // 관광지 집중률 (방문자 혼잡도 지수: 0 ~ 100)

    public TouristSpot(Festival festival, String name, String description, String location, Double distanceKm, Integer congestionRate) {
        this.festival = festival;
        this.name = name;
        this.description = description;
        this.location = location;
        this.distanceKm = distanceKm;
        this.congestionRate = congestionRate != null ? congestionRate : 50;
    }
}
