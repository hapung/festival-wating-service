package com.festival.waiting.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerTokenRequest {
    private String phoneNumber;
    private Long festivalId;
}
