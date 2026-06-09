import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import client from '../../api/client'

function getAdminSession() {
  try {
    const s = sessionStorage.getItem('admin_session') || localStorage.getItem('admin_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function OrganizerCard({ organizer, onApprove, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="bg-white rounded-2xl border border-[#e8e5de] shadow-sm overflow-hidden"
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* 아바타 + 정보 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#f8e9d8] border border-[#ecd3b6] flex items-center justify-center text-[20px] flex-none">
            🏛️
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-num font-bold text-[16px] text-[#34322e]">{organizer.name}</span>
              <span className="text-[11px] font-semibold text-[#7c7972] bg-[#f6f4ef] border border-[#e8e5de] px-2 py-0.5 rounded-md">
                @{organizer.username}
              </span>
            </div>
            <div className="text-[12.5px] text-[#a9a59c] mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>📞 {organizer.phoneNumber}</span>
              <span className="text-[#d8d4cc]">·</span>
              <span className="text-[11px] font-semibold text-[#b56a2c] bg-[#fdf5ec] border border-[#ecd3b6] px-1.5 py-0.5 rounded-md">
                ROLE_ORGANIZER
              </span>
            </div>
          </div>
        </div>

        {/* 승인 버튼 */}
        <button
          onClick={() => onApprove(organizer.id)}
          disabled={loading}
          className="flex-none flex items-center justify-center gap-1.5 h-[42px] px-5 rounded-xl
            bg-[#34322e] text-white text-[13.5px] font-num font-semibold
            hover:bg-[#1a1917] active:scale-[0.98] transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : '✓ 승인하기'}
        </button>
      </div>
    </motion.div>
  )
}

export default function SuperAdminDashboardPage() {
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchPending() }, [])

  const fetchPending = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.get('/api/admin/organizers/pending')
      setOrganizers(res.data)
    } catch (err) {
      if (err.isSessionExpired) {
        navigate('/admin/login?reason=session_expired', { replace: true })
      } else {
        setError('목록을 불러오지 못했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setApprovingId(id)
    try {
      await client.post(`/api/admin/organizers/${id}/approve`)
      setOrganizers(prev => prev.filter(o => o.id !== id))
      showToast('주최자 계정이 승인되었습니다.')
    } catch (err) {
      setError(err?.response?.data?.message || '승인에 실패했습니다.')
    } finally {
      setApprovingId(null)
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session')
    localStorage.removeItem('admin_session')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#faf8f4] font-[Gowun_Dodum,system-ui]">

      {/* 헤더 */}
      <div className="flex-none bg-white border-b border-[#e8e5de] px-5 sm:px-8 py-5 flex items-center justify-between">
        <div>
          <div className="font-num font-bold text-[11px] tracking-widest text-[#a9a59c] uppercase mb-1">
            festival·waiting
          </div>
          <div className="font-num font-bold text-[20px] text-[#34322e] leading-tight">
            최고 관리자 대시보드
          </div>
          <div className="text-[12.5px] text-[#7c7972] mt-0.5">
            주최측 계정 승인 및 시스템 관리
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex-none text-[12.5px] font-semibold text-[#E5483B] bg-[#fbe4e1] border border-[#f5bab5] px-3 py-1.5 rounded-lg hover:bg-[#f9d0cb] transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* 상태 바 */}
      <div className="flex-none bg-white border-b border-[#e8e5de] px-5 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#7c7972]">승인 대기 중인 주최자</span>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#e08a45] text-white text-[11px] font-num font-bold">
            {organizers.length}
          </span>
        </div>
        <button
          onClick={fetchPending}
          disabled={loading}
          className="text-[12px] text-[#b56a2c] font-semibold flex items-center gap-1 hover:underline disabled:opacity-40"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span> 새로고침
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5">
        <div className="max-w-[720px] flex flex-col gap-3">

          {error && (
            <div className="text-[12.5px] text-[#E5483B] bg-[#fbe4e1] rounded-xl py-3 px-4 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#a9a59c]">
              <div className="w-7 h-7 border-2 border-[#e08a45] border-t-transparent rounded-full animate-spin" />
              <div className="text-[13px]">목록을 불러오는 중...</div>
            </div>
          ) : organizers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#e8e5de] gap-3"
            >
              <div className="text-[40px]">✅</div>
              <div className="text-[15px] font-semibold text-[#34322e]">대기 중인 주최자가 없습니다</div>
              <div className="text-[12.5px] text-[#a9a59c]">모든 가입 신청이 처리되었습니다.</div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {organizers.map(o => (
                <OrganizerCard
                  key={o.id}
                  organizer={o}
                  onApprove={handleApprove}
                  loading={approvingId === o.id}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#34322e] text-white text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
