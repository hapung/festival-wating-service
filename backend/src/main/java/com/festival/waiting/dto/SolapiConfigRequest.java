package com.festival.waiting.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "웹 대시보드에서 동적으로 Solapi 설정을 변경하기 위한 요청 DTO")
@Getter
@Setter
@NoArgsConstructor
public class SolapiConfigRequest {

    @Schema(description = "Solapi API Key", example = "NCSEMUXFI1QKUN0O")
    private String apiKey;

    @Schema(description = "Solapi API Secret", example = "YOUR_API_SECRET_KEY")
    private String apiSecret;

    @Schema(description = "등록된 발신 번호 (숫자만)", example = "01012345678")
    private String senderNumber;

    @Schema(description = "실제 발송 여부 활성화", example = "true")
    private boolean enabled;
}
