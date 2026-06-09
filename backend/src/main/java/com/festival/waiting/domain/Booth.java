package com.festival.waiting.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "booths")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Booth {

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
    private String locationDescription; // 부스 상세 위치 (예: '중앙 무대 옆 B-04')

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id")
    @lombok.Setter
    private User merchant;

    @Column(length = 255)
    @lombok.Setter
    private String imageUrl;

    @OneToMany(mappedBy = "booth", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Product> products = new ArrayList<>();

    // --- 웨이팅 비즈니스 로직 및 동시성 제어 필드 ---
    
    @Column(nullable = false)
    private Long waitingSequence = 0L; // 마지막으로 발급된 대기 번호 (웨이팅 신청 시 증가)

    @Column(nullable = false)
    private Integer currentWaitingCount = 0; // 현재 실시간으로 대기 중인 팀 수

    @Version
    private Long version; // 낙관적 락(Optimistic Lock)을 위한 JPA 버전 필드 (동시 대기 신청 시 정합성 보장)

    public Booth(Festival festival, String name, String description, String locationDescription) {
        this.festival = festival;
        this.name = name;
        this.description = description;
        this.locationDescription = locationDescription;
        this.waitingSequence = 0L;
        this.currentWaitingCount = 0;
    }

    public Booth(Festival festival, String name, String description, String locationDescription, User merchant, String imageUrl) {
        this.festival = festival;
        this.name = name;
        this.description = description;
        this.locationDescription = locationDescription;
        this.merchant = merchant;
        this.imageUrl = imageUrl;
        this.waitingSequence = 0L;
        this.currentWaitingCount = 0;
    }

    /**
     * 새로운 웨이팅 등록 시 대기 번호를 발급하고 실시간 대기 인원을 증가시킵니다.
     * @return 발급된 대기 번호
     */
    public Long issueWaitingNumber() {
        this.waitingSequence++;
        this.currentWaitingCount++;
        return this.waitingSequence;
    }

    /**
     * 웨이팅이 완료(방문)되거나 취소되었을 때 실시간 대기 인원수를 차감합니다.
     */
    public void decreaseWaitingCount() {
        if (this.currentWaitingCount > 0) {
            this.currentWaitingCount--;
        }
    }

    public void updateInfo(Festival festival, String name, String description, String locationDescription, String imageUrl) {
        this.festival = festival;
        this.name = name;
        this.description = description;
        this.locationDescription = locationDescription;
        this.imageUrl = imageUrl;
    }
}
