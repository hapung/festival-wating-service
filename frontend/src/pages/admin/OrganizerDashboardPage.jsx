import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import client from '../../api/client'
import Btn from '../../components/common/Btn'
import FWInput from '../../components/common/FWInput'
import ScrollArea from '../../components/common/ScrollArea'

export default function OrganizerDashboardPage() {
  const [activeTab, setActiveTab] = useState('merchants') // 'merchants' | 'festival'
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // 축제 폼 상태
  const [festivalForm, setFestivalForm] = useState({ name: '', description: '', location: '', startDate: '', endDate: '' })
  const [festivalLoading, setFestivalLoading] = useState(false)
  const [festivalError, setFestivalError] = useState('')

  useEffect(() => {
    if (activeTab === 'merchants') {
      fetchPendingMerchants()
    }
  }, [activeTab])

  const fetchPendingMerchants = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.get('/api/organizer/merchants/pending')
      setMerchants(res.data)
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
      await client.post(`/api/organizer/merchants/${id}/approve`)
      setMerchants(prev => prev.filter(m => m.id !== id))
      alert('승인되었습니다.')
    } catch (err) {
      alert(err?.response?.data?.message || '승인에 실패했습니다.')
    }
  }

  const handleCreateFestival = async () => {
    const { name, description, location, startDate, endDate } = festivalForm
    if (!name || !description || !location || !startDate || !endDate) {
      setFestivalError('모든 항목을 입력해 주세요.')
      return
    }
    setFestivalError('')
    setFestivalLoading(true)
    try {
      await client.post('/api/organizer/festivals', festivalForm)
      alert('축제가 성공적으로 개최되었습니다!')
      setFestivalForm({ name: '', description: '', location: '', startDate: '', endDate: '' })
      setActiveTab('merchants')
    } catch (err) {
      setFestivalError(err?.response?.data?.message || '축제 개최에 실패했습니다.')
    } finally {
      setFestivalLoading(false)
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
      <div className="flex-none bg-white border-b border-[#e8e5de] px-5 sm:px-7 pt-4 pb-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-num font-bold text-[18px] text-[#34322e]">주최측 대시보드</div>
            <div className="text-[12.5px] text-[#7c7972] mt-0.5">축제 개최 및 입점 상인 관리</div>
          </div>
          <button onClick={handleLogout} className="text-[12.5px] font-semibold text-[#b56a2c] px-3 py-1.5 bg-[#fdf5ec] rounded-lg border border-[#ecd3b6]">
            로그아웃
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-4">
          <button 
            className={`pb-2.5 px-1 text-[14px] font-bold transition-colors border-b-2 ${activeTab === 'merchants' ? 'border-[#e08a45] text-[#34322e]' : 'border-transparent text-[#a9a59c] hover:text-[#7c7972]'}`}
            onClick={() => setActiveTab('merchants')}>
            입점 상인 관리
          </button>
          <button 
            className={`pb-2.5 px-1 text-[14px] font-bold transition-colors border-b-2 ${activeTab === 'festival' ? 'border-[#e08a45] text-[#34322e]' : 'border-transparent text-[#a9a59c] hover:text-[#7c7972]'}`}
            onClick={() => setActiveTab('festival')}>
            새 축제 개최하기
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0" innerClassName="px-5 sm:px-7 py-6 flex flex-col max-w-[680px]">
        <AnimatePresence mode="wait">
          {activeTab === 'merchants' ? (
            <motion.div key="merchants" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-4">
              {error && <div className="text-[12.5px] text-[#E5483B] bg-[#fbe4e1] rounded-xl py-3 px-4 mb-2">{error}</div>}
              <div className="flex items-center gap-2 mb-2">
                <div className="font-num font-bold text-[15px] text-[#34322e]">입점 대기 중인 상인</div>
                <div className="bg-[#e08a45] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{merchants.length}</div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#a9a59c]">
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <div className="text-[13px]">불러오는 중...</div>
                </div>
              ) : merchants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#a9a59c] bg-white rounded-2xl border border-[#e8e5de]">
                  <div className="text-[32px] mb-2">🌱</div>
                  <div className="text-[14px] font-semibold">승인 대기 중인 상인이 없습니다</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {merchants.map((m) => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl border border-[#e8e5de] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-num font-bold text-[15px] text-[#34322e]">{m.name}</span>
                          <span className="text-[11px] font-semibold text-[#b56a2c] bg-[#fdf5ec] px-2 py-0.5 rounded-md border border-[#ecd3b6]">아이디: {m.username}</span>
                        </div>
                        <div className="text-[13px] text-[#7c7972]">연락처: {m.phoneNumber}</div>
                      </div>
                      <button onClick={() => handleApprove(m.id)}
                        className="bg-[#34322e] text-white text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-[#1a1917] transition-colors whitespace-nowrap">
                        승인하기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="festival" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-5">
              <div>
                <div className="font-num font-bold text-[16px] text-[#34322e] mb-1">새로운 축제 개최</div>
                <div className="text-[13px] text-[#7c7972]">축제의 기본 정보를 입력하여 시스템에 등록하세요.</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#e8e5de] shadow-sm flex flex-col gap-4">
                <div>
                  <div className="text-[12px] text-[#7c7972] font-semibold mb-1.5">축제 이름</div>
                  <FWInput value={festivalForm.name} onChange={e => setFestivalForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 2026 강릉 단오제" />
                </div>
                <div>
                  <div className="text-[12px] text-[#7c7972] font-semibold mb-1.5">축제 개최 장소</div>
                  <FWInput value={festivalForm.location} onChange={e => setFestivalForm(f => ({ ...f, location: e.target.value }))} placeholder="예: 강원도 강릉시 단오장길 1" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-[12px] text-[#7c7972] font-semibold mb-1.5">시작일</div>
                    <FWInput type="date" value={festivalForm.startDate} onChange={e => setFestivalForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] text-[#7c7972] font-semibold mb-1.5">종료일</div>
                    <FWInput type="date" value={festivalForm.endDate} onChange={e => setFestivalForm(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-[#7c7972] font-semibold mb-1.5">상세 설명</div>
                  <textarea 
                    value={festivalForm.description} 
                    onChange={e => setFestivalForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full min-h-[100px] bg-[#faf8f4] border border-[#e8e5de] rounded-xl px-4 py-3 text-[14px] text-[#34322e] outline-none focus:border-[#b56a2c] focus:ring-1 focus:ring-[#b56a2c] transition-all resize-y"
                    placeholder="축제에 대한 자세한 설명을 적어주세요."
                  />
                </div>

                {festivalError && (
                  <div className="text-[12.5px] text-[#E5483B] bg-[#fbe4e1] rounded-xl py-3 px-4 mt-2">{festivalError}</div>
                )}
                
                <div className="pt-2">
                  <Btn variant="primary" full onClick={handleCreateFestival} disabled={festivalLoading}>
                    {festivalLoading ? '개최 중...' : '축제 시스템에 등록하기'}
                  </Btn>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  )
}
