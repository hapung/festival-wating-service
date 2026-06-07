package com.festival.waiting.dto;

import com.festival.waiting.domain.Waiting;
import com.festival.waiting.domain.WaitingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

@Schema(description = "고객의 개별 웨이팅 실시간 진행 상황 및 앞 대기 팀 정보를 나타내는 응답 모델입니다.")
@Getter
public class WaitingStatusResponse {

    @Schema(description = "대기 내역 ID", example = "102")
    private final Long waitingId;

    @Schema(description = "대기 번호", example = "15")
    private final Long waitingNumber;

    @Schema(description = "대기 현재 상태 (WAITING, CALLED, COMPLETED, CANCELLED)", example = "WAITING")
    private final WaitingStatus status;

    @Schema(description = "내 앞에 대기 중인 전체 팀 수", example = "2")
    private final int aheadCount;

    public WaitingStatusResponse(Long waitingId, Long waitingNumber, WaitingStatus status, int aheadCount) {
        this.waitingId = waitingId;
        this.waitingNumber = waitingNumber;
        this.status = status;
        this.aheadCount = aheadCount;
    }

    public static WaitingStatusResponse of(Waiting waiting, int aheadCount) {
        return new WaitingStatusResponse(
                waiting.getId(),
                waiting.getWaitingNumber(),
                waiting.getStatus(),
                aheadCount
        );
    }
}
