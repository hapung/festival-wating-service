package com.festival.waiting.repository;

import com.festival.waiting.domain.Waiting;
import com.festival.waiting.domain.WaitingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface WaitingRepository extends JpaRepository<Waiting, Long> {

    /**
     * 특정 부스에서 대기 중인 고객 중 대기 번호가 가장 빠른(가장 먼저 등록한) 손님 1명을 조회합니다.
     */
    Optional<Waiting> findFirstByBoothIdAndStatusOrderByWaitingNumberAsc(Long boothId, WaitingStatus status);

    /**
     * 특정 부스에서 본인보다 대기 번호가 빠른 WAITING 상태의 팀 수를 구합니다.
     */
    long countByBoothIdAndStatusAndWaitingNumberLessThan(Long boothId, WaitingStatus status, Long waitingNumber);

    /**
     * 특정 부스의 지정된 대기 상태인 전체 내역을 대기 순서대로 정렬하여 반환합니다.
     */
    List<Waiting> findByBoothIdAndStatusOrderByWaitingNumberAsc(Long boothId, WaitingStatus status);
}
