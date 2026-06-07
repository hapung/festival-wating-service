package com.festival.waiting.repository;

import com.festival.waiting.domain.Festival;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FestivalRepository extends JpaRepository<Festival, Long> {
}
