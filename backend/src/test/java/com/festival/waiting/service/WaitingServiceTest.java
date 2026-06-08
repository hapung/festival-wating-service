package com.festival.waiting.service;

import com.festival.waiting.domain.Booth;
import com.festival.waiting.domain.Festival;
import com.festival.waiting.domain.Waiting;
import com.festival.waiting.repository.BoothRepository;
import com.festival.waiting.repository.WaitingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaitingServiceTest {

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private WaitingRepository waitingRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private WaitingService waitingService;

    private Festival festival;
    private Booth booth;

    @BeforeEach
    void setUp() {
        festival = new Festival(
                "양평 산나물 축제", 
                "산나물 축제", 
                "양평군 용문산", 
                LocalDate.now(), 
                LocalDate.now().plusDays(5)
        );
        booth = new Booth(festival, "비빔밥 부스", "건강 비빔밥", "먹거리존 B-12");
    }

    @Test
    @DisplayName("웨이팅 등록 성공 시 대기 번호와 실시간 대기 카운트가 각각 1씩 올바르게 증가해야 합니다.")
    void registerWaitingSuccess() {
        // given
        when(boothRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(booth));
        when(waitingRepository.save(any(Waiting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        Waiting result = waitingService.registerWaiting(1L, "010-1234-5678");

        // then
        assertThat(result.getWaitingNumber()).isEqualTo(1L);
        assertThat(booth.getCurrentWaitingCount()).isEqualTo(1);
        verify(boothRepository, times(1)).findByIdWithPessimisticLock(1L);
        verify(waitingRepository, times(1)).save(any(Waiting.class));
    }
}
