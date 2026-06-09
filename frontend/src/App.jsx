import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import SplashPage       from './pages/auth/SplashPage'
import OnboardingPage   from './pages/auth/OnboardingPage'
import AuthPhonePage    from './pages/auth/AuthPhonePage'
import AuthOTPPage      from './pages/auth/AuthOTPPage'
import HomePage         from './pages/home/HomePage'
import BoothListPage    from './pages/booth/BoothListPage'
import BoothDetailPage  from './pages/booth/BoothDetailPage'
import TrackPage        from './pages/track/TrackPage'
import ResultPage       from './pages/result/ResultPage'
import AdminLoginPage   from './pages/admin/AdminLoginPage'
import AdminRegisterPage from './pages/admin/AdminRegisterPage'
import AdminQueuePage   from './pages/admin/AdminQueuePage'
import OrganizerDashboardPage from './pages/admin/OrganizerDashboardPage'
import SuperAdminDashboardPage from './pages/admin/SuperAdminDashboardPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import MyHistoryPage    from './pages/MyHistoryPage'
import QrLandingPage   from './pages/qr/QrLandingPage'
import ErrorPage        from './pages/ErrorPage'

// 모바일 래퍼 (방문객 화면용)
// - 실제 모바일(≤640px): 전체화면
// - 데스크탑: 폰 프레임 미리보기
function MobileWrapper({ children }) {
  return (
    <>
      {/* 모바일 + 태블릿: 전체화면 */}
      <div className="xl:hidden w-screen h-[100dvh] flex flex-col bg-[#faf8f4] overflow-hidden relative"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
        {children}
      </div>
      {/* 큰 데스크탑(1280px+): 폰 프레임 미리보기 */}
      <div className="hidden xl:flex min-h-screen bg-[#efece6] items-center justify-center">
        <div className="w-[375px] h-[812px] relative overflow-hidden bg-[#faf8f4] shadow-2xl rounded-[30px] border-[1.5px] border-[#34322e] flex flex-col"
          style={{ boxShadow: '0 10px 34px rgba(0,0,0,0.12)' }}>
          {/* 상태바 */}
          <div className="flex-none h-[30px] flex items-center justify-between px-5 bg-white font-num text-[12px] font-semibold text-[#7c7972]">
            <span>9:41</span>
            <span className="flex gap-1 items-center">
              <span className="tracking-[-1px]">●●●</span>
              <span className="text-[11px]">5G</span>
              <span className="w-5 h-[11px] border border-current rounded-sm inline-block relative opacity-80">
                <span className="absolute inset-0 w-[70%] bg-current rounded-sm" />
              </span>
            </span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// 페이지 전환 애니메이션 래퍼
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute inset-0 w-full h-full flex flex-col"
    >
      {children}
    </motion.div>
  )
}

// 어드민 페이지 전환 애니메이션 래퍼
function AdminPageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute inset-0 w-full h-full"
    >
      {children}
    </motion.div>
  )
}

// 라우터 애니메이션 처리 영역
function AnimatedRoutes() {
  const location = useLocation()

  // 스플래시 화면은 자체 애니메이션을 가지므로 PageTransition의 슬라이드 효과를 제외 (단순 페이드)
  const isSplash = location.pathname === '/splash'

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* 방문객 화면 */}
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            className="absolute inset-0 w-full h-full"
          >
            <SplashPage />
          </motion.div>
        } />
        {/* 인증 불필요 */}
        <Route path="/onboarding" element={<PageTransition><OnboardingPage /></PageTransition>} />
        <Route path="/auth/phone" element={<PageTransition><AuthPhonePage /></PageTransition>} />
        <Route path="/auth/otp" element={<PageTransition><PhoneStepGuard><AuthOTPPage /></PhoneStepGuard></PageTransition>} />
        <Route path="/qr/:boothId" element={<PageTransition><QrLandingPage /></PageTransition>} />
        <Route path="/track/:waitingId" element={<PageTransition><TrackPage /></PageTransition>} />
        <Route path="/error" element={<PageTransition><ErrorPage /></PageTransition>} />

        <Route path="/home" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/booths/:festivalId" element={<PageTransition><BoothListPage /></PageTransition>} />
        <Route path="/booth/:boothId" element={<PageTransition><BoothDetailPage /></PageTransition>} />
        <Route path="/result/:type" element={<PageTransition><ResultPage /></PageTransition>} />
        <Route path="/history" element={<PageTransition><MyHistoryPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

// 어드민 애니메이션 라우팅
function AdminAnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route index element={<AdminPageTransition><AdminLoginPage /></AdminPageTransition>} />
        <Route path="login" element={<AdminPageTransition><AdminLoginPage /></AdminPageTransition>} />
        <Route path="register" element={<AdminPageTransition><AdminGuard><AdminRegisterPage /></AdminGuard></AdminPageTransition>} />
        <Route path="queue" element={<AdminPageTransition><AdminGuard><AdminQueuePage /></AdminGuard></AdminPageTransition>} />
        <Route path="organizer" element={<AdminPageTransition><AdminGuard><OrganizerDashboardPage /></AdminGuard></AdminPageTransition>} />
        <Route path="super" element={<AdminPageTransition><AdminGuard><SuperAdminDashboardPage /></AdminGuard></AdminPageTransition>} />
        <Route path="settings" element={<AdminPageTransition><AdminGuard><AdminSettingsPage /></AdminGuard></AdminPageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

// 어드민 래퍼 (PC 화면용)
function DesktopWrapper({ children }) {
  return (
    <div className="w-screen h-screen bg-[#faf8f4] flex">
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}

// ── 세션 헬퍼 ──────────────────────────────────────────
function getAdminSession() {
  try {
    const s = sessionStorage.getItem('admin_session') || localStorage.getItem('admin_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function getUserSession() {
  try {
    const s = localStorage.getItem('user_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

// ── 어드민 Guard: 로그인 없으면 /admin으로 ──────────────
function AdminGuard({ children }) {
  if (!getAdminSession()?.token) return <Navigate to="/admin" replace />
  return children
}

// ── 사용자 Guard: 인증 없으면 /onboarding으로 ───────────
function UserGuard({ children }) {
  if (!getUserSession()?.authenticated) return <Navigate to="/onboarding" replace />
  return children
}

// ── 전화번호 입력 후에만 OTP 접근 허용 ──────────────────
function PhoneStepGuard({ children }) {
  if (!sessionStorage.getItem('otp_pending')) return <Navigate to="/auth/phone" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 어드민 라우트 */}
        <Route path="/admin/*" element={<DesktopWrapper><AdminAnimatedRoutes /></DesktopWrapper>} />

        {/* 손님 라우트 */}
        <Route path="*" element={<MobileWrapper><AnimatedRoutes /></MobileWrapper>} />
      </Routes>
    </BrowserRouter>
  )
}
