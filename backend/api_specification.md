# 백엔드 API 레퍼런스 명세서 (API Specification)

## 1. API 주소 및 공통 규격
*   **개발용 서버 주소**: `http://localhost:8080`
*   **HTTP Header**: `Content-Type: application/json`

---

## 2. API 상세 명세

### 1) [GET] 캐싱된 전체 축제 목록 조회
*   **Endpoint**: `/api/festivals`
*   **설명**: 시스템 시작 시점에 로컬 DB에 자동 로딩되어 있는 올해(2026년) 전국 16개 대표 축제 리스트를 가져옵니다.
*   **Request**: 없음
*   **Response (200 OK)**:
    ```json
    [
      {
        "festivalId": 1,
        "name": "양평 용문산 산나물 축제",
        "description": "양평 용문산 산나물 축제 축제입니다.",
        "location": "경기도 양평군 용문면 용문산로 110-2",
        "startDate": "2026-05-01",
        "endDate": "2026-05-15"
      },
      {
        "festivalId": 2,
        "name": "강릉 단오제",
        "description": "강릉 단오제 축제입니다.",
        "location": "강원도 강릉시 단오장길 1",
        "startDate": "2026-06-01",
        "endDate": "2026-06-15"
      }
    ]
    ```

---

### 2) [GET] 위치 기반 축제 추천 및 인근 관광지 혼잡도 조회
*   **Endpoint**: `/api/festivals/recommend`
*   **설명**: 사용자의 현 위치를 기반으로 반경 내 축제들과 축제장 근처 관광지의 실시간 혼잡률을 함께 조회합니다. (날짜 필터 없음)
*   **Request Parameters**:
    | 파라미터명 | 타입 | 필수 여부 | 설명 | 예시 |
    | :--- | :---: | :---: | :--- | :--- |
    | `address` | String | X | 사용자의 한글 지명/주소 | `"양평군"` |
    | `maxDistanceKm` | Double | X | 추천 반경 제한 (기본 50km) | `30.0` |
    | `latitude` | Double | X | 사용자 현재 위도 | `37.5665` |
    | `longitude` | Double | X | 사용자 현재 경도 | `126.9780` |
*   **Response (200 OK)**:
    ```json
    [
      {
        "festivalId": 1,
        "name": "양평 용문산 산나물 축제",
        "location": "경기도 양평군 용문면 용문산로 110-2",
        "startDate": "2026-05-01",
        "endDate": "2026-05-15",
        "distanceKm": 12.3,
        "touristSpots": [
          {
            "spotId": 1,
            "name": "용문사 천년 은행나무",
            "description": "용문사 천년 은행나무 주변 관광지입니다.",
            "location": "경기도 양평군 용문면 용문산로 782",
            "distanceKm": 1.2,
            "congestionRate": 42,
            "level": "쾌적"
          },
          {
            "spotId": 2,
            "name": "들꽃수목원",
            "description": "들꽃수목원 주변 관광지입니다.",
            "location": "경기도 양평군 양평읍 수목원길 16",
            "distanceKm": 2.5,
            "congestionRate": 85,
            "level": "혼잡"
          }
        ]
      }
    ]
    ```

---

### 3) [POST] 상인 부스 및 디지털 메뉴판 등록 (상인 어드민)
*   **Endpoint**: `/api/booths`
*   **설명**: 상인이 점포 정보와 메뉴들을 시스템에 등록하고 랜딩 QR코드를 발급받습니다.
*   **Request Body (JSON)**:
    ```json
    {
      "festivalId": 1,
      "name": "양평 산채 비빔밥집",
      "description": "용문산에서 직접 채취한 나물로 만드는 비빔밥 전문점",
      "locationDescription": "축제 메인광장 먹거리 장터 12호",
      "products": [
        {
          "name": "산나물 비빔밥",
          "price": 9000,
          "description": "5가지 산나물이 들어간 웰빙 비빔밥",
          "isSpecialty": true
        },
        {
          "name": "감자전",
          "price": 7000,
          "description": "감자를 직접 강판에 갈아 구운 겉바속촉 감자전",
          "isSpecialty": false
        }
      ]
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": 1,
      "name": "양평 산채 비빔밥집",
      "description": "용문산에서 직접 채취한 나물로 만드는 비빔밥 전문점",
      "locationDescription": "축제 메인광장 먹거리 장터 12호",
      "currentWaitingCount": 0,
      "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:8080/booth.html?boothId=1",
      "products": [
        {
          "id": 1,
          "name": "산나물 비빔밥",
          "price": 9000,
          "description": "5가지 산나물이 들어간 웰빙 비빔밥",
          "isSpecialty": true
        },
        {
          "id": 2,
          "name": "감자전",
          "price": 7000,
          "description": "감자를 직접 강판에 갈아 구운 겉바속촉 감자전",
          "isSpecialty": false
        }
      ]
    }
    ```

---

### 4) [GET] 특정 축제 내 전체 부스 실시간 웨이팅 현황 조회
*   **Endpoint**: `/api/festivals/{festivalId}/booths`
*   **설명**: 축제 상세 탭에서 입점해 있는 전체 부스 목록과 현재 실시간 대기 인원수를 노출합니다.
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": 1,
        "name": "양평 산채 비빔밥집",
        "description": "나물 비빔밥 전문점",
        "locationDescription": "먹거리 장터 12호",
        "currentWaitingCount": 3,
        "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:8080/booth.html?boothId=1"
      }
    ]
    ```

---

### 5) [GET] QR 코드 진입용 부스 상세 및 메뉴판 조회
*   **Endpoint**: `/api/booths/{boothId}`
*   **설명**: 모바일 단말기로 QR코드를 찍고 들어왔을 때, `boothId`를 기반으로 메뉴판과 상점 소개 정보를 렌더링합니다.
*   **Response (200 OK)**:
    ```json
    {
      "id": 1,
      "name": "양평 산채 비빔밥집",
      "description": "용문산에서 직접 채취한 나물로 만드는 비빔밥 전문점",
      "locationDescription": "축제 메인광장 먹거리 장터 12호",
      "currentWaitingCount": 3,
      "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:8080/booth.html?boothId=1",
      "products": [
        {
          "id": 1,
          "name": "산나물 비빔밥",
          "price": 9000,
          "description": "5가지 산나물이 들어간 웰빙 비빔밥",
          "isSpecialty": true
        }
      ]
    }
    ```

---

### 6) [POST] 모바일 실시간 대기 등록 신청 (손님)
*   **Endpoint**: `/api/waitings`
*   **설명**: 모바일 페이지에서 휴대폰 번호를 입력해 실시간 대기 접수를 요청합니다. (Solapi 접수 완료 문자 자동 트리거)
*   **Request Body (JSON)**:
    ```json
    {
      "boothId": 1,
      "phoneNumber": "01012345678"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "waitingId": 101,
      "waitingNumber": 4,
      "status": "WAITING",
      "waitingTeamsAhead": 3,
      "phoneNumber": "01012345678"
    }
    ```

---

### 7) [GET] 손님 실시간 순서/상태 폴링 조회 (4초 간격)
*   **Endpoint**: `/api/waitings/{waitingId}/status`
*   **설명**: 내 앞에 남은 대기자 팀 수와 호출 여부(`status`)를 주기적으로 갱신하여 보여줍니다.
*   **Response (200 OK)**:
    ```json
    {
      "waitingId": 101,
      "waitingNumber": 4,
      "status": "WAITING",
      "waitingTeamsAhead": 1,
      "phoneNumber": "01012345678"
    }
    ```
    *   *참고: 만약 순서가 되어 상인이 부르면 `status` 필드가 `"CALLED"`로 변경되어 반환됩니다.*

---

### 8) [POST] 대기 고객 호출 (상인 제어)
*   **Endpoint**: `/api/waitings/{waitingId}/call`
*   **설명**: 상인이 대기 번호표 순서에 맞추어 손님을 호출합니다. (Solapi 호출 알림 문자 발송)
*   **Response (200 OK)**:
    ```json
    {
      "waitingId": 101,
      "status": "CALLED"
    }
    ```

---

### 9) [POST] 대기 고객 입장 처리 / 취소 처리 (상인 제어)
*   **입장 완료 처리**: `POST /api/waitings/{waitingId}/complete`
*   **노쇼 및 대기 취소**: `POST /api/waitings/{waitingId}/cancel`
*   **Response (200 OK)**:
    ```json
    {
      "waitingId": 101,
      "status": "COMPLETED"  // 혹은 "CANCELLED"
    }
    ```

---

### 10) [GET] ennoia AI 자연어 큐레이션 통합 API (AI 파트 연동)
*   **Endpoint**: `/api/ai/curate`
*   **설명**: ennoia AI 큐레이터가 자연어 문장을 전달받아 목적지 매핑 정보 및 추천 사유를 반환합니다.
*   **Query Parameters**:
    *   `query` (String, Required): 사용자의 질문
*   **Response (200 OK)**:
    ```json
    {
      "query": "사람 많은 곳 피해서 한적하게 힐링할 수 있는 관광지랑 축제 알려줘",
      "parsedLocation": "강릉",
      "recommendedSpots": [
        {
          "name": "경포 가시연습지",
          "congestionRate": 28,
          "level": "쾌적"
        }
      ],
      "aiRecommendationReason": "현재 강릉 단오제 축제 인근에서 혼잡도가 28%(쾌적)로 가장 한적한 '경포 가시연습지' 주변 코스를 추천합니다."
    }
    ```
