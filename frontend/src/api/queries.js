import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'

// 파일 업로드 (Multipart) — 단독 호출용 유틸 함수 (클라이언트 리사이징 추가)
export async function uploadImage(file) {
  const compressedFile = await new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });

  const formData = new FormData();
  formData.append('file', compressedFile);
  const { data } = await client.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.imageUrl; // "/uploads/xxx.png"
}

// 1) [GET] 캐싱된 전체 축제 목록 조회
export function useFestivals() {
  return useQuery({
    queryKey: ['festivals'],
    queryFn: async () => {
      const { data } = await client.get('/api/festivals')
      return data
    }
  })
}

// 2) [GET] 위치 기반 축제 추천 및 인 근 관광지 혼잡도 조회
export function useRecommendFestivals({ latitude, longitude, maxDistanceKm = 50.0, address, availableHours, visitDate }) {
  return useQuery({
    queryKey: ['recommendFestivals', latitude, longitude, maxDistanceKm, address, availableHours, visitDate],
    queryFn: async () => {
      const params = { latitude, longitude, maxDistanceKm }
      if (address)        params.address        = address
      if (availableHours) params.availableHours = availableHours
      if (visitDate)      params.visitDate      = visitDate
      const { data } = await client.get('/api/festivals/recommend', { params })
      return data
    },
    enabled: !!latitude && !!longitude
  })
}

// 4) [GET] 특정 축제 내 전체 부스 실 시간 웨이팅 현황 조회
export function useFestivalBooths(festivalId) {
  return useQuery({
    queryKey: ['festivalBooths', festivalId],
    queryFn: async () => {
      const { data } = await client.get(`/api/festivals/${festivalId}/booths`)
      return data
    },
    enabled: !!festivalId
  })
}

// 5) [GET] QR 코드 진입용 부스 상세  및 메뉴판 조회
export function useBoothDetail(boothId, overrides = {}) {
  return useQuery({
    queryKey: ['boothDetail', boothId],
    queryFn: async () => {
      const { data } = await client.get(`/api/booths/${boothId}`)
      return data
    },
    enabled: !!boothId,
    ...overrides,
  })
}

// 6) [POST] 모바일 실시간 대기 등록  신청 (손님) — POST /api/booths/:id/waitings
export function useRegisterWaiting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ boothId, phoneNumber }) => {
      const { data } = await client.post(`/api/booths/${boothId}/waitings`, { phoneNumber })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boothDetail'] })
      queryClient.invalidateQueries({ queryKey: ['festivalBooths'] })
      queryClient.invalidateQueries({ queryKey: ['boothWaitings'] })
    }
  })
}

// 손님 토큰 헤더 유틸
function getCustomerAuthHeader() {
  const token = localStorage.getItem('customer_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// [GET] 내 활성 대기 목록 조회 (손님 세션 복원용)
export function useMyActiveWaitings(festivalId) {
  return useQuery({
    queryKey: ['myActiveWaitings', festivalId],
    queryFn: async () => {
      const { data } = await client.get('/api/waitings/my-active', {
        params: { festivalId },
        headers: getCustomerAuthHeader(),
      })
      return data // [{ waitingId, waitingNumber, status, waitingTeamsAhead, phoneNumber }]
    },
    enabled: !!festivalId && !!localStorage.getItem('customer_token'),
  })
}

// 7) [GET] 손님 실시간 순서/상태 폴링 조회 (4초 간격)

export function useWaitingStatus(waitingId) {
  return useQuery({
    queryKey: ['waitingStatus', waitingId],
    queryFn: async () => {
      const { data } = await client.get(`/api/waitings/${waitingId}/status`, {
        headers: getCustomerAuthHeader(),
      })
      return data
    },
    enabled: !!waitingId,
    refetchInterval: 4000
  })
}

// 특정 부스의 웨이팅 목록 조회 (상인 어드민용)
export function useBoothWaitings(boothId, overrides = {}) {
  return useQuery({
    queryKey: ['boothWaitings', boothId],
    queryFn: async () => {
      const { data } = await client.get(`/api/booths/${boothId}/waitings`)
      return data
    },
    enabled: !!boothId,
    refetchInterval: 4000,
    staleTime: 4000,
    placeholderData: (prev) => prev,
    ...overrides,
  })
}

// 9) [POST] 대기 고객 취소 처리 (손님/상인 제어)
export function useCancelWaiting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (waitingId) => {
      const { data } = await client.post(`/api/waitings/${waitingId}/cancel`, {}, {
        headers: getCustomerAuthHeader(),
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['waitingStatus', data.waitingId] })
      queryClient.invalidateQueries({ queryKey: ['festivalBooths'] })
      queryClient.invalidateQueries({ queryKey: ['boothDetail'] })
      queryClient.invalidateQueries({ queryKey: ['boothWaitings'] })
    }
  })
}

// 8) [POST] 다음 대기 고객 호출 (상인 제어) — POST /api/booths/:id/waitings/call-next
export function useCallWaiting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (boothId) => {
      const { data } = await client.post(`/api/booths/${boothId}/waitings/call-next`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivalBooths'] })
      queryClient.invalidateQueries({ queryKey: ['boothWaitings'] })
    }
  })
}

// 9) [POST] 대기 고객 입장 처리 (상인 제어)
export function useCompleteWaiting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (waitingId) => {
      const { data } = await client.post(`/api/waitings/${waitingId}/complete`)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['waitingStatus', data.waitingId] })
      queryClient.invalidateQueries({ queryKey: ['festivalBooths'] })
      queryClient.invalidateQueries({ queryKey: ['boothWaitings'] })
    }
  })
}

// 10) [GET] ennoia AI 자연어 큐레이션 통합 API
export function useAiCurate(queryText, enabled = false) {
  return useQuery({
    queryKey: ['aiCurate', queryText],
    queryFn: async () => {
      const { data } = await client.get('/api/ai/curate', {
        params: { query: queryText }
      })
      return data
    },
    enabled: enabled && !!queryText
  })
}