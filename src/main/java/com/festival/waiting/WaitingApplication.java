package com.festival.waiting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync // 비동기 알림톡 발송(@Async) 처리를 위한 필수 활성화 어노테이션
@SpringBootApplication
public class WaitingApplication {

    public static void main(String[] args) {
        SpringApplication.run(WaitingApplication.class, args);
    }
}
