package com.festival.waiting.repository;

import com.festival.waiting.domain.Festival;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FestivalRepository extends JpaRepository<Festival, Long> {
    Optional<Festival> findByName(String name);
}
