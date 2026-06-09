import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import FWInput from '../../components/common/FWInput'
import Btn from '../../components/common/Btn'

function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export default function AdminLoginPage() {
  const [view, setView] = useState('login') // 'login' | 'signup' | 'pending'
  const navigate = useNavigate()

  // ── 세션 만료 안내 (서버 재배포 시 토큰 무효화) ───────────────────
  const [sessionExpired, setSessionExpired] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reason') === 'session_expired') {
      setSessionExpired(true)
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/admin/login')
    }
  }, [])

  // ── 로그인 ──────────────────────────────────────────────────────
  const [username, setUsername] = useState('')
  const [pw, setPw]             = useState('')
  const [keep, setKeep]         = useState(false)
  const [loginError, setLoginError] = useState('')

  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !pw) { setLoginError('아이디와 비밀번호를 입력해 주세요.'); return }
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pw }),
      })
      let data = null
      try { data = await res.json() } catch { /* non-JSON */ }
      if (!res.ok) {
        setLoginError('로그인 실패')
        return
      }
      if (!data?.token) {
        setLoginError('로그인 실패')
        return
      }
      const payload = decodeJWT(data.token)
      const role = payload?.role || 'ROLE_MERCHANT'
      
      // 1) username 키로 저장된 boothId 확인
      const savedBoothId = localStorage.getItem(`booth_${username}`)
      // 2) 혹은 기존 localStorage 세션에 남아있는 boothId 활용 (코드 변경 이전 등록된 부스 복원)
      const prevSession = (() => { try { return JSON.parse(localStorage.getItem('admin_session')) } catch { return null } })()
      const resolvedBoothId = savedBoothId ? Number(savedBoothId) : (prevSession?.boothId || null)

      const storage = keep ? localStorage : sessionStorage
      storage.setItem('admin_session', JSON.stringify({
        token: data.token,
        boothName: username,
        username,
        role,
        ...(resolvedBoothId ? { boothId: resolvedBoothId } : {}),
      }))

      if (role === 'ROLE_ADMIN') {
        navigate('/admin/super', { replace: true })
      } else if (role === 'ROLE_ORGANIZER') {
        navigate('/admin/organizer', { replace: true })
      } else {
        navigate('/admin/register', { replace: true })
      }
    } catch (err) {
      setLoginError('로그인 실패')
    } finally {
      setLoginLoading(false)
    }
  }

  // ── 회원가입 ─────────────────────────────────────────────────────
  const [signupForm, setSignupForm] = useState({ username: '', password: '', name: '', phoneNumber: '', role: 'ROLE_MERCHANT' })
  const [signupError, setSignupError]   = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  const updateSignup = (key, val) => setSignupForm(f => ({ ...f, [key]: val }))

  const handleSignup = async () => {
    const { username: u, password: p, name: n, phoneNumber: ph, role: r } = signupForm
    if (!u || !p || !n || !ph) { setSignupError('모든 항목을 입력해 주세요.'); return }
    if (p.length < 6) { setSignupError('비밀번호는 6자 이상이어야 합니다.'); return }
    setSignupError(''); setSignupLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p, name: n, phoneNumber: ph, role: r }),
      })
      if (!res.ok) {
        const msg = await res.text()
        setSignupError(msg || '회원가입에 실패했습니다.')
        return
      }
      setView('pending')
    } catch {
      setSignupError('서버에 연결할 수 없습니다.')
    } finally {
      setSignupLoading(false)
    }
  }

  const LoginForm = (
    <div className="flex flex-col gap-4 w-full">
      {sessionExpired && (
        <div className="text-[12.5px] text-[#b56a2c] font-num bg-[#fdf5ec] border border-[#ecd3b6] rounded-xl py-3 px-4 flex items-start gap-2.5">
          <span className="text-[16px] flex-none mt-0.5">🔄</span>
          <div>
            <div className="font-semibold mb-0.5">서버가 재시작되어 로그인이 필요합니다</div>
            <div className="text-[11.5px] text-[#a9a59c]">기존 세션이 만료되었습니다. 다시 로그인해 주세요.</div>
          </div>
        </div>
      )}
      <div>
        <div className="text-[12px] text-[#7c7972] font-num font-semibold mb-1.5">아이디</div>
        <FWInput
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="아이디를 입력하세요"
        />
      </div>
      <div>
        <div className="text-[12px] text-[#7c7972] font-num font-semibold mb-1.5">비밀번호</div>
        <FWInput value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          type="password" placeholder="비밀번호를 입력하세요" />
      </div>

      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setKeep(k => !k)}>
          <span className="w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center text-[12px] text-white flex-none transition-colors"
            style={{ borderColor: keep ? '#e08a45' : '#d8d4cc', background: keep ? '#e08a45' : '#fff' }}>
            {keep ? '✓' : ''}
          </span>
          <span className="text-[13px] text-[#7c7972]">로그인 상태 유지</span>
        </label>
      </div>

      {loginError && (
        <div className="text-[12.5px] text-[#E5483B] font-num text-center bg-[#fbe4e1] rounded-xl py-2.5 px-3">{loginError}</div>
      )}
      <Btn variant="primary" full onClick={handleLogin} disabled={loginLoading}>
        {loginLoading ? '로그인 중...' : '로그인'}
      </Btn>
      <div className="text-center text-[13px] text-[#7c7972]">
        계정이 없으신가요?{' '}
        <button className="text-[#b56a2c] font-semibold underline" onClick={() => { setView('signup'); setLoginError('') }}>
          회원가입
        </button>
      </div>
    </div>
  )

  const SignupForm = (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-2 mb-2">
        <button type="button" onClick={() => updateSignup('role', 'ROLE_MERCHANT')} 
          className={`flex-1 py-2 text-[13px] font-semibold rounded-xl border transition-colors ${signupForm.role === 'ROLE_MERCHANT' ? 'bg-[#fdf5ec] border-[#e08a45] text-[#b56a2c]' : 'bg-[#faf8f4] border-[#e8e5de] text-[#a9a59c]'}`}>
          상인 (부스 운영)
        </button>
        <button type="button" onClick={() => updateSignup('role', 'ROLE_ORGANIZER')} 
          className={`flex-1 py-2 text-[13px] font-semibold rounded-xl border transition-colors ${signupForm.role === 'ROLE_ORGANIZER' ? 'bg-[#fdf5ec] border-[#e08a45] text-[#b56a2c]' : 'bg-[#faf8f4] border-[#e8e5de] text-[#a9a59c]'}`}>
          주최측 (축제 기획)
        </button>
      </div>

      {[
        { label: '아이디', key: 'username', placeholder: '영문+숫자 조합', type: 'text' },
        { label: '비밀번호', key: 'password', placeholder: '6자 이상', type: 'password' },
        { label: '이름', key: 'name', placeholder: '실명을 입력하세요', type: 'text' },
        { label: '전화번호', key: 'phoneNumber', placeholder: '01012345678', type: 'tel' },
      ].map(({ label, key, placeholder, type }) => (
        <div key={key}>
          <div className="text-[12px] text-[#7c7972] font-num font-semibold mb-1.5">{label}</div>
          <FWInput value={signupForm[key]} onChange={e => updateSignup(key, e.target.value)}
            type={type} placeholder={placeholder} />
        </div>
      ))}
      {signupError && (
        <div className="text-[12.5px] text-[#E5483B] font-num text-center bg-[#fbe4e1] rounded-xl py-2.5 px-3">{signupError}</div>
      )}
      <Btn variant="primary" full onClick={handleSignup} disabled={signupLoading}>
        {signupLoading ? '가입 중...' : signupForm.role === 'ROLE_MERCHANT' ? '상인 계정 신청' : '주최측 계정 신청'}
      </Btn>
      <div className="text-center text-[13px] text-[#7c7972]">
        이미 계정이 있으신가요?{' '}
        <button className="text-[#b56a2c] font-semibold underline" onClick={() => { setView('login'); setSignupError('') }}>
          로그인
        </button>
      </div>
    </div>
  )

  const PendingView = (
    <div className="flex flex-col items-center gap-4 w-full text-center py-4">
      <div className="text-[48px]">⏳</div>
      <div className="font-num font-bold text-[18px] text-[#34322e]">가입 신청 완료!</div>
      <div className="text-[13.5px] text-[#7c7972] leading-relaxed">
        주최자 승인 후 로그인이 가능합니다.<br />
        승인이 완료되면 등록하신 아이디로 로그인해 주세요.
      </div>
      <div className="w-full bg-[#f6f4ef] rounded-xl px-4 py-3 text-[12.5px] text-[#7c7972] leading-relaxed text-left">
        <div className="font-semibold text-[#34322e] mb-1">승인 절차 안내</div>
        <div>1. 주최자가 상인 계정을 확인</div>
        <div>2. 승인 완료 후 로그인 가능</div>
        <div>3. 로그인 후 부스 등록 진행</div>
      </div>
      <Btn variant="primary" full onClick={() => setView('login')}>로그인 하러 가기</Btn>
    </div>
  )

  const currentForm = view === 'signup' ? SignupForm : view === 'pending' ? PendingView : LoginForm
  const title = view === 'signup' ? '상인 회원가입' : view === 'pending' ? '승인 대기 중' : '로그인'
  const subtitle = view === 'signup' ? '축제 입점 신청을 시작하세요' : view === 'pending' ? '' : '부스 관리를 시작하세요'

  return (
    <>
      {/* ── 모바일: 전체화면 폼 ── */}
      <div className="sm:hidden w-full h-full bg-white flex flex-col px-6 pt-12 pb-8 overflow-y-auto"
        style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mb-8">
          <div className="font-num font-bold text-[26px] tracking-tight text-[#34322e]">
            festival<span className="text-[#e08a45]">·</span>waiting
          </div>
          <div className="text-[14px] text-[#7c7972] mt-1">사장님 전용 콘솔</div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
            {currentForm}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 태블릿+: 좌우 분할 레이아웃 ── */}
      <div className="hidden sm:flex w-full h-full">
        <div className="w-[45%] bg-[#34322e] flex flex-col justify-between px-10 py-12">
          <div>
            <div className="font-num font-bold text-[28px] tracking-tight text-white">
              festival<span className="text-[#e08a45]">·</span>waiting
            </div>
            <div className="text-[14px] text-[#a9a59c] mt-1.5">사장님 전용 콘솔</div>
          </div>
          <div className="flex flex-col gap-5">
            {[
              { icon: '📋', title: '실시간 대기열 관리', desc: '호출·완료·노쇼를 한 화면에서' },
              { icon: '🔊', title: '고객 호출 알림', desc: 'SMS로 즉시 호출 문자 발송' },
              { icon: '📊', title: '대기 현황 통계', desc: '일별·시간별 대기 데이터 분석' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-[22px] mt-0.5">{icon}</span>
                <div>
                  <div className="text-white font-semibold text-[14px]">{title}</div>
                  <div className="text-[#7c7972] text-[12.5px] mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[11.5px] text-[#7c7972]">© 2026 festival·waiting</div>
        </div>

        <div className="flex-1 bg-[#faf8f4] flex flex-col justify-center px-12 py-12 overflow-y-auto">
          <div className="max-w-[360px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
                <div className="mb-8">
                  <div className="font-num font-bold text-[22px] text-[#34322e]">{title}</div>
                  {subtitle && <div className="text-[13px] text-[#7c7972] mt-1">{subtitle}</div>}
                </div>
                {currentForm}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  )
}
