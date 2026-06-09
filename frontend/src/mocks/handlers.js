import { http, HttpResponse } from 'msw'

// Helper to interact with Mock Database in sessionStorage
const DB_KEY = 'festival_waiting_mock_db'

const initialDb = {
  festivals: [
    {
      festivalId: 1,
      name: "양평 용문산 산나물 축제",
      description: "용문산에서 직접 채취한 제철 산나물 30여 종을 맛보는 웰빙 먹거리 축제. 나물 비빔밥·약초 막걸리·산나물 체험까지.",
      location: "경기도 양평군 용문면 용문산로 110-2",
      startDate: "2026-05-01",
      endDate: "2026-05-15",
      lat: 37.5925,
      lng: 127.6578
    },
    {
      festivalId: 2,
      name: "강릉 단오제",
      description: "유네스코 인류무형문화유산 천년 전통의 강릉 단오제. 씨름·그네·창포 머리감기 등 민속 체험과 강원 향토 음식.",
      location: "강원도 강릉시 단오장길 1",
      startDate: "2026-06-01",
      endDate: "2026-06-15",
      lat: 37.7492,
      lng: 128.8783
    },
    {
      festivalId: 3,
      name: "망원 한강 야시장",
      description: "망원 한강공원에서 매주 금·토·일 저녁 열리는 감성 야시장. 전국 유명 맛집과 핸드메이드 소품이 한자리에.",
      location: "서울특별시 마포구 마포나루길 467",
      startDate: "2026-06-07",
      endDate: "2026-06-09",
      lat: 37.5580,
      lng: 126.9024
    },
    {
      festivalId: 4,
      name: "연남 수제 먹거리 페어",
      description: "경의선 숲길을 따라 펼쳐지는 핸드메이드 먹거리 마켓. 독립 브랜드 디저트·수제 음료·빈티지 소품까지.",
      location: "서울특별시 마포구 연남동 경의선숲길",
      startDate: "2026-06-06",
      endDate: "2026-06-08",
      lat: 37.5648,
      lng: 126.9276
    },
    {
      festivalId: 5,
      name: "홍대 인디 밴드 페스티벌",
      description: "홍대 걷고싶은거리에서 이틀간 펼쳐지는 신진 인디 아티스트 음악 축제. 20여 팀 라이브 공연 + 푸드트럭 마켓.",
      location: "서울특별시 마포구 어울마당로",
      startDate: "2026-06-08",
      endDate: "2026-06-09",
      lat: 37.5566,
      lng: 126.9250
    },
    {
      festivalId: 6,
      name: "전주 한옥마을 전통 음식 축제",
      description: "전주 한옥마을 일원에서 열리는 전통 음식 체험 축제. 전주비빔밥·콩나물국밥·모주·한과 등 전라도 대표 음식을 정통 레시피로.",
      location: "전라북도 전주시 완산구 기린대로 99",
      startDate: "2026-05-20",
      endDate: "2026-05-25",
      lat: 35.8175,
      lng: 127.1508
    }
  ],
  booths: [
    // ====================================================
    // 망원 한강 야시장 (festivalId: 3)
    // ====================================================
    {
      id: 1,
      festivalId: 3,
      name: "할매 손칼국수",
      description: "30년 전통의 손맛, 매일 직접 뽑아 끓인 시원한 멸치 칼국수. 어드민 데모 부스입니다.",
      locationDescription: "A-12",
      currentWaitingCount: 4,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/1",
      products: [
        { id: 1, name: "손칼국수", price: 8000, description: "멸치 육수 · 직접 뽑은 면", isSpecialty: false },
        { id: 2, name: "망원 시장 손만두", price: 6000, description: "망원시장 특산 · 김치/고기 6알", isSpecialty: true },
        { id: 3, name: "비빔칼국수", price: 9000, description: "새콤달콤 양념 · 여름 한정 메뉴", isSpecialty: false },
        { id: 4, name: "모둠전", price: 12000, description: "해물·김치·고기전 모둠 한 판", isSpecialty: false },
        { id: 5, name: "수제비 칼국수 세트", price: 15000, description: "손칼국수 + 수제비 + 공기밥 세트", isSpecialty: false }
      ]
    },
    {
      id: 2,
      festivalId: 3,
      name: "제주 흑돼지 꼬치",
      description: "1등급 제주 흑돼지 육즙 가득한 초대형 수제 왕꼬치. 매콤·데리야끼·소금구이 세 가지 맛으로.",
      locationDescription: "B-03",
      currentWaitingCount: 3,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/2",
      products: [
        { id: 6, name: "흑돼지 왕꼬치 (매콤)", price: 6000, description: "제주 청양 소스 버무린 얼큰한 맛", isSpecialty: true },
        { id: 7, name: "흑돼지 왕꼬치 (데리야끼)", price: 6000, description: "달콤한 데리야끼 소스 · 어린이 인기", isSpecialty: false },
        { id: 8, name: "흑돼지 삼겹 꼬치", price: 8000, description: "두껍게 썬 삼겹살 꼬치 · 파채 곁들임", isSpecialty: true },
        { id: 9, name: "한라봉 에이드", price: 4000, description: "제주 한라봉 착즙 · 상콤한 수제 음료", isSpecialty: false }
      ]
    },
    {
      id: 3,
      festivalId: 3,
      name: "춘천 닭갈비 트럭",
      description: "원조 춘천 닭갈비 레시피 그대로 즉석 철판 요리. 쫄깃한 닭다리살과 고구마·양배추의 환상 조화.",
      locationDescription: "A-07",
      currentWaitingCount: 2,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/3",
      products: [
        { id: 10, name: "매콤 철판 닭갈비", price: 7000, description: "닭다리살·양배추·고구마 철판 볶음", isSpecialty: false },
        { id: 11, name: "치즈 닭갈비", price: 8500, description: "닭갈비 위에 모짜렐라 치즈를 듬뿍", isSpecialty: true },
        { id: 12, name: "닭갈비 볶음밥", price: 5000, description: "남은 양념에 볶아내는 마무리 메뉴", isSpecialty: false },
        { id: 13, name: "컵 닭갈비 (소)", price: 4000, description: "혼자 즐기기 좋은 1인 컵 사이즈", isSpecialty: false }
      ]
    },
    {
      id: 4,
      festivalId: 3,
      name: "전통 호떡 & 어묵",
      description: "쫄깃한 찹쌀 씨앗 호떡과 칼칼한 꽃게 어묵 국물. 혼잡해도 기다릴 가치 100%인 국민 간식.",
      locationDescription: "C-21",
      currentWaitingCount: 8,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/4",
      products: [
        { id: 14, name: "찹쌀 씨앗 호떡", price: 2000, description: "씨앗과 꿀이 가득 단짠 영양 간식", isSpecialty: true },
        { id: 15, name: "꽃게 어묵탕", price: 3000, description: "꽃게 육수로 우린 칼칼하고 깊은 국물", isSpecialty: true },
        { id: 16, name: "어묵 꼬치 (3개)", price: 3500, description: "두툼한 사각·봉·야채 어묵 3종 선택", isSpecialty: false },
        { id: 17, name: "흑임자 호떡", price: 2500, description: "고소한 흑임자 크림 시즌 한정 호떡", isSpecialty: false }
      ]
    },
    {
      id: 5,
      festivalId: 3,
      name: "수제 맥주 펍",
      description: "로컬 양조장에서 직접 공수한 크래프트 맥주 5종. 한강 뷰와 함께 즐기는 낭만 맥주 한 잔.",
      locationDescription: "B-15",
      currentWaitingCount: 0,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/5",
      products: [
        { id: 18, name: "시트러스 골든 에일", price: 6500, description: "은은한 귤 향과 가벼운 바디감", isSpecialty: true },
        { id: 19, name: "다크 스타우트", price: 7000, description: "진한 로스팅 향과 크리미한 흑맥주", isSpecialty: false },
        { id: 20, name: "바이젠 밀맥주", price: 6500, description: "달콤한 바나나 향의 독일식 밀맥주", isSpecialty: false },
        { id: 21, name: "감자 튀김 플래터", price: 8000, description: "두꺼운 웨지감자 + 3가지 디핑 소스", isSpecialty: false },
        { id: 22, name: "맥주 3종 테이스팅 세트", price: 16000, description: "에일·스타우트·밀맥주 각 250ml + 안주 1종", isSpecialty: true }
      ]
    },
    {
      id: 6,
      festivalId: 3,
      name: "흑당 디저트 카페",
      description: "대만 흑당 버블티와 치즈폼 음료, 대만 카스텔라를 현장에서 구워드리는 디저트 카페.",
      locationDescription: "D-02",
      currentWaitingCount: 5,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/6",
      products: [
        { id: 23, name: "흑당 버블밀크티", price: 6500, description: "수제 흑당 시럽 · 쫄깃한 타피오카 펄", isSpecialty: true },
        { id: 24, name: "치즈폼 녹차 라떼", price: 6000, description: "제주 말차 + 진한 크림치즈 폼", isSpecialty: false },
        { id: 25, name: "대만 카스텔라 (스몰)", price: 5000, description: "촉촉하고 폭신한 계란 가득 카스텔라", isSpecialty: false },
        { id: 26, name: "타로 버블티", price: 6000, description: "부드러운 타로 파우더 + 버블", isSpecialty: false }
      ]
    },

    // ====================================================
    // 양평 용문산 산나물 축제 (festivalId: 1)
    // ====================================================
    {
      id: 7,
      festivalId: 1,
      name: "양평 산채 비빔밥집",
      description: "용문산에서 직접 채취한 나물로 만드는 비빔밥 전문점. 참기름·고추장 모두 직접 담가 씁니다.",
      locationDescription: "먹거리 장터 12호",
      currentWaitingCount: 3,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/7",
      products: [
        { id: 27, name: "산나물 비빔밥", price: 9000, description: "10가지 산나물이 들어간 정통 웰빙 비빔밥", isSpecialty: true },
        { id: 28, name: "감자전", price: 7000, description: "강판에 갈아 구운 겉바속촉 감자전", isSpecialty: false },
        { id: 29, name: "산채 된장국", price: 3000, description: "산나물을 넣은 구수한 된장국", isSpecialty: false },
        { id: 30, name: "도토리묵 무침", price: 6000, description: "직접 쑨 도토리묵에 야채 양념 무침", isSpecialty: true }
      ]
    },
    {
      id: 8,
      festivalId: 1,
      name: "약초 막걸리 양조장",
      description: "용문산 약초로 빚은 수제 생막걸리. 구기자·오미자·인삼 막걸리를 시음하고 구매할 수 있습니다.",
      locationDescription: "먹거리 장터 08호",
      currentWaitingCount: 6,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/8",
      products: [
        { id: 31, name: "구기자 막걸리 (1잔)", price: 4000, description: "항산화 구기자로 빚은 붉은 빛 생막걸리", isSpecialty: true },
        { id: 32, name: "오미자 막걸리 (1잔)", price: 4000, description: "새콤달콤 오미자의 화사한 핑크 막걸리", isSpecialty: true },
        { id: 33, name: "인삼 막걸리 (1잔)", price: 4500, description: "6년근 인삼 원액 첨가 구수한 막걸리", isSpecialty: false },
        { id: 34, name: "3종 시음 세트", price: 10000, description: "구기자·오미자·인삼 막걸리 각 1잔 + 전 1종", isSpecialty: true }
      ]
    },
    {
      id: 9,
      festivalId: 1,
      name: "황토 가마솥 백숙",
      description: "황토 가마솥에서 4시간 이상 삶아낸 토종닭 백숙. 인삼·대추·마늘을 넣어 보양 효과를 높였습니다.",
      locationDescription: "먹거리 장터 01호",
      currentWaitingCount: 11,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/9",
      products: [
        { id: 35, name: "토종닭 백숙 (2인)", price: 35000, description: "인삼·대추·황기·찹쌀 넣은 가마솥 백숙", isSpecialty: true },
        { id: 36, name: "닭죽 (1인)", price: 8000, description: "백숙 국물로 끓인 구수한 참기름 닭죽", isSpecialty: false },
        { id: 37, name: "삼계탕 (1인)", price: 18000, description: "작은 닭 통째로 끓인 든든한 1인 삼계탕", isSpecialty: false }
      ]
    },

    // ====================================================
    // 전주 한옥마을 전통 음식 축제 (festivalId: 6)
    // ====================================================
    {
      id: 10,
      festivalId: 6,
      name: "전주 비빔밥 명인관",
      description: "전주 비빔밥 명인이 직접 운영하는 정통 전주비빔밥 부스. 30년 경력의 손맛과 직접 담근 고추장.",
      locationDescription: "한옥마을 먹거리광장 A-01",
      currentWaitingCount: 9,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/10",
      products: [
        { id: 38, name: "전주 비빔밥 (정식)", price: 13000, description: "육회·황포묵·30가지 나물 · 명인 고추장", isSpecialty: true },
        { id: 39, name: "돌솥 비빔밥", price: 14000, description: "뜨거운 돌솥에 누룽지까지 즐기는 비빔밥", isSpecialty: true },
        { id: 40, name: "콩나물국밥", price: 8000, description: "전주 콩나물을 넣은 칼칼한 해장 국밥", isSpecialty: false },
        { id: 41, name: "전주 모주 (1잔)", price: 3000, description: "막걸리를 끓여 만든 전통 전주 모주", isSpecialty: true }
      ]
    },
    {
      id: 11,
      festivalId: 6,
      name: "한옥마을 한과 & 떡집",
      description: "전통 방식으로 만드는 수제 한과와 떡. 약과·강정·인절미·꿀떡을 직접 만들어 판매합니다.",
      locationDescription: "한옥마을 먹거리광장 B-03",
      currentWaitingCount: 2,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/11",
      products: [
        { id: 42, name: "수제 약과 (5개)", price: 8000, description: "참기름·꿀로 반죽한 바삭한 전통 약과", isSpecialty: true },
        { id: 43, name: "인절미 모둠 (10개)", price: 7000, description: "콩가루·흑임자·팥고물 인절미 모둠", isSpecialty: false },
        { id: 44, name: "한과 선물 세트", price: 25000, description: "약과·강정·산자·정과 전통 한과 선물 박스", isSpecialty: true }
      ]
    },
    {
      id: 12,
      festivalId: 6,
      name: "전주 피순대 & 막창",
      description: "전주 중앙시장 원조 피순대 레시피. 당면·선지·야채가 가득한 속이 꽉 찬 순대를 즉석에서.",
      locationDescription: "한옥마을 먹거리광장 C-05",
      currentWaitingCount: 7,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/12",
      products: [
        { id: 45, name: "피순대 모둠 (소)", price: 10000, description: "피순대 + 내장 + 간 모둠 · 새우젓 곁들임", isSpecialty: true },
        { id: 46, name: "순대국밥", price: 9000, description: "진한 돼지 육수 + 피순대 + 내장 국밥", isSpecialty: false },
        { id: 47, name: "막창 구이 (200g)", price: 13000, description: "숯불에 구운 쫄깃한 돼지 막창 + 야채", isSpecialty: false }
      ]
    },

    // ====================================================
    // 연남 수제 먹거리 페어 (festivalId: 4)
    // ====================================================
    {
      id: 13,
      festivalId: 4,
      name: "연남 수제 브루어리",
      description: "경의선 숲길 옆 수제 맥주 팝업. 계절 한정 크래프트 맥주 4종과 안주 메뉴.",
      locationDescription: "숲길 B-02",
      currentWaitingCount: 5,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/13",
      products: [
        { id: 48, name: "여름 과일 에일", price: 7000, description: "복숭아·망고가 가득한 프루티 에일", isSpecialty: true },
        { id: 49, name: "블랙 IPA", price: 7000, description: "홉 향 강한 다크 IPA · 씁쓸하고 깊은 맛", isSpecialty: false },
        { id: 50, name: "핫도그 콤보", price: 9000, description: "수제 소시지 핫도그 + 감자튀김", isSpecialty: false },
        { id: 51, name: "2잔 세트", price: 12000, description: "원하는 맥주 2종 선택 세트", isSpecialty: false }
      ]
    },
    {
      id: 14,
      festivalId: 4,
      name: "마카롱 & 크로플 디저트",
      description: "프랑스 정통 마카롱과 바삭한 크로플을 즉석에서 만들어 드립니다. 인스타 맛집.",
      locationDescription: "숲길 A-07",
      currentWaitingCount: 12,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/14",
      products: [
        { id: 52, name: "마카롱 5개 박스", price: 12000, description: "딸기·피스타치오·초코·바닐라·얼그레이", isSpecialty: true },
        { id: 53, name: "크로플 (딸기잼)", price: 6500, description: "바삭한 크루아상 와플 + 수제 딸기잼", isSpecialty: false },
        { id: 54, name: "크로플 (누텔라 바나나)", price: 7000, description: "누텔라 + 생바나나 + 아이스크림", isSpecialty: true },
        { id: 55, name: "아인슈페너", price: 5500, description: "진한 에스프레소 + 진한 생크림", isSpecialty: false }
      ]
    },
    {
      id: 15,
      festivalId: 4,
      name: "베트남 쌀국수 & 반미",
      description: "현지 레시피 그대로 재현한 포와 바삭한 반미 샌드위치. 라임·고수 곁들임.",
      locationDescription: "숲길 C-11",
      currentWaitingCount: 3,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/15",
      products: [
        { id: 56, name: "소고기 쌀국수 (포)", price: 10000, description: "사골 육수 + 차돌박이 + 숙주나물", isSpecialty: true },
        { id: 57, name: "닭고기 쌀국수", price: 9000, description: "담백한 닭 육수 · 어린이도 좋아하는 맛", isSpecialty: false },
        { id: 58, name: "반미 샌드위치", price: 8000, description: "바삭한 바게트 + 돼지고기 + 채소 피클", isSpecialty: false }
      ]
    },

    // ====================================================
    // 홍대 인디 밴드 페스티벌 (festivalId: 5)
    // ====================================================
    {
      id: 16,
      festivalId: 5,
      name: "홍대 푸드트럭 타코",
      description: "멕시코 스타일 수제 타코 전문 푸드트럭. 라이브 공연 보면서 즐기는 길거리 타코.",
      locationDescription: "메인 스테이지 앞 F-01",
      currentWaitingCount: 8,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/16",
      products: [
        { id: 59, name: "소고기 타코 (2개)", price: 8000, description: "훈제 소고기 + 할라피뇨 살사", isSpecialty: true },
        { id: 60, name: "새우 타코 (2개)", price: 9000, description: "튀긴 새우 + 망고 살사 + 코리앤더", isSpecialty: true },
        { id: 61, name: "나초 플래터", price: 7000, description: "치즈 소스 + 과카몰리 + 살사 3종", isSpecialty: false },
        { id: 62, name: "타코 3종 세트", price: 13000, description: "소고기·새우·채소 타코 각 1개 + 음료", isSpecialty: false }
      ]
    },
    {
      id: 17,
      festivalId: 5,
      name: "인디 아티스트 굿즈샵",
      description: "공연 중인 인디 밴드들의 한정판 굿즈와 독립 레이블 음반을 판매하는 공식 부스.",
      locationDescription: "굿즈 존 G-03",
      currentWaitingCount: 0,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/17",
      products: [
        { id: 63, name: "한정판 티셔츠", price: 25000, description: "페스티벌 공식 로고 티셔츠 (S/M/L/XL)", isSpecialty: false },
        { id: 64, name: "인디 밴드 앨범", price: 15000, description: "참여 밴드 20팀 한정판 컴필레이션 CD", isSpecialty: true },
        { id: 65, name: "에코백", price: 18000, description: "페스티벌 한정 디자인 캔버스 에코백", isSpecialty: false }
      ]
    },
    {
      id: 18,
      festivalId: 5,
      name: "수제 레모네이드 바",
      description: "생과일 착즙 레모네이드와 콤부차. 공연 관람 중 시원하게 즐기는 건강 음료.",
      locationDescription: "메인 스테이지 옆 F-05",
      currentWaitingCount: 4,
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/18",
      products: [
        { id: 66, name: "클래식 레모네이드", price: 5000, description: "국내산 레몬 착즙 + 자연 당도 조절", isSpecialty: false },
        { id: 67, name: "딸기 레모네이드", price: 5500, description: "생딸기 갈아 넣은 핑크빛 레모네이드", isSpecialty: true },
        { id: 68, name: "진저 콤부차", price: 6000, description: "유기농 홍차 발효 + 생강 · 장 건강에 좋아요", isSpecialty: false },
        { id: 69, name: "모히토 레모네이드", price: 6000, description: "민트·라임·레몬의 상쾌한 논알코올 모히토", isSpecialty: false }
      ]
    }
  ],

  // ====================================================
  // 대기 데이터 - 부스 1 (할매 손칼국수)에 집중
  // 어드민이 boothId=1 고정이므로 테스트 가능
  // ====================================================
  waitings: [
    // --- 부스 1: 처리 완료 히스토리 ---
    { waitingId: 10, boothId: 1, waitingNumber: 1, status: 'COMPLETED', phoneNumber: '010-••••-0001', time: '17:10', rawPhone: '01010000001' },
    { waitingId: 11, boothId: 1, waitingNumber: 2, status: 'COMPLETED', phoneNumber: '010-••••-0002', time: '17:22', rawPhone: '01010000002' },
    { waitingId: 12, boothId: 1, waitingNumber: 3, status: 'CANCELLED', phoneNumber: '010-••••-0003', time: '17:35', rawPhone: '01010000003' },
    { waitingId: 13, boothId: 1, waitingNumber: 4, status: 'COMPLETED', phoneNumber: '010-••••-0004', time: '17:48', rawPhone: '01010000004' },
    { waitingId: 14, boothId: 1, waitingNumber: 5, status: 'COMPLETED', phoneNumber: '010-••••-0005', time: '18:01', rawPhone: '01010000005' },
    { waitingId: 15, boothId: 1, waitingNumber: 6, status: 'CANCELLED', phoneNumber: '010-••••-0006', time: '18:14', rawPhone: '01010000006' },
    { waitingId: 16, boothId: 1, waitingNumber: 7, status: 'COMPLETED', phoneNumber: '010-••••-0007', time: '18:27', rawPhone: '01010000007' },
    { waitingId: 17, boothId: 1, waitingNumber: 8, status: 'COMPLETED', phoneNumber: '010-••••-0008', time: '18:40', rawPhone: '01010000008' },

    // --- 부스 1: 현재 활성 대기 (CALLED 1팀 + WAITING 3팀) ---
    { waitingId: 18, boothId: 1, waitingNumber: 9,  status: 'CALLED',  phoneNumber: '010-••••-0009', time: '18:55', rawPhone: '01010000009' },
    { waitingId: 19, boothId: 1, waitingNumber: 10, status: 'WAITING', phoneNumber: '010-••••-0010', time: '19:02', rawPhone: '01010000010' },
    { waitingId: 20, boothId: 1, waitingNumber: 11, status: 'WAITING', phoneNumber: '010-••••-0011', time: '19:08', rawPhone: '01010000011' },
    { waitingId: 21, boothId: 1, waitingNumber: 12, status: 'WAITING', phoneNumber: '010-••••-0012', time: '19:14', rawPhone: '01010000012' },

    // --- 부스 2: 제주 흑돼지 꼬치 ---
    { waitingId: 30, boothId: 2, waitingNumber: 1, status: 'COMPLETED', phoneNumber: '010-••••-2001', time: '17:20', rawPhone: '01020002001' },
    { waitingId: 31, boothId: 2, waitingNumber: 2, status: 'COMPLETED', phoneNumber: '010-••••-2002', time: '17:50', rawPhone: '01020002002' },
    { waitingId: 32, boothId: 2, waitingNumber: 3, status: 'CALLED',    phoneNumber: '010-••••-2003', time: '18:50', rawPhone: '01020002003' },
    { waitingId: 33, boothId: 2, waitingNumber: 4, status: 'WAITING',   phoneNumber: '010-••••-2004', time: '19:00', rawPhone: '01020002004' },
    { waitingId: 34, boothId: 2, waitingNumber: 5, status: 'WAITING',   phoneNumber: '010-••••-2005', time: '19:05', rawPhone: '01020002005' },
    { waitingId: 35, boothId: 2, waitingNumber: 6, status: 'WAITING',   phoneNumber: '010-••••-2006', time: '19:08', rawPhone: '01020002006' },

    // --- 부스 4: 전통 호떡 & 어묵 (혼잡) ---
    { waitingId: 40, boothId: 4, waitingNumber: 1, status: 'COMPLETED', phoneNumber: '010-••••-4001', time: '16:00', rawPhone: '01040004001' },
    { waitingId: 41, boothId: 4, waitingNumber: 2, status: 'COMPLETED', phoneNumber: '010-••••-4002', time: '16:15', rawPhone: '01040004002' },
    { waitingId: 42, boothId: 4, waitingNumber: 3, status: 'COMPLETED', phoneNumber: '010-••••-4003', time: '16:30', rawPhone: '01040004003' },
    { waitingId: 43, boothId: 4, waitingNumber: 4, status: 'CANCELLED', phoneNumber: '010-••••-4004', time: '16:45', rawPhone: '01040004004' },
    { waitingId: 44, boothId: 4, waitingNumber: 5, status: 'COMPLETED', phoneNumber: '010-••••-4005', time: '17:00', rawPhone: '01040004005' },
    { waitingId: 45, boothId: 4, waitingNumber: 6, status: 'CALLED',    phoneNumber: '010-••••-4006', time: '18:45', rawPhone: '01040004006' },
    { waitingId: 46, boothId: 4, waitingNumber: 7, status: 'WAITING',   phoneNumber: '010-••••-4007', time: '19:00', rawPhone: '01040004007' },
    { waitingId: 47, boothId: 4, waitingNumber: 8, status: 'WAITING',   phoneNumber: '010-••••-4008', time: '19:03', rawPhone: '01040004008' },
    { waitingId: 48, boothId: 4, waitingNumber: 9, status: 'WAITING',   phoneNumber: '010-••••-4009', time: '19:06', rawPhone: '01040004009' },
    { waitingId: 49, boothId: 4, waitingNumber: 10, status: 'WAITING',  phoneNumber: '010-••••-4010', time: '19:08', rawPhone: '01040004010' },
    { waitingId: 50, boothId: 4, waitingNumber: 11, status: 'WAITING',  phoneNumber: '010-••••-4011', time: '19:10', rawPhone: '01040004011' },
    { waitingId: 51, boothId: 4, waitingNumber: 12, status: 'WAITING',  phoneNumber: '010-••••-4012', time: '19:12', rawPhone: '01040004012' },
    { waitingId: 52, boothId: 4, waitingNumber: 13, status: 'WAITING',  phoneNumber: '010-••••-4013', time: '19:14', rawPhone: '01040004013' },

    // --- 부스 6: 흑당 디저트 카페 ---
    { waitingId: 60, boothId: 6, waitingNumber: 1, status: 'COMPLETED', phoneNumber: '010-••••-6001', time: '17:00', rawPhone: '01060006001' },
    { waitingId: 61, boothId: 6, waitingNumber: 2, status: 'COMPLETED', phoneNumber: '010-••••-6002', time: '17:20', rawPhone: '01060006002' },
    { waitingId: 62, boothId: 6, waitingNumber: 3, status: 'CALLED',    phoneNumber: '010-••••-6003', time: '18:40', rawPhone: '01060006003' },
    { waitingId: 63, boothId: 6, waitingNumber: 4, status: 'WAITING',   phoneNumber: '010-••••-6004', time: '18:55', rawPhone: '01060006004' },
    { waitingId: 64, boothId: 6, waitingNumber: 5, status: 'WAITING',   phoneNumber: '010-••••-6005', time: '19:00', rawPhone: '01060006005' },
    { waitingId: 65, boothId: 6, waitingNumber: 6, status: 'WAITING',   phoneNumber: '010-••••-6006', time: '19:05', rawPhone: '01060006006' },
    { waitingId: 66, boothId: 6, waitingNumber: 7, status: 'WAITING',   phoneNumber: '010-••••-6007', time: '19:08', rawPhone: '01060006007' },
    { waitingId: 67, boothId: 6, waitingNumber: 8, status: 'WAITING',   phoneNumber: '010-••••-6008', time: '19:11', rawPhone: '01060006008' },

    // --- 부스 9: 황토 가마솥 백숙 (양평) ---
    { waitingId: 70, boothId: 9, waitingNumber: 1, status: 'COMPLETED', phoneNumber: '010-••••-9001', time: '10:30', rawPhone: '01090009001' },
    { waitingId: 71, boothId: 9, waitingNumber: 2, status: 'COMPLETED', phoneNumber: '010-••••-9002', time: '11:00', rawPhone: '01090009002' },
    { waitingId: 72, boothId: 9, waitingNumber: 3, status: 'CALLED',    phoneNumber: '010-••••-9003', time: '12:00', rawPhone: '01090009003' },
    { waitingId: 73, boothId: 9, waitingNumber: 4, status: 'WAITING',   phoneNumber: '010-••••-9004', time: '12:15', rawPhone: '01090009004' },
    { waitingId: 74, boothId: 9, waitingNumber: 5, status: 'WAITING',   phoneNumber: '010-••••-9005', time: '12:20', rawPhone: '01090009005' },
    { waitingId: 75, boothId: 9, waitingNumber: 6, status: 'WAITING',   phoneNumber: '010-••••-9006', time: '12:25', rawPhone: '01090009006' },

    // --- 부스 10: 전주 비빔밥 명인관 ---
    { waitingId: 80, boothId: 10, waitingNumber: 1, status: 'COMPLETED', phoneNumber: '010-••••-1001', time: '11:00', rawPhone: '01010001001' },
    { waitingId: 81, boothId: 10, waitingNumber: 2, status: 'COMPLETED', phoneNumber: '010-••••-1002', time: '11:30', rawPhone: '01010001002' },
    { waitingId: 82, boothId: 10, waitingNumber: 3, status: 'CANCELLED', phoneNumber: '010-••••-1003', time: '12:00', rawPhone: '01010001003' },
    { waitingId: 83, boothId: 10, waitingNumber: 4, status: 'CALLED',    phoneNumber: '010-••••-1004', time: '12:30', rawPhone: '01010001004' },
    { waitingId: 84, boothId: 10, waitingNumber: 5, status: 'WAITING',   phoneNumber: '010-••••-1005', time: '12:45', rawPhone: '01010001005' },
    { waitingId: 85, boothId: 10, waitingNumber: 6, status: 'WAITING',   phoneNumber: '010-••••-1006', time: '12:50', rawPhone: '01010001006' },
    { waitingId: 86, boothId: 10, waitingNumber: 7, status: 'WAITING',   phoneNumber: '010-••••-1007', time: '12:55', rawPhone: '01010001007' },
    { waitingId: 87, boothId: 10, waitingNumber: 8, status: 'WAITING',   phoneNumber: '010-••••-1008', time: '13:00', rawPhone: '01010001008' },
    { waitingId: 88, boothId: 10, waitingNumber: 9, status: 'WAITING',   phoneNumber: '010-••••-1009', time: '13:05', rawPhone: '01010001009' }
  ]
}

const getDb = () => {
  const dbStr = localStorage.getItem(DB_KEY)
  if (!dbStr) {
    localStorage.setItem(DB_KEY, JSON.stringify(initialDb))
    return initialDb
  }
  return JSON.parse(dbStr)
}

const saveDb = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export const handlers = [
  // 0) [POST] 이미지 파일 업로드 (Multipart)
  http.post('/api/files/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file')
    const ext = file?.name?.split('.').pop() || 'png'
    const fakeUrl = `/uploads/mock-${Date.now()}.${ext}`
    return HttpResponse.json({ imageUrl: fakeUrl })
  }),

  // 1) [GET] 캐싱된 전체 축제 목록 조회
  http.get('/api/festivals', () => {
    const db = getDb()
    return HttpResponse.json(db.festivals)
  }),

  // 2) [GET] 위치 기반 축제 추천 및 인근 관광지 혼잡도 조회
  http.get('/api/festivals/recommend', ({ request }) => {
    const url = new URL(request.url)
    const maxDistanceKm = parseFloat(url.searchParams.get('maxDistanceKm') || '50.0')
    const db = getDb()

    const touristSpotMap = {
      1: { // 양평
        dist: 78.5,
        spots: [
          { spotId: 1, name: "용문사 천년 은행나무", description: "수령 1100년 천연기념물 은행나무", location: "경기도 양평군 용문면", distanceKm: 1.2, congestionRate: 42, level: "쾌적" },
          { spotId: 2, name: "용문산 등산로 입구", description: "경기도 최고봉 등산 시작점", location: "경기도 양평군 용문면", distanceKm: 0.5, congestionRate: 35, level: "쾌적" }
        ]
      },
      2: { // 강릉
        dist: 230.1,
        spots: [
          { spotId: 3, name: "경포대 해수욕장", description: "강원도 대표 해수욕장", location: "강원도 강릉시 경포로", distanceKm: 3.2, congestionRate: 78, level: "혼잡" },
          { spotId: 4, name: "오죽헌", description: "율곡 이이 생가·신사임당 유적지", location: "강원도 강릉시 율곡로", distanceKm: 1.8, congestionRate: 55, level: "보통" },
          { spotId: 5, name: "강릉 커피 거리", description: "강릉 안목해변 카페 거리", location: "강원도 강릉시 창해로", distanceKm: 4.1, congestionRate: 65, level: "보통" }
        ]
      },
      3: { // 망원
        dist: 0.8,
        spots: [
          { spotId: 6, name: "망원 한강공원 잔디밭", description: "돗자리 펴고 노을 보기 좋은 잔디밭", location: "서울 마포구 마포나루길 467", distanceKm: 0.3, congestionRate: 48, level: "보통" },
          { spotId: 7, name: "망원시장", description: "유명 먹거리가 가득한 전통시장", location: "서울 마포구 망원동", distanceKm: 0.9, congestionRate: 85, level: "혼잡" }
        ]
      },
      4: { // 연남
        dist: 1.4,
        spots: [
          { spotId: 8, name: "경의선 숲길 책거리", description: "한적하게 산책하기 좋은 독서 숲길", location: "서울 마포구 연남동", distanceKm: 0.2, congestionRate: 25, level: "쾌적" },
          { spotId: 9, name: "연남동 카페 골목", description: "아기자기한 독립 카페들이 모인 골목", location: "서울 마포구 연남동", distanceKm: 0.4, congestionRate: 60, level: "보통" }
        ]
      },
      5: { // 홍대
        dist: 2.1,
        spots: [
          { spotId: 10, name: "홍대 걷고싶은거리", description: "버스킹·패션·예술이 공존하는 메인 스트릿", location: "서울 마포구 서교동", distanceKm: 0.5, congestionRate: 92, level: "혼잡" },
          { spotId: 11, name: "홍대 합정 카페거리", description: "메인 스트릿보다 한적한 감성 카페 골목", location: "서울 마포구 합정동", distanceKm: 1.1, congestionRate: 58, level: "보통" }
        ]
      },
      6: { // 전주
        dist: 240.3,
        spots: [
          { spotId: 12, name: "전동 성당", description: "100년 역사의 아름다운 로마네스크 성당", location: "전북 전주시 완산구 태조로", distanceKm: 0.3, congestionRate: 62, level: "보통" },
          { spotId: 13, name: "경기전", description: "태조 이성계 어진을 모신 조선 왕실 유적", location: "전북 전주시 완산구 태조로", distanceKm: 0.2, congestionRate: 70, level: "혼잡" },
          { spotId: 14, name: "전주 한옥마을 공방거리", description: "전통 공예 체험 공방들이 모인 골목", location: "전북 전주시 완산구 은행로", distanceKm: 0.5, congestionRate: 45, level: "보통" }
        ]
      }
    }

    const list = db.festivals.map(f => {
      const meta = touristSpotMap[f.festivalId] || { dist: 50.0, spots: [] }
      return { ...f, distanceKm: meta.dist, touristSpots: meta.spots }
    })

    const filtered = list.filter(item => item.distanceKm <= maxDistanceKm)
    return HttpResponse.json(filtered)
  }),

  // 3) [POST] 상인 부스 및 디지털 메뉴판 등록
  http.post('/api/booths', async ({ request }) => {
    const body = await request.json()
    const db = getDb()
    const newId = Math.max(...db.booths.map(b => b.id), 0) + 1
    const newBooth = {
      id: newId,
      festivalId: body.festivalId,
      name: body.name,
      description: body.description,
      locationDescription: body.locationDescription,
      currentWaitingCount: 0,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/qr/${newId}`,
      products: body.products.map((p, index) => ({
        id: Math.max(...db.booths.flatMap(b => b.products.map(pr => pr.id)), 0) + index + 1,
        ...p
      }))
    }
    db.booths.push(newBooth)
    saveDb(db)
    return HttpResponse.json(newBooth)
  }),

  // 4) [GET] 특정 축제 내 전체 부스 실시간 웨이팅 현황 조회
  http.get('/api/festivals/:festivalId/booths', ({ params }) => {
    const festivalId = parseInt(params.festivalId)
    const db = getDb()
    const festivalBooths = db.booths.filter(b => b.festivalId === festivalId).map(b => {
      const currentWaiting = db.waitings.filter(w => w.boothId === b.id && (w.status === 'WAITING' || w.status === 'CALLED')).length
      return {
        boothId: b.id,
        name: b.name,
        description: b.description,
        locationDescription: b.locationDescription,
        currentWaitingCount: currentWaiting,
        qrCodeUrl: b.qrCodeUrl
      }
    })
    return HttpResponse.json(festivalBooths)
  }),

  // [GET] 특정 부스의 전체 웨이팅 리스트 조회 (상인용)
  http.get('/api/booths/:boothId/waitings', ({ params }) => {
    const boothId = parseInt(params.boothId)
    const db = getDb()
    const boothWaitings = db.waitings.filter(w => w.boothId === boothId)
    const sorted = [...boothWaitings].sort((a, b) => {
      const aActive = a.status === 'WAITING' || a.status === 'CALLED'
      const bActive = b.status === 'WAITING' || b.status === 'CALLED'
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1
      return a.waitingNumber - b.waitingNumber
    })
    return HttpResponse.json(sorted)
  }),

  // 5) [GET] QR 코드 진입용 부스 상세 및 메뉴판 조회
  http.get('/api/booths/:boothId', ({ params }) => {
    const boothId = parseInt(params.boothId)
    const db = getDb()
    const booth = db.booths.find(b => b.id === boothId)
    if (!booth) {
      return new HttpResponse(null, { status: 404, statusText: 'Booth Not Found' })
    }
    const currentWaiting = db.waitings.filter(w => w.boothId === boothId && (w.status === 'WAITING' || w.status === 'CALLED')).length
    return HttpResponse.json({ ...booth, boothId: booth.id, currentWaitingCount: currentWaiting })
  }),

  // 6) [POST] 모바일 실시간 대기 등록 신청 (손님)
  http.post('/api/waitings', async ({ request }) => {
    const body = await request.json()
    const boothId = parseInt(body.boothId)
    const phoneNumber = body.phoneNumber
    const db = getDb()

    const booth = db.booths.find(b => b.id === boothId)
    if (!booth) {
      return new HttpResponse(null, { status: 404, statusText: 'Booth Not Found' })
    }

    // 이미 활성 대기가 있는지 체크
    const dup = db.waitings.find(w => w.boothId === boothId && w.rawPhone === phoneNumber && (w.status === 'WAITING' || w.status === 'CALLED'))
    if (dup) {
      return HttpResponse.json(dup)
    }

    const activeCount = db.waitings.filter(w => w.boothId === boothId && (w.status === 'WAITING' || w.status === 'CALLED')).length
    // 충돌 없는 ID 생성
    const waitingId = Math.max(...db.waitings.map(w => w.waitingId), 0) + 1
    const waitingNumber = Math.max(...db.waitings.filter(w => w.boothId === boothId).map(w => w.waitingNumber), 0) + 1
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newWaiting = {
      waitingId,
      waitingNumber,
      status: 'WAITING',
      waitingTeamsAhead: activeCount,
      phoneNumber: phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-••••-$3'),
      boothId,
      time: timeStr,
      rawPhone: phoneNumber
    }

    db.waitings.push(newWaiting)
    saveDb(db)

    return HttpResponse.json({
      waitingId: newWaiting.waitingId,
      waitingNumber: newWaiting.waitingNumber,
      status: newWaiting.status,
      waitingTeamsAhead: newWaiting.waitingTeamsAhead,
      phoneNumber: phoneNumber
    })
  }),

  // 7) [GET] 손님 실시간 순서/상태 폴링 조회 (4초 간격)
  http.get('/api/waitings/:waitingId/status', ({ params }) => {
    const waitingId = parseInt(params.waitingId)
    const db = getDb()
    const waiting = db.waitings.find(w => w.waitingId === waitingId)
    if (!waiting) {
      return new HttpResponse(null, { status: 404, statusText: 'Waiting Record Not Found' })
    }

    const activeWaitingsForBooth = db.waitings.filter(w => w.boothId === waiting.boothId && w.status === 'WAITING')
    const myIndex = activeWaitingsForBooth.findIndex(w => w.waitingId === waitingId)
    const ahead = myIndex === -1 ? 0 : myIndex

    return HttpResponse.json({
      waitingId: waiting.waitingId,
      waitingNumber: waiting.waitingNumber,
      status: waiting.status,
      waitingTeamsAhead: waiting.status === 'CALLED' ? 0 : ahead,
      phoneNumber: waiting.rawPhone || waiting.phoneNumber
    })
  }),

  // 8) [POST] 대기 고객 호출 (상인 제어)
  http.post('/api/waitings/:waitingId/call', ({ params }) => {
    const waitingId = parseInt(params.waitingId)
    const db = getDb()
    const waiting = db.waitings.find(w => w.waitingId === waitingId)
    if (!waiting) {
      return new HttpResponse(null, { status: 404, statusText: 'Waiting Not Found' })
    }
    waiting.status = 'CALLED'
    saveDb(db)
    return HttpResponse.json({ waitingId: waiting.waitingId, status: 'CALLED' })
  }),

  // 9) [POST] 입장 완료 처리
  http.post('/api/waitings/:waitingId/complete', ({ params }) => {
    const waitingId = parseInt(params.waitingId)
    const db = getDb()
    const waiting = db.waitings.find(w => w.waitingId === waitingId)
    if (!waiting) {
      return new HttpResponse(null, { status: 404, statusText: 'Waiting Not Found' })
    }
    waiting.status = 'COMPLETED'
    saveDb(db)
    return HttpResponse.json({ waitingId: waiting.waitingId, status: 'COMPLETED' })
  }),

  // 취소 처리
  http.post('/api/waitings/:waitingId/cancel', ({ params }) => {
    const waitingId = parseInt(params.waitingId)
    const db = getDb()
    const waiting = db.waitings.find(w => w.waitingId === waitingId)
    if (!waiting) {
      return new HttpResponse(null, { status: 404, statusText: 'Waiting Not Found' })
    }
    waiting.status = 'CANCELLED'
    saveDb(db)
    return HttpResponse.json({ waitingId: waiting.waitingId, status: 'CANCELLED' })
  }),

  // 10) [GET] AI 자연어 큐레이션 API
  http.get('/api/ai/curate', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || ''

    let parsedLocation = "서울"
    let spots = [{ name: "망원 한강공원 잔디밭", congestionRate: 48, level: "보통" }]
    let reason = "현재 위치 기반으로 망원 한강 야시장 인근 '망원 한강공원 잔디밭(보통 48%)'이 가장 쾌적합니다."

    if (query.includes('양평') || query.includes('산나물') || query.includes('나물')) {
      parsedLocation = "양평"
      spots = [{ name: "용문사 천년 은행나무", congestionRate: 42, level: "쾌적" }]
      reason = "양평 용문산 산나물 축제 근처에서 혼잡도 42%(쾌적)를 기록 중인 '용문사 천년 은행나무' 코스가 산책에 적합합니다."
    } else if (query.includes('야시장') || query.includes('망원') || query.includes('한강')) {
      parsedLocation = "망원"
      spots = [
        { name: "망원 한강공원 잔디밭", congestionRate: 48, level: "보통" },
        { name: "망원시장", congestionRate: 85, level: "혼잡" }
      ]
      reason = "망원 한강 야시장 근처 '잔디밭(보통 48%)'은 여유롭지만 '망원시장(혼잡 85%)'은 피하시길 권장합니다."
    } else if (query.includes('연남') || query.includes('경의선') || query.includes('숲')) {
      parsedLocation = "연남"
      spots = [{ name: "경의선 숲길 책거리", congestionRate: 25, level: "쾌적" }]
      reason = "연남 수제 먹거리 페어 인근 '경의선 숲길 책거리(쾌적 25%)'가 산책하기 가장 좋은 코스입니다."
    } else if (query.includes('홍대') || query.includes('인디') || query.includes('공연') || query.includes('음악')) {
      parsedLocation = "홍대"
      spots = [{ name: "홍대 합정 카페거리", congestionRate: 58, level: "보통" }]
      reason = "홍대 인디 밴드 페스티벌 근처에서 메인 거리보다 한적한 '합정 카페거리(보통 58%)'를 추천합니다."
    } else if (query.includes('전주') || query.includes('한옥') || query.includes('비빔밥')) {
      parsedLocation = "전주"
      spots = [
        { name: "전동 성당", congestionRate: 62, level: "보통" },
        { name: "경기전", congestionRate: 70, level: "혼잡" }
      ]
      reason = "전주 한옥마을 축제 인근 '전동 성당(보통 62%)'이 사진 찍기 좋고, '경기전(혼잡 70%)'은 오전 방문을 권장합니다."
    } else if (query.includes('강릉') || query.includes('단오') || query.includes('바다') || query.includes('해변')) {
      parsedLocation = "강릉"
      spots = [
        { name: "경포대 해수욕장", congestionRate: 78, level: "혼잡" },
        { name: "강릉 커피 거리", congestionRate: 65, level: "보통" }
      ]
      reason = "강릉 단오제 인근 '경포대(혼잡 78%)'는 붐비니 '안목 커피 거리(보통 65%)'에서 여유롭게 즐기시길 권합니다."
    }

    return HttpResponse.json({ query, parsedLocation, recommendedSpots: spots, aiRecommendationReason: reason })
  }),

  // [ADMIN] 로그인
  http.post('/api/admin/login', async ({ request }) => {
    const { email, password } = await request.json()

    // 테스트 계정: owner@example.com / owner1234
    if (email === 'owner@example.com' && password === 'owner1234') {
      return HttpResponse.json({
        token: 'mock-admin-token-abc123',
        boothId: 1,
        boothName: '할매 손칼국수',
      })
    }
    return new HttpResponse(JSON.stringify({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }),

  // [ADMIN] 로그아웃
  http.post('/api/admin/logout', () => {
    return HttpResponse.json({ ok: true })
  }),

  // [DEV ONLY] 앞팀 한 칸 처리: CALLED → COMPLETED, 다음 WAITING → CALLED
  // TrackPage 개발 테스트용 — 프로덕션에서는 MSW가 꺼지므로 자동으로 비활성화됨
  http.post('/api/dev/advance/:boothId', ({ params }) => {
    const boothId = parseInt(params.boothId)
    const db = getDb()

    // 1) 현재 CALLED 팀 → COMPLETED
    const calledWaiting = db.waitings.find(w => w.boothId === boothId && w.status === 'CALLED')
    if (calledWaiting) calledWaiting.status = 'COMPLETED'

    // 2) 가장 앞 번호의 WAITING 팀 → CALLED
    const nextWaiting = db.waitings
      .filter(w => w.boothId === boothId && w.status === 'WAITING')
      .sort((a, b) => a.waitingNumber - b.waitingNumber)[0]
    if (nextWaiting) nextWaiting.status = 'CALLED'

    saveDb(db)
    return HttpResponse.json({
      completed: calledWaiting?.waitingNumber ?? null,
      called: nextWaiting?.waitingNumber ?? null,
    })
  })
]
