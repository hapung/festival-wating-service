import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import client from '../../api/client'
import ScrollArea from '../../components/common/ScrollArea'

export default function SuperAdminDashboardPage() {
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchPendingOrganizers()
  }, [])

  const fetchPendingOrganizers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.get('/api/admin/organizers/pending')
      setOrganizers(res.data)
    } catch (err) {
      if (err.isSessionExpired) {
        navigate('/admin/login?reason=session_expired', { replace: true })
      } else {
        setError(err?.response?.data?.message || '목록을 불러오는 데 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await client.post(`/api/admin/organizers/${id}/approve`)
      setOrganizers(prev => prev.filter(o => o.id !== id))
      alert('주최자 계정이 승인되었습니다.')
    } catch (err) {
      alert(err?.response?.data?.message || '승인에 실패했습니다.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session')
    localStorage.removeItem('admin_session')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#faf8f4]">
      {/* Header */}
      <div className="flex-none bg-[#34322e] px-5 sm:px-7 py-4 flex items-center justify-between">
        <div>
          <div className="font-num font-bold text-[18px] text-white">최고 관리자 대시보드</div>
          <div className="text-[12.5px] text-[#a9a59c] mt-0.5">시스템 운영 및 주최측 계정 관리</div>
        </div>
        <button onClick={handleLogout} className="text-[12.5px] font-semibold text-[#34322e] px-3 py-1.5 bg-white rounded-lg hover:bg-[#efece6] transition-colors">
          로그아웃
        </button>
      </div>

      <ScrollArea className="flex-1 min-h-0" innerClassName="px-5 sm:px-7 py-6 flex flex-col gap-4 max-w-[680px]">
        {error && (
          <div className="text-[12.5px] text-[#E5483B] bg-[#fbe4e1] rounded-xl py-3 px-4 mb-2">{error}</div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <div className="font-num font-bold text-[15px] text-[#34322e]">가입 승인 대기 중인 주최자</div>
          <div className="bg-[#e08a45] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{organizers.length}</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#a9a59c]">
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <div className="text-[13px]">불러오는 중...</div>
          </div>
        ) : organizers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#a9a59c] bg-white rounded-2xl border border-[#e8e5de]">
            <div className="text-[32px] mb-2">🎉</div>
            <div className="text-[14px] font-semibold">대기 중인 주최자 계정이 없습니다</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {organizers.map((o) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-2xl border border-[#e8e5de] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-[#ecd3b6] transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-num font-bold text-[15px] text-[#34322e]">{o.name}</span>
                    <span className="text-[11px] font-semibold text-[#4CAF50] bg-[#e6f2e6] px-2 py-0.5 rounded-md border border-[#c8e6c9]">주최측</span>
                  </div>
                  <div className="text-[13px] text-[#7c7972] flex gap-3">
                    <span>ID: <span className="font-semibold text-[#34322e]">{o.username}</span></span>
                    <span>연락처: <span className="font-num">{o.phoneNumber}</span></span>
                  </div>
                </div>
                <button onClick={() => handleApprove(o.id)}
                  className="bg-[#e08a45] text-white text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-[#b56a2c] transition-colors whitespace-nowrap">
                  승인하기
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
