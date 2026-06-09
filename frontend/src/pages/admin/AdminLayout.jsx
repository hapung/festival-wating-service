import { useNavigate, useLocation } from 'react-router-dom'
import Logo from '../../components/common/Logo'

const NAV = [
  { icon: '🏪', label: '부스관리', path: '/admin/register' },
  { icon: '📋', label: '대기열', path: '/admin/queue' },
  { icon: '👤', label: '내 정보', path: '/admin/settings' },
]

function getAdminSession() {
  try {
    const s = sessionStorage.getItem('admin_session') || localStorage.getItem('admin_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const session = getAdminSession()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
    sessionStorage.removeItem('admin_session')
    localStorage.removeItem('admin_session')
    navigate('/admin', { replace: true })
  }

  return (
    <div className="flex h-full w-full font-[Gowun_Dodum,system-ui] bg-[#faf8f4]">

      {/* ── 태블릿+ 사이드바 ── */}
      <div className="hidden sm:flex w-[180px] flex-none flex-col bg-white border-r border-[#ece9e3]">
        <div className="px-4 pt-5 pb-4 border-b border-[#ece9e3]"><Logo /></div>
        <div className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ icon, label, path }) => {
            const active = pathname === path
            return (
              <button key={path} onClick={() => navigate(path)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13.5px] transition-all w-full text-left"
                style={{
                  background: active ? '#f8e9d8' : 'transparent',
                  color: active ? '#b56a2c' : '#7c7972',
                  fontWeight: active ? 700 : 400,
                }}>
                <span className="text-[18px] leading-none">{icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
        <div className="px-3 pb-4 pt-3 border-t border-[#ece9e3] flex flex-col gap-1">
          <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#7c7972]">
            <span className="text-[14px]">🏪</span>
            <span className="truncate">{session?.boothName ?? '내 부스'}</span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl text-[12.5px] text-[#E5483B] hover:bg-[#fbe4e1] transition-all w-full">
            <span>🚪</span> 로그아웃
          </button>
        </div>
      </div>

      {/* ── 모바일: 전체 레이아웃 ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden sm:overflow-visible">

        {/* 모바일 헤더 — 홈과 동일 스타일 */}
        <div className="sm:hidden flex-none flex items-center justify-between px-5 bg-white z-10 relative border-b border-[#ece9e3]"
          style={{ paddingTop: '16px', paddingBottom: '16px' }}>
          <Logo />
          <button onClick={handleLogout}
            className="text-[12px] text-[#E5483B] font-semibold px-2.5 py-1.5 rounded-xl bg-[#fbe4e1]">
            로그아웃
          </button>
        </div>

        {/* 페이지 콘텐츠 */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col"
          style={{ paddingBottom: '68px' }}>
          <div className="h-full flex flex-col" style={{ paddingBottom: 0 }}>
            {children}
          </div>
        </div>
      </div>

      {/* ── 모바일 하단 탭바 — 홈과 동일 스타일 ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white"
        style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.07)' }}>
        <div className="flex">
          {NAV.map(({ icon, label, path }) => {
            const active = pathname === path
            return (
              <button key={path} onClick={() => navigate(path)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all relative">
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-[#e08a45]" />
                )}
                <span className="text-[20px] leading-none">{icon}</span>
                <span className="text-[10px] font-num font-bold" style={{ color: active ? '#b56a2c' : '#a9a59c' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
