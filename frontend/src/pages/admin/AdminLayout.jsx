import { useNavigate, useLocation } from 'react-router-dom'
import Logo from '../../components/common/Logo'

const NAV = [
  { icon: '🏪', label: '부스관리', path: '/admin/register' },
  { icon: '📋', label: '대기열', path: '/admin/queue' },
  { icon: '📊', label: '통계', path: '/admin/stats' },
  { icon: '⚙️', label: '설정', path: '/admin/settings' },
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

      {/* ── 태블릿+ 사이드바 (sm 이상에서만 표시) ── */}
      <div className="hidden sm:flex w-[168px] flex-none bg-white border-r border-[#e8e5de] px-3 py-4 flex-col gap-1">
        <div className="px-2 pb-4"><Logo /></div>
        {NAV.map(({ icon, label, path }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-[9px] text-[13.5px] transition-colors w-full text-left
                ${active ? 'font-num font-bold text-[#b56a2c] bg-[#f8e9d8]' : 'text-[#7c7972] hover:bg-[#f6f4ef]'}`}
            >
              <span>{icon}</span>{label}
            </button>
          )
        })}
        <div className="flex-1" />
        <div className="border-t border-[#e8e5de] pt-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 px-2 py-1 text-[12px] text-[#7c7972]">
            <span className="w-7 h-7 rounded-full bg-[#efece6] border border-[#e8e5de] flex items-center justify-center text-[14px] flex-none">🏪</span>
            <span className="truncate">{session?.boothName ?? '내 부스'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-2.5 py-2 rounded-[9px] text-[12.5px] text-[#E5483B] hover:bg-[#fbe4e1] transition-colors w-full"
          >
            <span>🚪</span> 로그아웃
          </button>
        </div>
      </div>

      {/* ── 메인 콘텐츠 영역 ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* 모바일 전용 상단 헤더 */}
        <div className="sm:hidden flex-none flex items-center justify-between px-4 py-3 bg-white border-b border-[#e8e5de]">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#7c7972] truncate max-w-[100px]">{session?.boothName ?? '내 부스'}</span>
            <button
              onClick={handleLogout}
              className="text-[12px] text-[#E5483B] font-semibold px-2.5 py-1.5 rounded-lg bg-[#fbe4e1]"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 페이지 콘텐츠 — 모바일에서 하단 탭바 높이만큼 패딩 */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col pb-0 sm:pb-0">
          <div className="flex-1 min-h-0 overflow-auto [padding-bottom:env(safe-area-inset-bottom)] sm:pb-0"
            style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="sm:[padding-bottom:0px] h-full flex flex-col"
              style={{ paddingBottom: 0 }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* ── 모바일 전용 하단 탭바 ── */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e5de] flex z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV.map(({ icon, label, path }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors
                ${active ? 'text-[#e08a45]' : 'text-[#a9a59c]'}`}
            >
              <span className="text-[20px] leading-none">{icon}</span>
              <span className={`text-[10px] font-num font-semibold ${active ? 'text-[#b56a2c]' : 'text-[#a9a59c]'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

    </div>
  )
}
