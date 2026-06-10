package com.festival.waiting.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ExternalApiService {

    @Value("${api.tour.service-key}")
    private String tourServiceKey;

    @Value("${api.kakao.rest-api-key}")
    private String kakaoRestApiKey;

    private final RestTemplate restTemplate;

    public ExternalApiService() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(500); // 500ms
        factory.setReadTimeout(500);    // 500ms
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Kakao Local API를 이용하여 지명이나 한글 주소를 위도/경도 좌표로 변환합니다.
     * @param address 변환할 주소 (예: "인천 남동구 예술로 172")
     * @return 위도(lat), 경도(lon) 좌표 Map
     */
    public Map<String, Double> getCoordinatesFromAddress(String address) {
        log.info("[Kakao Local API] 주소 -> 좌표 변환 요청: {}", address);
        Map<String, Double> coords = new HashMap<>();
        
        try {
            String url = "https://dapi.kakao.com/v2/local/search/address.json";
            URI uri = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("query", address)
                    .build()
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(uri, HttpMethod.GET, entity, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("documents")) {
                List<Map<String, Object>> documents = (List<Map<String, Object>>) body.get("documents");
                if (!documents.isEmpty()) {
                    Map<String, Object> doc = documents.get(0);
                    double lon = Double.parseDouble(doc.get("x").toString()); // 경도
                    double lat = Double.parseDouble(doc.get("y").toString()); // 위도
                    coords.put("lat", lat);
                    coords.put("lon", lon);
                    log.info("[Kakao Local API] 변환 성공 - 위도: {}, 경도: {}", lat, lon);
                    return coords;
                }
            }
        } catch (Exception e) {
            log.warn("[Kakao Local API] 좌표 변환 API 호출 실패(키 미승인 혹은 네트워크 에러). 로컬 텍스트 사전 폴백을 진행합니다. 에러: {}", e.getMessage());
        }

        // 공공 API 실패 시 테스트 편의를 위해 입력 텍스트 기반으로 전국 주요 좌표 매핑 폴백 제공
        String addr = address != null ? address : "";
        if (addr.contains("양평") || addr.contains("용문")) {
            coords.put("lat", 37.5451);
            coords.put("lon", 127.5422);
            log.info("[로컬 폴백 사전] '양평/용문' 매핑 완료 - 위도: 37.5451, 경도: 127.5422");
        } else if (addr.contains("강릉") || addr.contains("강원")) {
            coords.put("lat", 37.7472);
            coords.put("lon", 128.8961);
            log.info("[로컬 폴백 사전] '강릉/강원' 매핑 완료 - 위도: 37.7472, 경도: 128.8961");
        } else if (addr.contains("보령") || addr.contains("대천") || addr.contains("충남")) {
            coords.put("lat", 36.3054);
            coords.put("lon", 126.5147);
            log.info("[로컬 폴백 사전] '보령/대천' 매핑 완료 - 위도: 36.3054, 경도: 126.5147");
        } else if (addr.contains("부산") || addr.contains("해운대")) {
            coords.put("lat", 35.1796);
            coords.put("lon", 129.0756);
            log.info("[로컬 폴백 사전] '부산' 매핑 완료 - 위도: 35.1796, 경도: 129.0756");
        } else {
            // 기본값 서울시청
            coords.put("lat", 37.5665);
            coords.put("lon", 126.9780);
            log.info("[로컬 폴백 사전] '서울' 매핑 완료 - 위도: 37.5665, 경도: 126.9780");
        }
        return coords;
    }

    /**
     * 하버사인(Haversine) 공식을 활용하여 두 좌표 간의 직선 물리적 거리(km)를 구합니다.
     */
    public double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // 지구 반경 (km)
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * 공공데이터포털 TourAPI 4.0을 이용하여 특정 날짜(또는 현재 날짜) 이후 시작하는 축제 정보 목록을 가져옵니다.
     * @param startDate 조회 시작일 (yyyyMMdd 형식, 예: "20260601")
     * @return 축제 정보 목록
     */
    public List<Map<String, Object>> fetchRealFestivals(String startDate) {
        log.info("[TourAPI 4.0] 행사/축제 정보 조회 요청 시작일: {}", startDate);
        List<Map<String, Object>> festivals = new ArrayList<>();

        try {
            // TourAPI 4.0 행사검색 엔드포인트
            String url = "http://apis.data.go.kr/B551011/KorService1/searchFestival1";
            URI uri = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("serviceKey", tourServiceKey)
                    .queryParam("MobileOS", "ETC")
                    .queryParam("MobileApp", "FestivalWaitingApp")
                    .queryParam("_type", "json")
                    .queryParam("eventStartDate", startDate)
                    .queryParam("arrange", "A")
                    .queryParam("numOfRows", 50)
                    .build(true) // 인코딩된 serviceKey가 double-encoding되지 않도록 true 처리
                    .toUri();

            ResponseEntity<Map> response = restTemplate.getForEntity(uri, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("response")) {
                Map<String, Object> res = (Map<String, Object>) body.get("response");
                Map<String, Object> resBody = (Map<String, Object>) res.get("body");
                if (resBody != null && resBody.containsKey("items")) {
                    Object itemsObj = resBody.get("items");
                    if (itemsObj instanceof Map) {
                        Map<String, Object> itemsMap = (Map<String, Object>) itemsObj;
                        List<Map<String, Object>> itemList = (List<Map<String, Object>>) itemsMap.get("item");
                        log.info("[TourAPI 4.0] 실제 축제 데이터 {}건 로드 완료", itemList.size());
                        return itemList;
                    }
                }
            }
        } catch (Exception e) {
            log.error("[TourAPI 4.0] API 호출 실패. 더미 축제 데이터를 생성하여 폴백합니다. 에러: {}", e.getMessage());
        }

        // 외부 API 실패 시 폴백 더미 데이터 생성
        return createDummyFestivals(startDate);
    }

    /**
     * 위치 기반 주변 관광지 조회 API를 호출해 축제 장소 주변의 관광지를 가져옵니다.
     */
    public List<Map<String, Object>> fetchNearbyAttractions(double mapX, double mapY, int radius) {
        log.info("[TourAPI 4.0] 위치 기반 주변 관광지 조회 요청 - 경도: {}, 위도: {}, 반경: {}m", mapX, mapY, radius);
        try {
            String url = "http://apis.data.go.kr/B551011/KorService1/locationBasedList1";
            URI uri = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("serviceKey", tourServiceKey)
                    .queryParam("MobileOS", "ETC")
                    .queryParam("MobileApp", "FestivalWaitingApp")
                    .queryParam("_type", "json")
                    .queryParam("mapX", mapX)
                    .queryParam("mapY", mapY)
                    .queryParam("radius", radius)
                    .queryParam("numOfRows", 5)
                    .build(true)
                    .toUri();

            ResponseEntity<Map> response = restTemplate.getForEntity(uri, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("response")) {
                Map<String, Object> res = (Map<String, Object>) body.get("response");
                Map<String, Object> resBody = (Map<String, Object>) res.get("body");
                if (resBody != null && resBody.containsKey("items")) {
                    Object itemsObj = resBody.get("items");
                    if (itemsObj instanceof Map) {
                        Map<String, Object> itemsMap = (Map<String, Object>) itemsObj;
                        List<Map<String, Object>> itemList = (List<Map<String, Object>>) itemsMap.get("item");
                        log.info("[TourAPI 4.0] 위치 기반 주변 관광지 {}건 로드 완료", itemList.size());
                        return itemList;
                    }
                }
            }
        } catch (Exception e) {
            log.error("[TourAPI 4.0] 위치기반 API 호출 실패. 더미 관광지 데이터로 폴백합니다. 에러: {}", e.getMessage());
        }

        return createDummyAttractions();
    }

    private List<Map<String, Object>> createDummyFestivals(String baseDateStr) {
        List<Map<String, Object>> list = new ArrayList<>();
        
        // 올해(2026년) 전국 대표 축제들을 날짜 고정으로 16종 세팅하여 풍부한 캐싱 및 시나리오 테스트를 지원합니다.
        Map<String, Object> f1 = new HashMap<>();
        f1.put("title", "양평 용문산 산나물 축제");
        f1.put("addr1", "경기도 양평군 용문면 용문산로 110-2");
        f1.put("mapx", "127.5422");
        f1.put("mapy", "37.5451");
        f1.put("eventstartdate", "20260501");
        f1.put("eventenddate", "20260515");
        list.add(f1);

        Map<String, Object> f2 = new HashMap<>();
        f2.put("title", "강릉 단오제");
        f2.put("addr1", "강원도 강릉시 단오장길 1");
        f2.put("mapx", "128.8961");
        f2.put("mapy", "37.7472");
        f2.put("eventstartdate", "20260601");
        f2.put("eventenddate", "20260615");
        list.add(f2);

        Map<String, Object> f3 = new HashMap<>();
        f3.put("title", "보령 머드 축제");
        f3.put("addr1", "충청남도 보령시 머드로 123");
        f3.put("mapx", "126.5147");
        f3.put("mapy", "36.3054");
        f3.put("eventstartdate", "20260715");
        f3.put("eventenddate", "20260730");
        list.add(f3);

        Map<String, Object> f4 = new HashMap<>();
        f4.put("title", "부산 해운대 모래 축제");
        f4.put("addr1", "부산광역시 해운대구 우동 1");
        f4.put("mapx", "129.0756");
        f4.put("mapy", "35.1796");
        f4.put("eventstartdate", "20260520");
        f4.put("eventenddate", "20260530");
        list.add(f4);

        Map<String, Object> f5 = new HashMap<>();
        f5.put("title", "서울 장미 축제");
        f5.put("addr1", "서울특별시 중랑구 중랑천로 332");
        f5.put("mapx", "127.0768");
        f5.put("mapy", "37.6066");
        f5.put("eventstartdate", "20260515");
        f5.put("eventenddate", "20260524");
        list.add(f5);

        Map<String, Object> f6 = new HashMap<>();
        f6.put("title", "진주 남강 유등 축제");
        f6.put("addr1", "경상남도 진주시 남강로 626");
        f6.put("mapx", "128.0841");
        f6.put("mapy", "35.1884");
        f6.put("eventstartdate", "20261005");
        f6.put("eventenddate", "20261020");
        list.add(f6);

        Map<String, Object> f7 = new HashMap<>();
        f7.put("title", "수원 화성 문화제");
        f7.put("addr1", "경기도 수원시 팔달구 정조로 825");
        f7.put("mapx", "127.0122");
        f7.put("mapy", "37.2825");
        f7.put("eventstartdate", "20261009");
        f7.put("eventenddate", "20261012");
        list.add(f7);

        Map<String, Object> f8 = new HashMap<>();
        f8.put("title", "대구 치맥 페스티벌");
        f8.put("addr1", "대구광역시 달서구 공원순환로 201");
        f8.put("mapx", "128.5583");
        f8.put("mapy", "35.8465");
        f8.put("eventstartdate", "20260703");
        f8.put("eventenddate", "20260707");
        list.add(f8);

        Map<String, Object> f9 = new HashMap<>();
        f9.put("title", "인천 펜타포트 락 페스티벌");
        f9.put("addr1", "인천광역시 연수구 센트럴로 350");
        f9.put("mapx", "126.6346");
        f9.put("mapy", "37.3948");
        f9.put("eventstartdate", "20260802");
        f9.put("eventenddate", "20260804");
        list.add(f9);

        Map<String, Object> f10 = new HashMap<>();
        f10.put("title", "제주 들불 축제");
        f10.put("addr1", "제주특별자치도 제주시 애월읍 평화로 2718-50");
        f10.put("mapx", "126.3572");
        f10.put("mapy", "33.3675");
        f10.put("eventstartdate", "20260307");
        f10.put("eventenddate", "20260310");
        list.add(f10);

        Map<String, Object> f11 = new HashMap<>();
        f11.put("title", "안동 국제 탈춤 페스티벌");
        f11.put("addr1", "경상북도 안동시 육사로 239");
        f11.put("mapx", "128.7198");
        f11.put("mapy", "36.5621");
        f11.put("eventstartdate", "20260927");
        f11.put("eventenddate", "20261006");
        list.add(f11);

        Map<String, Object> f12 = new HashMap<>();
        f12.put("title", "김제 지평선 축제");
        f12.put("addr1", "전라북도 김제시 부량면 벽골제로 442");
        f12.put("mapx", "126.8624");
        f12.put("mapy", "35.7892");
        f12.put("eventstartdate", "20260927");
        f12.put("eventenddate", "20261003");
        list.add(f12);

        Map<String, Object> f13 = new HashMap<>();
        f13.put("title", "담양 대나무 축제");
        f13.put("addr1", "전라남도 담양군 담양읍 죽녹원로 119");
        f13.put("mapx", "126.9842");
        f13.put("mapy", "35.3283");
        f13.put("eventstartdate", "20260503");
        f13.put("eventenddate", "20260507");
        list.add(f13);

        Map<String, Object> f14 = new HashMap<>();
        f14.put("title", "화천 산천어 축제");
        f14.put("addr1", "강원도 화천군 화천읍 산천어길 137");
        f14.put("mapx", "127.7011");
        f14.put("mapy", "38.1062");
        f14.put("eventstartdate", "20260109");
        f14.put("eventenddate", "20260201");
        list.add(f14);

        Map<String, Object> f15 = new HashMap<>();
        f15.put("title", "춘천 마임 축제");
        f15.put("addr1", "강원도 춘천시 춘천로 112");
        f15.put("mapx", "127.7291");
        f15.put("mapy", "37.8813");
        f15.put("eventstartdate", "20260526");
        f15.put("eventenddate", "20260602");
        list.add(f15);

        Map<String, Object> f16 = new HashMap<>();
        f16.put("title", "금산 세계 인삼 축제");
        f16.put("addr1", "충청남도 금산군 금산읍 인삼광장로 30");
        f16.put("mapx", "127.4932");
        f16.put("mapy", "36.1025");
        f16.put("eventstartdate", "20261004");
        f16.put("eventenddate", "20261013");
        list.add(f16);

        return list;
    }

    private List<Map<String, Object>> createDummyAttractions() {
        List<Map<String, Object>> list = new ArrayList<>();
        
        Map<String, Object> a1 = new HashMap<>();
        a1.put("title", "용문사 천년 은행나무");
        a1.put("addr1", "경기도 양평군 용문면 용문산로 782");
        a1.put("dist", "1200"); // 1.2km
        list.add(a1);

        Map<String, Object> a2 = new HashMap<>();
        a2.put("title", "들꽃수목원");
        a2.put("addr1", "경기도 양평군 양평읍 수목원길 16");
        a2.put("dist", "2500"); // 2.5km
        list.add(a2);

        return list;
    }

    /**
     * 특정 관광지의 실시간 방문 집중률(혼잡도 지수: 0 ~ 100)을 조회합니다.
     * 한국관광공사 관광지 집중률 방문자 추이 예측 정보 OpenAPI를 연동합니다.
     */
    public int getTouristSpotConcentrationRate(String spotName) {
        log.info("[TourAPI 4.0] 관광지 집중률 조회 요청: {}", spotName);
        try {
            String url = "http://apis.data.go.kr/B551011/TarConcentrationService/tarConcentration";
            String todayStr = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
            
            URI uri = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("serviceKey", tourServiceKey)
                    .queryParam("MobileOS", "ETC")
                    .queryParam("MobileApp", "FestivalWaitingApp")
                    .queryParam("_type", "json")
                    .queryParam("baseDate", todayStr)
                    .queryParam("numOfRows", 1)
                    .build(true)
                    .toUri();

            ResponseEntity<Map> response = restTemplate.getForEntity(uri, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("response")) {
                Map<String, Object> res = (Map<String, Object>) body.get("response");
                Map<String, Object> resBody = (Map<String, Object>) res.get("body");
                if (resBody != null && resBody.containsKey("items")) {
                    Object itemsObj = resBody.get("items");
                    if (itemsObj instanceof Map) {
                        Map<String, Object> itemsMap = (Map<String, Object>) itemsObj;
                        List<Map<String, Object>> itemList = (List<Map<String, Object>>) itemsMap.get("item");
                        if (itemList != null && !itemList.isEmpty()) {
                            Map<String, Object> item = itemList.get(0);
                            if (item.containsKey("estmRate")) {
                                int rate = (int) Double.parseDouble(item.get("estmRate").toString());
                                log.info("[TourAPI] 관광지 집중률 파싱 성공 - {}: {}%", spotName, rate);
                                return rate;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[TourAPI] 관광지 집중률 OpenAPI 호출 실패. 더미 값을 생성합니다. 에러: {}", e.getMessage());
        }

        // 실패 시, 일관된 예측값을 제공하기 위해 장소 이름의 해시코드를 이용해 30~95 범위의 혼잡도를 반환합니다.
        return Math.abs(spotName.hashCode()) % 65 + 30;
    }
}
