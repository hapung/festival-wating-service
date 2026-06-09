# 백엔드 API 레퍼런스 명세서 (API Specification)

## 1. API 주소 및 공통 규격
*   **개발용 서버 주소**: `http://localhost:8080`
*   **HTTP Header**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <JWT_TOKEN>` (인증 권한이 필요한 API 호출 시 반드시 첨부해야 합니다.)

## 2. 서비스 워크플로우 및 계층 구조
본 시스템은 다음과 같은 승인 파이프라인을 거쳐 리소스(축제, 부스)를 생성합니다.

1. **[최상위 관리자]**: 기본 생성된 `admin` 계정
2. **[주최측 승인]**: `ROLE_ORGANIZER`로 가입한 계정을 `admin`이 승인 (`POST /api/admin/organizers/{id}/approve`)
3. **[축제 개최]**: 승인된 주최측이 새로운 축제를 동적으로 생성 (`POST /api/organizer/festivals`)
4. **[상인 승인]**: `ROLE_MERCHANT`로 가입한 계정을 주최측이 승인 (`POST /api/organizer/merchants/{id}/approve`)
5. **[부스 등록]**: 승인된 상인이 주최측이 만든 '축제'에 본인의 부스와 메뉴판을 등록 (`POST /api/booths`)

---

## 3. API 상세 명세

### 1) [POST] 주최자 및 상인 회원가입
*   **Endpoint**: `/api/auth/signup`
*   **설명**: 신규 주최자(ROLE_ORGANIZER) 또는 상인(ROLE_MERCHANT) 회원으로 등록합니다. 가입 직후에는 **미승인(Pending)** 상태이며, 상위 권한자의 승인을 받아야 토큰 활성화 및 리소스 등록이 가능해집니다.
*   **Request Body (JSON)**:
    ```json
    {
      "username": "merchant_kim",
      "password": "password1234",
      "name": "김상인",
      "phoneNumber": "01099998888",
      "role": "ROLE_MERCHANT"
    }
    ```
*   **Response (200 OK)**:
    ```text
    김상인님 회원가입이 완료되었습니다. (최상위 운영자/주최자의 최종 승인을 기다려주세요.)
    ```

---

### 2) [POST] 일반 로그인 (주최측, 상인, 어드민)
*   **Endpoint**: `/api/auth/login`
*   **설명**: 아이디와 패스워드로 로그인하여 API 인증 및 권한 확인에 사용할 JWT 토큰을 획득합니다.
*   **Request Body (JSON)**:
    ```json
    {
      "username": "admin",
      "password": "admin1234"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsIm..."
    }
    ```

---

### 3) [POST] 손님 무가입 번호인증 (토큰 발급)
*   **Endpoint**: `/api/auth/customer-token`
*   **설명**: 축제 방문 손님이 아이디 비밀번호 가입 절차 없이 휴대폰 번호 입력 및 인증(시뮬레이터)을 진행하면, 해당 축제 범위 내에서 24시간 동안 유효한 손님 권한의 JWT 토큰을 반환합니다.
*   **Request Body (JSON)**:
    ```json
    {
      "phoneNumber": "01012345678",
      "festivalId": 1
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIwMTAxMjM0..."
    }
    ```

---

### 4) [POST] 이미지 파일 업로드
*   **Endpoint**: `/api/files/upload`
*   **설명**: 부스 이미지나 메뉴판 사진을 Multipart 형식으로 전송하여 저장하고, 정적 서비스 URL 경로를 반환받습니다.
*   **Request (Multipart/form-data)**:
    *   `file`: 실물 이미지 파일 (MultipartFile)
*   **Response (200 OK)**:
    ```json
    {
      "imageUrl": "/uploads/8f52de28-56f8-4bfa-a3fb-b09a5b3a4a0c.png"
    }
    ```

---

### 5) [POST] 최상위 어드민의 주최자 계정 승인
*   **Endpoint**: `/api/admin/organizers/{organizerId}/approve`
*   **설명**: 최상위 운영자(`ROLE_ADMIN` 토큰 필요)가 새로 가입 신청한 주최측 계정을 승인합니다.
*   **Response (200 OK)**:
    ```text
    주최자 계정이 승인되었습니다. ID: 2
    ```

---

### 6) [POST] 승인 완료된 주최자의 축제 등록
*   **Endpoint**: `/api/organizer/festivals`
*   **설명**: 승인 완료된 주최측(`ROLE_ORGANIZER` 토큰 필요) 권한으로 신규 축제를 개최 등록합니다.
*   **Request Body (JSON)**:
    ```json
    {
      "name": "강릉 단오제 2026",
      "description": "유네스코 인류무형문화유산 강릉단오제",
      "location": "강원도 강릉시 단오장길 1",
      "startDate": "2026-06-01",
      "endDate": "2026-06-15"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "festivalId": 12,
      "name": "강릉 단오제 2026",
      "location": "강원도 강릉시 단오장길 1",
      "startDate": "2026-06-01",
      "endDate": "2026-06-15"
    }
    ```

---

### 7) [POST] 주최자의 상인 입점 승인
*   **Endpoint**: `/api/organizer/merchants/{merchantId}/approve`
*   **설명**: 주최측(`ROLE_ORGANIZER` 토큰 필요)이 자신의 축제에 입점을 신청한 상인 계정을 승인(허용)합니다.
*   **Response (200 OK)**:
    ```text
    상인 계정이 승인되었습니다. ID: 3
    ```

---

### 8) [POST] 상인 부스 및 디지털 메뉴판 등록
*   **Endpoint**: `/api/booths`
*   **설명**: 승인 완료된 상인(`ROLE_MERCHANT` 토큰 필요) 권한으로 본인의 부스를 생성하고 판매 메뉴를 등록합니다. 부스 및 상품 등록 시 업로드된 `imageUrl` 경로를 대입합니다.
*   **Request Body (JSON)**:
    ```json
    {
      "festivalId": 1,
      "name": "양평 산채 비빔밥집",
      "description": "용문산에서 직접 채취한 나물로 만드는 비빔밥 전문점",
      "locationDescription": "축제 메인광장 먹거리 장터 12호",
      "imageUrl": "/uploads/booth_main.png",
      "products": [
        {
          "name": "산나물 비빔밥",
          "price": 9000,
          "description": "5가지 산나물이 들어간 웰빙 비빔밥",
          "isSpecialty": true,
          "imageUrl": "/uploads/product_bibim.png"
        }
      ]
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": 5,
      "name": "양평 산채 비빔밥집",
      "description": "용문산에서 직접 채취한 나물로 만드는 비빔밥 전문점",
      "locationDescription": "축제 메인광장 먹거리 장터 12호",
      "currentWaitingCount": 0,
      "imageUrl": "/uploads/booth_main.png",
      "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:8080/booth.html?boothId=5",
      "products": [
        {
          "id": 10,
          "name": "산나물 비빔밥",
          "price": 9000,
          "description": "5가지 산나물이 들어간 웰빙 비빔밥",
          "isSpecialty": true,
          "imageUrl": "/uploads/product_bibim.png"
        }
      ]
    }
    ```

---

### 9) [POST] 모바일 실시간 대기 등록 신청
*   **Endpoint**: `/api/booths/{boothId}/waitings`
*   **설명**: 손님 전용 JWT 토큰(`ROLE_CUSTOMER` 토큰 필요)을 담아 대기를 신청합니다. 토큰 내부의 전화번호가 자동으로 등록되며, **한 축제 내에서 동시에 가질 수 있는 대기열 개수는 최대 3개**로 제약됩니다. (3개 초과 시 400 에러)
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

### 10) [GET] 내 활성 대기 목록 조회 (손님 세션 복원)
*   **Endpoint**: `/api/waitings/my-active`
*   **설명**: 손님 전용 JWT 토큰을 기반으로 해당 축제(`festivalId`) 내에서 내가 현재 대기 중인 모든 부스의 실시간 대기 정보(내 앞 대기자수 포함)를 배열로 가져옵니다. 새로고침 시 화면 상태 복원에 쓰입니다.
*   **Query Parameters**:
    *   `festivalId` (Long, Required): 축제 고유 식별 ID
*   **Response (200 OK)**:
    ```json
    [
      {
        "waitingId": 101,
        "waitingNumber": 4,
        "status": "WAITING",
        "waitingTeamsAhead": 1,
        "phoneNumber": "01012345678"
      }
    ]
    ```

---

### 11) [GET] 동적 축제 목록 조회
*   **Endpoint**: `/api/festivals`
*   **설명**: 주최측이 동적으로 개최한 축제 및 기존 캐싱된 축제들의 목록을 모두 조회합니다. 상인이 부스를 등록할 때 소속될 축제를 선택하기 위해 호출됩니다.
*   **Response (200 OK)**: 축제 목록 배열

---

### 12) [GET] 위치 기반 축제 추천 및 인근 관광지 혼잡도 조회
*   **Endpoint**: `/api/festivals/recommend`
*   **Query Parameters**: `address`, `maxDistanceKm`, `latitude`, `longitude`

---

### 13) [GET] 특정 축제 내 전체 부스 실시간 웨이팅 현황 조회
*   **Endpoint**: `/api/festivals/{festivalId}/booths`

---

### 14) [GET] QR 코드 진입용 부스 상세 및 메뉴판 조회
*   **Endpoint**: `/api/booths/{boothId}`

---

### 15) [GET] 손님 실시간 순서/상태 폴링 조회 (4초 간격)
*   **Endpoint**: `/api/waitings/{waitingId}/status`

---

### 16) [POST] 대기 고객 호출 (상인 제어)
*   **Endpoint**: `/api/waitings/{waitingId}/call` (상인 토큰 필요)

---

### 17) [POST] 대기 고객 입장 완료 / 취소 처리 (상인 제어)
*   **입장 완료**: `POST /api/waitings/{waitingId}/complete` (상인 토큰 필요)
*   **취소/노쇼**: `POST /api/waitings/{waitingId}/cancel` (상인 토큰 필요)
