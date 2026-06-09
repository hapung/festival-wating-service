package com.festival.waiting.service;

import com.festival.waiting.domain.Booth;
import com.festival.waiting.domain.Festival;
import com.festival.waiting.domain.Product;
import com.festival.waiting.domain.TouristSpot;
import com.festival.waiting.dto.BoothRegisterRequest;
import com.festival.waiting.dto.FestivalRecommendResponse;
import com.festival.waiting.dto.LocationRecommendRequest;
import com.festival.waiting.repository.BoothRepository;
import com.festival.waiting.repository.FestivalRepository;
import com.festival.waiting.repository.ProductRepository;
import com.festival.waiting.repository.TouristSpotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;

@Slf4j
@Service
@RequiredArgsConstructor
public class FestivalService {

    private final FestivalRepository festivalRepository;
    private final TouristSpotRepository touristSpotRepository;
    private final BoothRepository boothRepository;
    private final ProductRepository productRepository;
    private final ExternalApiService externalApiService;
    private final com.festival.waiting.repository.UserRepository userRepository;

    /**
     * 위치 및 사용가능 시간을 기준으로 축제를 추천하고, 해당 축제의 주변 관광지 목록도 가져옵니다.
     * 외부 TourAPI 4.0 및 Kakao Local API를 연계합니다.
     */
    /**
     * 애플리케이션 시작 시점에 올해의 대표 축제 데이터(또는 외부 API 연계)를 미리 캐싱하여 H2 DB에 밀어 넣습니다.
     * 이를 통해 추천 API를 호출하지 않거나 필터링이 수행되기 전에도 전체 축제 목록을 정상 조회할 수 있습니다.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initFestivalCache() {
        log.info("[축제 캐시 초기화] H2 DB에 기본 4대 축제 데이터 미리 구축 시작");
        List<Map<String, Object>> rawFestivals = externalApiService.fetchRealFestivals("20260101");
        for (Map<String, Object> raw : rawFestivals) {
            if (raw.get("title") == null || raw.get("eventstartdate") == null || raw.get("eventenddate") == null) {
                continue;
            }
            String title = raw.get("title").toString();
            String addr = raw.get("addr1") != null ? raw.get("addr1").toString() : "위치 정보 없음";
            String startStr = raw.get("eventstartdate").toString();
            String endStr = raw.get("eventenddate").toString();

            LocalDate start = LocalDate.parse(startStr, DateTimeFormatter.ofPattern("yyyyMMdd"));
            LocalDate end = LocalDate.parse(endStr, DateTimeFormatter.ofPattern("yyyyMMdd"));

            festivalRepository.findByName(title)
                    .orElseGet(() -> {
                        Festival newFest = new Festival(title, title + " 축제입니다.", addr, start, end);
                        festivalRepository.save(newFest);
                        
                        double festLon = Double.parseDouble(raw.get("mapx").toString());
                        double festLat = Double.parseDouble(raw.get("mapy").toString());
                        List<Map<String, Object>> rawAttractions = externalApiService.fetchNearbyAttractions(festLon, festLat, 3000);
                        for (Map<String, Object> attr : rawAttractions) {
                            String attrName = attr.get("title").toString();
                            String attrAddr = attr.get("addr1") != null ? attr.get("addr1").toString() : addr;
                            double attrDistKm = attr.containsKey("dist") ? Double.parseDouble(attr.get("dist").toString()) / 1000.0 : 1.5;
                            int congestion = externalApiService.getTouristSpotConcentrationRate(attrName);
                            TouristSpot spot = new TouristSpot(newFest, attrName, attrName + " 주변 관광지입니다.", attrAddr, attrDistKm, congestion);
                            touristSpotRepository.save(spot);
                        }
                        return newFest;
                    });
        }
        log.info("[축제 캐시 초기화] 완료. 현재 캐싱된 축제 개수: {}개", festivalRepository.count());
    }

    @Transactional
    public List<FestivalRecommendResponse> recommendFestivals(LocationRecommendRequest request) {
        log.info("[축제 추천 서비스 시작] 요청 조건: 주소='{}', 가용시간='{}'시간, 선호거리='{}'km",
                request.getAddress(), request.getAvailableHours(), request.getMaxDistanceKm());

        // 1. 기준 좌표 설정 (좌표가 없으면 주소로 Kakao Local API 호출)
        double userLat = request.getLatitude() != null ? request.getLatitude() : 0.0;
        double userLon = request.getLongitude() != null ? request.getLongitude() : 0.0;

        if (request.getLatitude() == null || request.getLongitude() == null) {
            if (request.getAddress() != null && !request.getAddress().isEmpty()) {
                Map<String, Double> coords = externalApiService.getCoordinatesFromAddress(request.getAddress());
                userLat = coords.get("lat");
                userLon = coords.get("lon");
            } else {
                // 기본값 (서울시청)
                userLat = 37.5665;
                userLon = 126.9780;
            }
        }

        // 2. 외부 공공데이터 포털(TourAPI 4.0)을 통해 축제 데이터 동적 수집
        LocalDate visitDate = request.getVisitDate() != null ? request.getVisitDate() : LocalDate.now();
        String queryDateStr = visitDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        List<Map<String, Object>> rawFestivals = externalApiService.fetchRealFestivals(queryDateStr);

        List<FestivalRecommendResponse> recommendations = new ArrayList<>();
        double maxDist = request.getMaxDistanceKm() != null ? request.getMaxDistanceKm() : 50.0;

        for (Map<String, Object> raw : rawFestivals) {
            double festLon = Double.parseDouble(raw.get("mapx").toString());
            double festLat = Double.parseDouble(raw.get("mapy").toString());

            // 3. 거리 계산 (Kakao Local API 기반 Haversine공식 사용)
            double distance = externalApiService.calculateDistanceKm(userLat, userLon, festLat, festLon);

            // 4. 날짜 및 로컬 DB 동기화 (필터링 여부와 상관없이 무조건 캐싱하여 전체 축제 목록을 동기화)
            if (raw.get("title") == null || raw.get("eventstartdate") == null || raw.get("eventenddate") == null) {
                continue;
            }
            String title = raw.get("title").toString();
            String addr = raw.get("addr1") != null ? raw.get("addr1").toString() : "위치 정보 없음";
            String startStr = raw.get("eventstartdate").toString();
            String endStr = raw.get("eventenddate").toString();

            LocalDate start = LocalDate.parse(startStr, DateTimeFormatter.ofPattern("yyyyMMdd"));
            LocalDate end = LocalDate.parse(endStr, DateTimeFormatter.ofPattern("yyyyMMdd"));

            // DB 검색 또는 저장
            Festival festival = festivalRepository.findByName(title)
                    .orElseGet(() -> {
                        Festival newFest = new Festival(title, title + " 축제입니다.", addr, start, end);
                        festivalRepository.save(newFest);
                        
                        // 주변 관광지 로드 및 저장 (반경 3km 내)
                        List<Map<String, Object>> rawAttractions = externalApiService.fetchNearbyAttractions(festLon, festLat, 3000);
                        for (Map<String, Object> attr : rawAttractions) {
                            String attrName = attr.get("title").toString();
                            String attrAddr = attr.get("addr1") != null ? attr.get("addr1").toString() : addr;
                            double attrDistKm = attr.containsKey("dist") ? Double.parseDouble(attr.get("dist").toString()) / 1000.0 : 1.5;
                            int congestion = externalApiService.getTouristSpotConcentrationRate(attrName);
                            TouristSpot spot = new TouristSpot(newFest, attrName, attrName + " 주변 관광지입니다.", attrAddr, attrDistKm, congestion);
                            touristSpotRepository.save(spot);
                        }
                        return newFest;
                    });

            // [사용자 요구 반영] "기간 상관없이 올해 축제 다" 
            // 추천 시에도 날짜에 제한을 두지 않고, 거리 조건만 맞으면 모두 반환합니다.
            // (기존의 visitDate를 기준으로 한 날짜 필터링 구문을 완화)
            log.info("[추천] '{}' 축제는 기간 필터링(무제한)을 적용하지 않고 추천 대상에 노출됩니다.", title);

            if (distance <= maxDist) {
                recommendations.add(FestivalRecommendResponse.from(festival, Math.round(distance * 10) / 10.0));
            }
        }

        return recommendations;
    }

    /**
     * [상인] 자신의 상점(부스)과 메뉴 리스트를 축제에 등록합니다.
     */
    @Transactional
    public Booth registerBooth(BoothRegisterRequest request, String merchantUsername) {
        log.info("[상인 부스 등록] 축제 ID: {}, 상인 ID: {}, 부스명: {}", request.getFestivalId(), merchantUsername, request.getName());

        com.festival.waiting.domain.User merchant = userRepository.findByUsername(merchantUsername)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상인 계정입니다: " + merchantUsername));

        if (merchant.getRole() != com.festival.waiting.domain.User.Role.ROLE_MERCHANT || !merchant.isApproved()) {
            throw new IllegalArgumentException("승인 완료된 상인(MERCHANT)만 부스를 등록할 수 있습니다. 주최측의 승인을 확인해 주세요.");
        }

        Festival festival = festivalRepository.findById(request.getFestivalId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 축제 ID입니다: " + request.getFestivalId()));

        Booth booth = new Booth(festival, request.getName(), request.getDescription(), request.getLocationDescription(), merchant, request.getImageUrl());
        Booth savedBooth = boothRepository.save(booth);

        if (request.getProducts() != null) {
            for (BoothRegisterRequest.ProductDto prodDto : request.getProducts()) {
                Product product = new Product(
                        savedBooth,
                        prodDto.getName(),
                        prodDto.getPrice(),
                        prodDto.getDescription(),
                        prodDto.getIsSpecialty(),
                        prodDto.getImageUrl()
                );
                productRepository.save(product);
                savedBooth.getProducts().add(product);
            }
        }

        return savedBooth;
    }

    /**
     * [사용자] 특정 축제에 속한 모든 등록 부스 및 메뉴판, 실시간 웨이팅 현황을 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<Booth> getBoothsByFestival(Long festivalId) {
        log.info("[부스 목록 조회] 축제 ID: {}", festivalId);
        Festival festival = festivalRepository.findById(festivalId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 축제 ID입니다: " + festivalId));
        return festival.getBooths();
    }

    /**
     * [사용자/QR진입] 부스 고유 식별 ID로 상세 정보를 조회합니다.
     */
    @Transactional(readOnly = true)
    public Booth getBoothDetail(Long boothId) {
        log.info("[부스 상세 조회] 부스 ID: {}", boothId);
        return boothRepository.findById(boothId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부스 ID입니다: " + boothId));
    }

    /**
     * [사용자/테스트] 시스템 DB에 캐싱 및 저장된 전체 축제 목록을 가져옵니다.
     */
    @Transactional(readOnly = true)
    public List<Festival> getAllFestivals() {
        log.info("[전체 축제 목록 조회] DB 조회 실행");
        return festivalRepository.findAll();
    }

    /**
     * [사용자/테스트] KT 예측 오픈API를 호출해 특정 관광지의 실시간 혼잡도를 구합니다.
     */
    @Transactional(readOnly = true)
    public int getSpotCongestion(String spotName) {
        log.info("[관광지 단독 혼잡도 조회] 관광지명: {}", spotName);
        return externalApiService.getTouristSpotConcentrationRate(spotName);
    }

    /**
     * [주최측] 축제를 수동으로 신규 등록합니다.
     */
    @Transactional
    public Festival createFestival(String name, String description, String location, LocalDate startDate, LocalDate endDate, String organizerUsername) {
        log.info("[축제 수동 등록] 주최자 ID: {}, 축제명: {}", organizerUsername, name);
        com.festival.waiting.domain.User organizer = userRepository.findByUsername(organizerUsername)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 주최자입니다: " + organizerUsername));

        if (organizer.getRole() != com.festival.waiting.domain.User.Role.ROLE_ORGANIZER || !organizer.isApproved()) {
            throw new IllegalArgumentException("승인 완료된 주최자만 축제를 등록할 수 있습니다.");
        }

        Festival festival = new Festival(name, description, location, startDate, endDate, organizer);
        return festivalRepository.save(festival);
    }

    /**
     * [상인] 자신의 상점(부스)과 메뉴 리스트를 수정합니다.
     */
    @Transactional
    public Booth updateBooth(Long boothId, BoothRegisterRequest request, String merchantUsername) {
        log.info("[상인 부스 수정] 부스 ID: {}, 상인 ID: {}, 부스명: {}", boothId, merchantUsername, request.getName());

        com.festival.waiting.domain.User merchant = userRepository.findByUsername(merchantUsername)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상인 계정입니다: " + merchantUsername));

        Booth booth = boothRepository.findById(boothId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부스 ID입니다: " + boothId));

        // 검증: 본인의 부스만 수정할 수 있어야 합니다 (어드민 또는 승인된 본인)
        if (merchant.getRole() != com.festival.waiting.domain.User.Role.ROLE_ADMIN && 
            (booth.getMerchant() == null || !booth.getMerchant().getUsername().equals(merchantUsername))) {
            throw new IllegalArgumentException("자신의 부스 정보만 수정할 수 있습니다.");
        }

        Festival festival = festivalRepository.findById(request.getFestivalId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 축제 ID입니다: " + request.getFestivalId()));

        // 부스 정보 업데이트
        booth.updateInfo(festival, request.getName(), request.getDescription(), request.getLocationDescription(), request.getImageUrl());

        // 기존 상품 제거 후 신규 추가
        booth.getProducts().clear();
        if (request.getProducts() != null) {
            for (BoothRegisterRequest.ProductDto prodDto : request.getProducts()) {
                Product product = new Product(
                        booth,
                        prodDto.getName(),
                        prodDto.getPrice(),
                        prodDto.getDescription(),
                        prodDto.getIsSpecialty(),
                        prodDto.getImageUrl()
                );
                booth.getProducts().add(product);
            }
        }

        return boothRepository.save(booth);
    }
}
