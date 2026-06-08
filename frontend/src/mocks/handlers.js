import { http, HttpResponse } from 'msw'

export const handlers = [
  // 예시: 축제 목록 가져오기
  http.get('/api/festivals', () => {
    return HttpResponse.json([
      { id: 1, name: '서울 불꽃 축제', location: '여의도' },
      { id: 2, name: '부산 국제 영화제', location: '해운대' },
    ])
  }),
]
