package com.festival.waiting.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class FestivalRegisterRequest {
    private String name;
    private String description;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
}
