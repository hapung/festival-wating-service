package com.festival.waiting.dto;

import com.festival.waiting.domain.Waiting;
import com.festival.waiting.domain.WaitingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

@Schema(description = "대기 신청, 호출, 완료 및 취소 처리 후 반환되는 대기열 정보 상세 응답 데이터 모델입니다.")
@Getter
public class WaitingResponse {

    @Schema(
        description = "발급된 대기 내역의 데이터베이스 고유 식별 ID입니다.", 
        example = "102"
    )
    private final Long waitingId;

    @Schema(
        description = "대기 신청을 접수한 상인 부스의 고유 식별 ID입니다.", 
        example = "5"
    )
    private final Long boothId;

    @Schema(
        description = "해당 부스에서 고객에게 발급해준 순차 대기 번호입니다. 부스 개별적으로 1번부터 차례대로 발급됩니다.", 
        example = "17"
    )
    private final Long waitingNumber;

    @Schema(
        description = "현재 해당 부스에 대기 중인 전체 팀 수(고객 본인 포함)입니다. AI가 대기 인원을 체크할 때 사용합니다.", 
        example = "4"
    )
    private final Integer currentWaitingCount;

    @Schema(
        description = "현재 이 대기 예약의 진행 상태입니다. WAITING(대기중), CALLED(호출완료), COMPLETED(방문완료), CANCELLED(취소됨) 값을 가집니다.", 
        example = "WAITING"
    )
    private final WaitingStatus status;

    public WaitingResponse(Long waitingId, Long boothId, Long waitingNumber, Integer currentWaitingCount, WaitingStatus status) {
        this.waitingId = waitingId;
        this.boothId = boothId;
        this.waitingNumber = waitingNumber;
        this.currentWaitingCount = currentWaitingCount;
        this.status = status;
    }

    public static WaitingResponse from(Waiting waiting) {
        return new WaitingResponse(
                waiting.getId(),
                waiting.getBooth().getId(),
                waiting.getWaitingNumber(),
                waiting.getBooth().getCurrentWaitingCount(),
                waiting.getStatus()
        );
    }
}
