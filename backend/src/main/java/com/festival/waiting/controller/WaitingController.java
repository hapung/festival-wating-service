package com.festival.waiting.controller;

import com.festival.waiting.domain.Waiting;
import com.festival.waiting.dto.WaitingRegisterRequest;
import com.festival.waiting.dto.WaitingResponse;
import com.festival.waiting.dto.WaitingStatusResponse;
import com.festival.waiting.dto.SolapiConfigRequest;
import com.festival.waiting.service.WaitingService;
import com.festival.waiting.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(
    name = "현장 웨이팅 API", 
    description = "축제 현장 부스의 대기 등록, 대기 호출, 완료 및 취소 상태를 제어하는 API 제공. 외부 AI 에이전트 ennoia가 이 API를 호출해 실시간 웨이팅을 중개합니다."
)
@RestController
@RequiredArgsConstructor
public class WaitingController {

    private final WaitingService waitingService;
    private final NotificationService notificationService;

    @Operation(
        summary = "[사용자] 대기열 등록",
        description = "사용자가 특정 축제 부스에 현장 대기를 신청할 때 호출합니다. 손님 JWT 토큰(AuthenticationPrincipal)의 전화번호 정보를 활용하여 안전하게 대기를 신청합니다. 동일 축제 내 동시 대기는 최대 3개로 제한됩니다."
    )
    @PostMapping("/api/booths/{boothId}/waitings")
    public ResponseEntity<WaitingResponse> registerWaiting(
            @Parameter(description = "대기를 신청하려는 축제 부스의 고유 식별 ID", example = "1")
            @PathVariable("boothId") Long boothId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.User principal
    ) {
        Waiting waiting = waitingService.registerWaiting(boothId, principal.getUsername());
        return ResponseEntity.ok(WaitingResponse.from(waiting));
    }

    @Operation(
        summary = "[상인] 다음 대기자 자동 호출",
        description = "부스 식별 ID(boothId)를 기준으로 현재 대기 중(WAITING 상태)인 고객들 중 가장 빠른 대기 번호를 가진 손님 1명을 찾아 상태를 호출완료(CALLED)로 변경합니다. 상태가 전환됨과 동시에 해당 고객에게 비동기 알림톡이 발송됩니다."
    )
    @PostMapping("/api/booths/{boothId}/waitings/call-next")
    public ResponseEntity<WaitingResponse> callNextWaiting(
            @Parameter(description = "대기 고객을 호출하고자 하는 부스의 고유 식별 ID", example = "1")
            @PathVariable("boothId") Long boothId
    ) {
        Waiting waiting = waitingService.callNextWaiting(boothId);
        return ResponseEntity.ok(WaitingResponse.from(waiting));
    }

    @Operation(
        summary = "[상인] 대기 완료 처리",
        description = "손님이 부스를 직접 방문하여 서비스를 원활히 이용하기 시작했을 때 호출합니다. 이 작업이 실행되면 해당 손님의 대기 상태가 방문완료(COMPLETED)로 전환되고 부스의 실시간 대기 팀 수(currentWaitingCount)가 1 감소합니다."
    )
    @PostMapping("/api/waitings/{waitingId}/complete")
    public ResponseEntity<Void> completeWaiting(
            @Parameter(description = "방문 완료 처리하려는 대기 내역 고유 식별 ID", example = "102")
            @PathVariable("waitingId") Long waitingId
    ) {
        waitingService.completeWaiting(waitingId);
        return ResponseEntity.ok().build();
    }

    @Operation(
        summary = "[공통] 대기 취소 처리",
        description = "대기 신청한 손님이 자발적으로 예약을 취소하거나, 호출했음에도 고객이 오지 않아 상인이 노쇼(No-show) 취소 처리할 때 공통으로 호출합니다. 대기 상태가 취소(CANCELLED)로 변경되며 실시간 대기자 수(currentWaitingCount)가 1 감소합니다."
    )
    @PostMapping("/api/waitings/{waitingId}/cancel")
    public ResponseEntity<Void> cancelWaiting(
            @Parameter(description = "자발적 취소 또는 노쇼 취소 처리할 대기 내역 고유 식별 ID", example = "102")
            @PathVariable("waitingId") Long waitingId
    ) {
        waitingService.cancelWaiting(waitingId);
        return ResponseEntity.ok().build();
    }

    @Operation(
        summary = "[사용자/폴링] 내 대기 실시간 상태 조회 및 앞 대기 팀수 파악",
        description = "대기 신청 시 발급받은 대기 고유 식별 ID(waitingId)를 기반으로 현재 호출 대기 상태 및 내 앞에 대기 중인 실제 팀 수를 조회합니다. 모바일 브라우저에서 4초 주기로 폴링하여 UI를 자동 새로고침하는 데 활용됩니다."
    )
    @GetMapping("/api/waitings/{waitingId}/status")
    public ResponseEntity<WaitingStatusResponse> getWaitingStatus(
            @Parameter(description = "상태를 확인하고자 하는 대기 내역 고유 식별 ID", example = "102")
            @PathVariable("waitingId") Long waitingId
    ) {
        WaitingStatusResponse statusResponse = waitingService.getWaitingStatus(waitingId);
        return ResponseEntity.ok(statusResponse);
    }

    @Operation(summary = "Solapi 발송 설정 동적 업데이트", description = "서버 재기동 없이 웹 화면에서 입력한 솔라피 인증키 및 발신번호를 메모리에 실시간으로 즉시 적용합니다.")
    @PostMapping("/api/config/solapi")
    public ResponseEntity<Void> updateSolapiConfig(@RequestBody SolapiConfigRequest request) {
        notificationService.updateConfig(
                request.getApiKey(),
                request.getApiSecret(),
                request.getSenderNumber(),
                request.isEnabled()
        );
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Solapi 발송 설정 조회", description = "현재 설정된 솔라피 API Key 및 발신번호 현황을 안전하게 조회합니다. (Secret Key는 마스킹 처리)")
    @GetMapping("/api/config/solapi")
    public ResponseEntity<java.util.Map<String, Object>> getSolapiConfig() {
        return ResponseEntity.ok(notificationService.getConfig());
    }

    @Operation(
        summary = "[사용자] 내 활성 대기 목록 조회 (상태 복원용)",
        description = "손님 토큰의 인증 정보를 통해 해당 축제(festivalId) 내에 현재 대기 중이거나 호출(WAITING, CALLED) 상태인 나의 대기열 목록을 조회합니다. 새로고침 시 화면 복원에 활용됩니다."
    )
    @GetMapping("/api/waitings/my-active")
    public ResponseEntity<java.util.List<WaitingStatusResponse>> getMyActiveWaitings(
            @RequestParam("festivalId") Long festivalId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.User principal
    ) {
        java.util.List<WaitingStatusResponse> activeWaitings = waitingService.getMyActiveWaitings(principal.getUsername(), festivalId);
        return ResponseEntity.ok(activeWaitings);
    }
}
