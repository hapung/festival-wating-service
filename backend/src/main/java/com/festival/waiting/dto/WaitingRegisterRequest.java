package com.festival.waiting.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "고객이 특정 부스에 현장 대기(웨이팅)를 신청하기 위한 요청 데이터 모델입니다.")
@Getter
@Setter
@NoArgsConstructor
public class WaitingRegisterRequest {

    @Schema(
        description = "대기 등록을 신청하는 고객의 휴대폰 번호입니다 (예: '010-1234-5678'). 이 번호로 실시간 알림톡 전송 및 본인 대기 조회 인증이 진행됩니다.",
        example = "010-1234-5678",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String phoneNumber;

    public WaitingRegisterRequest(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
