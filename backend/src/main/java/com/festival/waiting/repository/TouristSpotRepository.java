package com.festival.waiting.repository;

import com.festival.waiting.domain.TouristSpot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TouristSpotRepository extends JpaRepository<TouristSpot, Long> {
}
