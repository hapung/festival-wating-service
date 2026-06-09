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

    /**
     * 특정 휴대폰 번호로 특정 축제에서 현재 WAITING, CALLED 상태인 대기열 개수를 조회합니다. (어뷰징 방지)
     */
    long countByPhoneNumberAndBoothFestivalIdAndStatusIn(String phoneNumber, Long festivalId, List<WaitingStatus> statuses);

    /**
     * 특정 휴대폰 번호로 현재 특정 축제에서 진행 중인(WAITING, CALLED) 전체 대기열 목록을 구합니다. (대기 상태 복원용)
     */
    List<Waiting> findByPhoneNumberAndBoothFestivalIdAndStatusIn(String phoneNumber, Long festivalId, List<WaitingStatus> statuses);
}
