package com.festival.waiting.repository;

import com.festival.waiting.domain.Booth;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BoothRepository extends JpaRepository<Booth, Long> {

    /**
     * 부스의 대기 신청 및 번호 발급 시 동시성 충돌을 차단하기 위한 비관적 락(Pessimistic Lock) 조회 메서드
     * SELECT ... FOR UPDATE 쿼리가 실행되어 트랜잭션이 완료될 때까지 다른 세션의 수정을 차단합니다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booth b where b.id = :id")
    Optional<Booth> findByIdWithPessimisticLock(@Param("id") Long id);

    Optional<Booth> findByMerchantId(Long merchantId);
}
