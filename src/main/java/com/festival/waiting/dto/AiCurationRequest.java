package com.festival.waiting.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "사용자의 자연어 요구사항과 현장 상태를 결합하여 맞춤 부스를 큐레이션하기 위한 요청 데이터 모델입니다.")
@Getter
@Setter
@NoArgsConstructor
public class AiCurationRequest {

    @Schema(description = "현재 사용자가 속해 있거나 큐레이션을 받고자 하는 축제의 고유 식별 ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long festivalId;

    @Schema(
        description = "사용자가 말한 요구사항 메시지입니다. (예: '사람이 적고 건강한 향토 요리를 파는 곳을 원해')", 
        example = "사람 적고 특산품 들어간 향토 메뉴 파는 부스 추천해줘",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String userMessage;

    public AiCurationRequest(Long festivalId, String userMessage) {
        this.festivalId = festivalId;
        this.userMessage = userMessage;
    }
}
