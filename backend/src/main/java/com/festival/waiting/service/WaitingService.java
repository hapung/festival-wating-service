package com.festival.waiting.service;

import com.festival.waiting.domain.Booth;
import com.festival.waiting.domain.Waiting;
import com.festival.waiting.domain.WaitingStatus;
import com.festival.waiting.repository.BoothRepository;
import com.festival.waiting.repository.WaitingRepository;
import com.festival.waiting.dto.WaitingStatusResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaitingService {

    private final BoothRepository boothRepository;
    private final WaitingRepository waitingRepository;
    private final NotificationService notificationService;

    /**
     * [고객] 특정 부스에 웨이팅을 등록합니다.
     * 동시성 제어를 위해 비관적 락(PESSIMISTIC_WRITE)을 획득하여 순번 발급의 원자성을 보장합니다.
     */
    @Transactional
    public Waiting registerWaiting(Long boothId, String phoneNumber) {
        log.info("[웨이팅 등록 요청] 부스 ID: {}, 연락처: {}", boothId, phoneNumber);

        // 1. 비관적 락으로 부스 정보 조회 (동시성 제어 핵심)
        Booth booth = boothRepository.findByIdWithPessimisticLock(boothId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부스입니다. ID: " + boothId));

        // [최종 합의 정책] 동일 축제 범위 내 최대 3개 부스 동시 대기 제한 검증
        long activeCount = waitingRepository.countByPhoneNumberAndBoothFestivalIdAndStatusIn(
                phoneNumber,
                booth.getFestival().getId(),
                List.of(WaitingStatus.WAITING, WaitingStatus.CALLED)
        );
        if (activeCount >= 3) {
            log.warn("[웨이팅 차단] 고객 {}은 이미 동일 축제 내에 3개 부스 대기를 걸어 신청이 차단됩니다.", phoneNumber);
            throw new IllegalArgumentException("동일 축제 내에서 동시에 대기할 수 있는 부스는 최대 3개까지만 가능합니다.");
        }

        // 2. 대기 번호 및 실시간 대기 인원 증가 (Booth 엔티티 내 캡슐화 로직)
        Long assignedWaitingNumber = booth.issueWaitingNumber();

        // 3. Waiting 엔티티 생성 및 저장
        Waiting waiting = new Waiting(booth, assignedWaitingNumber, phoneNumber);
        Waiting savedWaiting = waitingRepository.save(waiting);

        log.info("[웨이팅 등록 성공] 등록 ID: {}, 발급된 대기번호: {}번, 실시간 대기팀수: {}팀",
                savedWaiting.getId(), assignedWaitingNumber, booth.getCurrentWaitingCount());

        // 4. 비동기 알림 전송 (대기 등록 완료 문자)
        notificationService.sendWaitingRegisterNotification(
                phoneNumber,
                assignedWaitingNumber,
                booth.getName(),
                booth.getCurrentWaitingCount()
        );

        return savedWaiting;
    }

    /**
     * [상인] 다음 대기 손님을 순차적으로 호출합니다.
     * 가장 이른 대기 번호를 가진 손님의 상태를 CALLED로 변경하고 비동기 알림을 발송합니다.
     */
    @Transactional
    public Waiting callNextWaiting(Long boothId) {
        log.info("[다음 대기 손님 호출 요청] 부스 ID: {}", boothId);

        // 1. 해당 부스의 대기 중(WAITING)인 손님 중 가장 번호가 빠른 손님 조회
        Waiting nextWaiting = waitingRepository.findFirstByBoothIdAndStatusOrderByWaitingNumberAsc(boothId, WaitingStatus.WAITING)
                .orElseThrow(() -> new IllegalStateException("대기 중인 손님이 없습니다. 부스 ID: " + boothId));

        // 2. 대기 상태를 호출 완료(CALLED)로 변경
        nextWaiting.markAsCalled();

        // 3. 외부 비동기 알림 발송 (외부 스레드에서 백그라운드 처리)
        // 트랜잭션 커밋 완료 후 발송하는 것이 정합성에 더 안전할 수 있지만, 일반적인 Spring @Async 동작을 모사합니다.
        notificationService.sendWaitingCallNotification(
                nextWaiting.getPhoneNumber(),
                nextWaiting.getWaitingNumber(),
                nextWaiting.getBooth().getName()
        );

        log.info("[다음 대기 손님 호출 처리 완료] 대기 ID: {}, 대기번호: {}번",
                nextWaiting.getId(), nextWaiting.getWaitingNumber());

        return nextWaiting;
    }

    /**
     * [상인] 특정 대기 정보를 호출하여 직접 호출 상태로 변경할 수도 있는 메서드 (선택적 구현)
     */
    @Transactional
    public Waiting callWaitingById(Long waitingId) {
        log.info("[특정 대기 손님 지정 호출] 대기 ID: {}", waitingId);
        Waiting waiting = waitingRepository.findById(waitingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대기 내역입니다. ID: " + waitingId));

        waiting.markAsCalled();

        notificationService.sendWaitingCallNotification(
                waiting.getPhoneNumber(),
                waiting.getWaitingNumber(),
                waiting.getBooth().getName()
        );

        return waiting;
    }

    /**
     * [상인] 손님이 부스에 방문하여 식사 또는 서비스 이용을 시작하여 웨이팅을 '완료' 처리합니다.
     */
    @Transactional
    public void completeWaiting(Long waitingId) {
        log.info("[웨이팅 완료 요청] 대기 ID: {}", waitingId);
        Waiting waiting = waitingRepository.findById(waitingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대기 내역입니다. ID: " + waitingId));

        // 상태 변경 및 실시간 대기수 감소 (내부 메서드에서 처리)
        waiting.complete();

        log.info("[웨이팅 완료 처리 완료] 대기 ID: {}, 부스 ID: {}, 잔여 대기팀수: {}팀",
                waiting.getId(), waiting.getBooth().getId(), waiting.getBooth().getCurrentWaitingCount());
        
        // 대기열이 당겨짐에 따라 자동 임박 문자 발송 체크
        checkAndSendNearAlerts(waiting.getBooth().getId());
    }

    /**
     * [사용자/상인] 고객의 자발적 취소 또는 노쇼로 인한 웨이팅 '취소' 처리입니다.
     */
    @Transactional
    public void cancelWaiting(Long waitingId) {
        log.info("[웨이팅 취소 요청] 대기 ID: {}", waitingId);
        Waiting waiting = waitingRepository.findById(waitingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대기 내역입니다. ID: " + waitingId));

        // 상태 변경 및 실시간 대기수 감소 (내부 메서드에서 처리)
        waiting.cancel();

        log.info("[웨이팅 취소 처리 완료] 대기 ID: {}, 부스 ID: {}, 잔여 대기팀수: {}팀",
                waiting.getId(), waiting.getBooth().getId(), waiting.getBooth().getCurrentWaitingCount());
        
        // 대기열이 당겨짐에 따라 자동 임박 문자 발송 체크
        checkAndSendNearAlerts(waiting.getBooth().getId());
    }

    /**
     * [사용자/상인] 대기 고유 ID로 대기 상세 상태와 내 앞 대기팀 수를 조회합니다.
     */
    @Transactional(readOnly = true)
    public WaitingStatusResponse getWaitingStatus(Long waitingId) {
        log.info("[대기 실시간 상태 조회] 대기 ID: {}", waitingId);
        Waiting waiting = waitingRepository.findById(waitingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대기 내역입니다. ID: " + waitingId));

        int aheadCount = 0;
        if (waiting.getStatus() == WaitingStatus.WAITING) {
            aheadCount = (int) waitingRepository.countByBoothIdAndStatusAndWaitingNumberLessThan(
                    waiting.getBooth().getId(),
                    WaitingStatus.WAITING,
                    waiting.getWaitingNumber()
            );
        }

        return WaitingStatusResponse.of(waiting, aheadCount);
    }

    /**
     * 완료 또는 취소 등으로 대기열이 당겨졌을 때, 
     * 해당 부스의 상위 3개 WAITING 팀 중 알림이 가지 않은 대상에게 실시간 자동 임박 문자를 발송합니다.
     */
    @Transactional
    public void checkAndSendNearAlerts(Long boothId) {
        log.info("[대기열 자동 당겨짐 감지] 부스 ID: {} - 순서 임박 자동 알림 체크 실행", boothId);
        List<Waiting> waitings = waitingRepository.findByBoothIdAndStatusOrderByWaitingNumberAsc(boothId, WaitingStatus.WAITING);
        
        // 상위 3팀 (0번째 = 다음 순서(ahead:0), 1번째 = 앞대기 1팀(ahead:1), 2번째 = 앞대기 2팀(ahead:2))
        for (int i = 0; i < Math.min(3, waitings.size()); i++) {
            Waiting waiting = waitings.get(i);
            if (!waiting.isNearAlertSent()) {
                notificationService.sendNearAlertNotification(
                        waiting.getPhoneNumber(),
                        waiting.getWaitingNumber(),
                        waiting.getBooth().getName(),
                        i // aheadCount
                );
                waiting.sendNearAlert();
            }
        }
    }

    /**
     * [고객] 특정 휴대폰 번호로 현재 특정 축제에서 대기(WAITING, CALLED) 상태인 전체 대기열 목록을 조회합니다. (대기 복원용)
     */
    @Transactional(readOnly = true)
    public List<WaitingStatusResponse> getMyActiveWaitings(String phoneNumber, Long festivalId) {
        log.info("[내 활성 대기 목록 조회] 전화번호: {}, 축제 ID: {}", phoneNumber, festivalId);
        List<Waiting> activeWaitings = waitingRepository.findByPhoneNumberAndBoothFestivalIdAndStatusIn(
                phoneNumber,
                festivalId,
                List.of(WaitingStatus.WAITING, WaitingStatus.CALLED)
        );

        return activeWaitings.stream()
                .map(w -> {
                    int aheadCount = 0;
                    if (w.getStatus() == WaitingStatus.WAITING) {
                        aheadCount = (int) waitingRepository.countByBoothIdAndStatusAndWaitingNumberLessThan(
                                w.getBooth().getId(),
                                WaitingStatus.WAITING,
                                w.getWaitingNumber()
                        );
                    }
                    return WaitingStatusResponse.of(w, aheadCount);
                })
                .collect(java.util.stream.Collectors.toList());
    }
}
