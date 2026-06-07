package com.festival.waiting.domain;

public enum WaitingStatus {
    WAITING("대기중"),
    CALLED("호출완료"),
    COMPLETED("방문완료"),
    CANCELLED("취소됨");

    private final String description;

    WaitingStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
