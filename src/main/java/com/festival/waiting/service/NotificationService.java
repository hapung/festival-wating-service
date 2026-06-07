package com.festival.waiting.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class NotificationService {

    @Value("${api.solapi.api-key:NCSEMUXFI1QKUN0O}")
    private String solapiApiKey;

    @Value("${api.solapi.api-secret:}")
    private String solapiApiSecret;

    @Value("${api.solapi.sender-number:}")
    private String senderNumber;

    @Value("${api.solapi.enabled:true}")
    private boolean isSmsSendingEnabled;

    /**
     * [고객] 웨이팅 등록 완료 알림톡/SMS 발송
     */
    @Async
    public void sendWaitingRegisterNotification(String phoneNumber, Long waitingNumber, String boothName, int currentWaitingCount) {
        log.info("[Solapi 알림 - 대기 등록 완료] 수신인: {}, 대기번호: {}번, 부스: {}", phoneNumber, waitingNumber, boothName);

        String messageText = String.format("[대기 등록] '%s' 부스 대기 등록 완료!\n대기번호: %d번\n내 앞 대기팀: %d팀\n순서가 되면 문자로 알려드리겠습니다.", 
                boothName, waitingNumber, Math.max(0, currentWaitingCount - 1));

        sendSms(phoneNumber, messageText);
    }

    /**
     * [자동 알림] 대기 순번 임박 알림 (내 앞에 2팀 이하로 남았을 때 자동으로 트리거)
     */
    @Async
    public void sendNearAlertNotification(String phoneNumber, Long waitingNumber, String boothName, int aheadCount) {
        log.info("[Solapi 자동 알림 - 순서 임박] 수신인: {}, 대기번호: {}번, 부스: {}, 앞대기팀수: {}팀", 
                phoneNumber, waitingNumber, boothName, aheadCount);

        String messageText = String.format("[대기 임박] '%s' 부스의 대기 %d번 고객님!\n현재 고객님 앞에 대기 중인 팀이 %d팀 남았습니다.\n곧 입장 순서가 되오니 부스 근처에서 대기해주시기 바랍니다.", 
                boothName, waitingNumber, aheadCount);

        sendSms(phoneNumber, messageText);
    }

    /**
     * [상인] 대기 고객 호출 알림톡/SMS 발송
     */
    @Async
    public void sendWaitingCallNotification(String phoneNumber, Long waitingNumber, String boothName) {
        log.info("[Solapi 알림 - 고객 호출] 수신인: {}, 대기번호: {}번, 부스: {}", phoneNumber, waitingNumber, boothName);

        String messageText = String.format("[대기 안내] '%s' 부스의 대기 %d번 고객님, 곧 순서가 되오니 부스 근처에서 대기해주시기 바랍니다.", 
                boothName, waitingNumber);

        sendSms(phoneNumber, messageText);
    }

    private void sendSms(String toPhoneNumber, String text) {
        String cleanTo = toPhoneNumber.replace("-", "").trim();
        
        if (!isSmsSendingEnabled) {
            log.info("[Solapi API - Disabled] SMS 발송 기능이 비활성화되어 있습니다. 발송 생략 (텍스트: {})", text);
            return;
        }

        if (solapiApiSecret == null || solapiApiSecret.trim().isEmpty() || senderNumber == null || senderNumber.trim().isEmpty()) {
            log.warn("[Solapi API - Config Missing] api-secret 또는 sender-number 설정이 비어있어 실제 문자를 전송하지 못했습니다. " +
                     "application.yml 또는 환경 변수 등에 api-secret과 sender-number를 입력해 주십시오. (텍스트: {})", text);
            return;
        }

        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            
            // Authorization Header 생성
            String salt = java.util.UUID.randomUUID().toString().replaceAll("-", "");
            String date = java.time.Instant.now().toString(); // ISO8601 UTC
            String signature = getSignature(solapiApiSecret, date, salt);
            
            String authHeader = String.format("HMAC-SHA256 apiKey=%s, date=%s, salt=%s, signature=%s", 
                    solapiApiKey, date, salt, signature);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.set("Authorization", authHeader);

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            java.util.Map<String, String> message = new java.util.HashMap<>();
            message.put("to", cleanTo);
            message.put("from", senderNumber.replace("-", "").trim());
            message.put("text", text);
            body.put("message", message);

            org.springframework.http.HttpEntity<java.util.Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(body, headers);
            String url = "https://api.solapi.com/messages/v4/send";

            log.info("[Solapi API Request] URL: {}, AuthHeader: {}", url, authHeader);
            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.postForEntity(url, entity, java.util.Map.class);
            log.info("[Solapi API Response] Status: {}, Body: {}", response.getStatusCode(), response.getBody());
        } catch (Exception e) {
            log.error("[Solapi API] SMS 전송 중 에러 발생: {}", e.getMessage(), e);
        }
    }

    private String getSignature(String apiSecret, String date, String salt) {
        try {
            String message = date + salt;
            javax.crypto.Mac sha256_HMAC = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secret_key = new javax.crypto.spec.SecretKeySpec(
                    apiSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] rawHmac = sha256_HMAC.doFinal(message.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : rawHmac) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Signature generation failed", e);
        }
    }

    /**
     * 웹 대시보드 및 테스트 도구를 통한 동적 설정 변경 기능 지원
     */
    public synchronized void updateConfig(String apiKey, String apiSecret, String senderNumber, boolean enabled) {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            this.solapiApiKey = apiKey.trim();
        }
        if (apiSecret != null && !apiSecret.trim().isEmpty()) {
            this.solapiApiSecret = apiSecret.trim();
        }
        if (senderNumber != null && !senderNumber.trim().isEmpty()) {
            this.senderNumber = senderNumber.trim();
        }
        this.isSmsSendingEnabled = enabled;
        log.info("[Solapi 설정 실시간 업데이트] API Key: {}, 발신번호: {}, 활성화: {}", 
                this.solapiApiKey, this.senderNumber, this.isSmsSendingEnabled);
    }

    /**
     * 웹 대시보드용 안전한 설정 조회 기능 (Secret Key는 마스킹 처리)
     */
    public synchronized java.util.Map<String, Object> getConfig() {
        java.util.Map<String, Object> config = new java.util.HashMap<>();
        config.put("apiKey", this.solapiApiKey);
        config.put("apiSecret", (this.solapiApiSecret == null || this.solapiApiSecret.trim().isEmpty()) ? "" : "●●●●●●●●");
        config.put("senderNumber", this.senderNumber);
        config.put("enabled", this.isSmsSendingEnabled);
        return config;
    }
}
