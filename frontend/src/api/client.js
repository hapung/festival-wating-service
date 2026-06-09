import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청마다 세션 토큰 자동 주입
client.interceptors.request.use((config) => {
  try {
    const raw = sessionStorage.getItem('admin_session') || localStorage.getItem('admin_session')
    const session = raw ? JSON.parse(raw) : null
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`
    }
  } catch {}
  return config
})

// 401 / 403 응답 시 → 세션 토큰만 조용히 삭제하고 에러를 컴포넌트에게 전달
// 자동 리다이렉트 하지 않음: 폼에서 직접 에러 메시지를 보여주고 사용자가 직접 로그인하도록 유도
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    // 401 Unauthorized만 세션 만료로 간주. 
    // 403 Forbidden은 역할(권한) 부족일 가능성이 높으므로 세션 유지를 위해 삭제하지 않음
    if (status === 401) {
      const pathname = window.location.pathname
      const isAdminPage = pathname.startsWith('/admin')
      const isLoginPage = pathname === '/admin' || pathname === '/admin/login'
      if (isAdminPage && !isLoginPage) {
        sessionStorage.removeItem('admin_session')
        localStorage.removeItem('admin_session')
        error.isSessionExpired = true
      }
    }
    return Promise.reject(error)
  }
)

export const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('/uploads')) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
    return `${apiBaseUrl.replace(/\/$/, '')}${url}`
  }
  return url
}

export default client
