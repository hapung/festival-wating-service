package com.festival.waiting.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "waitings",
    uniqueConstraints = {
        // 동일한 부스에서 같은 대기 번호가 중복 발급되는 것을 DB 레벨에서 차단
        @UniqueConstraint(columnNames = {"booth_id", "waitingNumber"}),
        // (선택) 동일 연락처로 동일 부스에 대기중(WAITING)인 건이 중복 등록되지 않도록 하는 비즈니스 정합성은 
        // 일반적으로 서비스 단에서 검증하거나 DB 복합 유니크 제약(status + phone_number + booth_id)으로 처리할 수 있으나,
        // 여기서는 대기 번호 중복 방지를 기본 유니크 조건으로 설정합니다.
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Waiting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 모든 연관관계는 FetchType.LAZY 적용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booth_id", nullable = false)
    private Booth booth;

    @Column(nullable = false)
    private Long waitingNumber; // 발급받은 대기 번호 (부스별 고유 시퀀스)

    @Column(nullable = false, length = 20)
    private String phoneNumber; // 알림톡/문자 전송 및 대기 확인용 휴대폰 번호

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WaitingStatus status; // 상태 (WAITING, COMPLETED, CANCELLED)

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private boolean isNearAlertSent = false;

    @Version
    private Long version; // 대기 상태 변경 시 발생할 수 있는 동시 수정(예: 자발적 취소와 상인의 방문완료 처리 혼선)을 막기 위한 낙관적 락

    public Waiting(Booth booth, Long waitingNumber, String phoneNumber) {
        this.booth = booth;
        this.waitingNumber = waitingNumber;
        this.phoneNumber = phoneNumber;
        this.status = WaitingStatus.WAITING;
        this.isNearAlertSent = false;
    }

    public void sendNearAlert() {
        this.isNearAlertSent = true;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 상인이 고객을 호출할 때 호출 (WAITING -> CALLED)
     */
    public void markAsCalled() {
        if (this.status != WaitingStatus.WAITING) {
            throw new IllegalStateException("대기 중(WAITING) 상태의 예약만 호출할 수 있습니다.");
        }
        this.status = WaitingStatus.CALLED;
    }

    /**
     * 상인에 의해 대기가 정상적으로 완료(방문 완료) 처리될 때 호출
     */
    public void complete() {
        if (this.status != WaitingStatus.WAITING && this.status != WaitingStatus.CALLED) {
            throw new IllegalStateException("대기 중(WAITING) 또는 호출 완료(CALLED) 상태의 예약만 완료 처리할 수 있습니다.");
        }
        this.status = WaitingStatus.COMPLETED;
        this.booth.decreaseWaitingCount();
    }

    /**
     * 고객의 자발적 취소 혹은 상인의 미방문 노쇼 처리로 인해 대기가 취소될 때 호출
     */
    public void cancel() {
        if (this.status != WaitingStatus.WAITING && this.status != WaitingStatus.CALLED) {
            throw new IllegalStateException("대기 중(WAITING) 또는 호출 완료(CALLED) 상태의 예약만 취소 처리할 수 있습니다.");
        }
        this.status = WaitingStatus.CANCELLED;
        this.booth.decreaseWaitingCount();
    }
}
