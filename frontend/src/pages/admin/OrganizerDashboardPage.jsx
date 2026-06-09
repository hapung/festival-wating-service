import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import client from '../../api/client'
import FWInput from '../../components/common/FWInput'
import Btn from '../../components/common/Btn'
import ScrollArea from '../../components/common/ScrollArea'

function getAdminSession() {
  try {
    const s = sessionStorage.getItem('admin_session') || localStorage.getItem('admin_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function MerchantCard({ merchant, onApprove, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="bg-white rounded-2xl border border-[#e8e5de] shadow-sm overflow-hidden"
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#f0faf0] border border-[#c3e6c3] flex items-center justify-center text-[20px] flex-none">
            🏪
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-num font-bold text-[16px] text-[#34322e]">{merchant.name}</span>
              <span className="text-[11px] font-semibold text-[#7c7972] bg-[#f6f4ef] border border-[#e8e5de] px-2 py-0.5 rounded-md">
                @{merchant.username}
              </span>
            </div>
            <div className="text-[12.5px] text-[#a9a59c] mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>📞 {merchant.phoneNumber}</span>
              <span className="text-[#d8d4cc]">·</span>
              <span className="text-[11px] font-semibold text-[#2f7a33] bg-[#e6f2e6] border border-[#4CAF50] px-1.5 py-0.5 rounded-md">
                ROLE_MERCHANT
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onApprove(merchant.id)}
          disabled={loading}
          className="flex-none flex items-center justify-center gap-1.5 h-[42px] px-5 rounded-xl
            bg-[#e08a45] text-white text-[13.5px] font-num font-semibold
            hover:bg-[#c97a3a] active:scale-[0.98] transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : '✓ 입점 승인'}
        </button>
      </div>
    </motion.div>
  )
}

function Label({ children, required }) {
  return (
    <div className="text-[12px] text-[#7c7972] font-num font-semibold mb-1.5 flex items-center gap-1">
      {children}
      {required && <span className="text-[#E5483B]">*</span>}
    </div>
  )
}

export default function OrganizerDashboardPage() {
  const [activeTab, setActiveTab] = useState('merchants')
  const navigate = useNavigate()

  // 상인 승인 상태
  const [merchants, setMerchants] = useState([])
  const [merchantsLoading, setMerchantsLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)
  const [merchantError, setMerchantError] = useState('')

  // 축제 등록 상태
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
  })
  const [festivalLoading, setFestivalLoading] = useState(false)
  const [festivalError, setFestivalError] = useState('')
  const [festivalSuccess, setFestivalSuccess] = useState(null)

  const [toast, setToast] = useState('')

  useEffect(() => {
    if (activeTab === 'merchants') fetchMerchants()
  }, [activeTab])

  const fetchMerchants = async () => {
    setMerchantsLoading(true)
    setMerchantError('')
    try {
      const res = await client.get('/api/organizer/merchants/pending')
      setMerchants(res.data)
    } catch (err) {
      if (err.isSessionExpired) {
        navigate('/admin/login?reason=session_expired', { replace: true })
      } else {
        setMerchantError('목록을 불러오지 못했습니다.')
      }
    } finally {
      setMerchantsLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setApprovingId(id)
    try {
      await client.post(`/api/organizer/merchants/${id}/approve`)
      setMerchants(prev => prev.filter(m => m.id !== id))
      showToast('상인 계정이 승인되었습니다.')
    } catch (err) {
      setMerchantError(err?.response?.data?.message || '승인에 실패했습니다.')
    } finally {
      setApprovingId(null)
    }
  }

  const updateForm = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleCreateFestival = async () => {
    const { name, description, location, startDate, endDate } = form
    if (!name.trim()) { setFestivalError('축제 이름을 입력해 주세요.'); return }
    if (!location.trim()) { setFestivalError('개최 장소를 입력해 주세요.'); return }
    if (!startDate) { setFestivalError('시작일을 선택해 주세요.'); return }
    if (!endDate) { setFestivalError('종료일을 선택해 주세요.'); return }
    if (endDate < startDate) { setFestivalError('종료일은 시작일 이후여야 합니다.'); return }
    if (!description.trim()) { setFestivalError('축제 설명을 입력해 주세요.'); return }

    setFestivalError('')
    setFestivalLoading(true)
    setFestivalSuccess(null)
    try {
      const res = await client.post('/api/organizer/festivals', form)
      setFestivalSuccess(res.data)
      setForm({ name: '', description: '', location: '', startDate: '', endDate: '' })
      showToast('축제가 성공적으로 등록되었습니다!')
    } catch (err) {
      if (err.isSessionExpired) {
        navigate('/admin/login?reason=session_expired', { replace: true })
      } else {
        setFestivalError(err?.response?.data?.message || '축제 등록에 실패했습니다.')
      }
    } finally {
      setFestivalLoading(false)
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

  const TABS = [
    { key: 'merchants', label: '입점 상인 승인', icon: '🏪' },
    { key: 'festival', label: '새 축제 개최', icon: '🎪' },
  ]

  return (
    <div className="flex flex-col w-full h-full bg-[#faf8f4] font-[Gowun_Dodum,system-ui]">

      {/* 헤더 */}
      <div className="flex-none bg-white border-b border-[#e8e5de] px-5 sm:px-8 py-5 flex items-center justify-between">
        <div>
          <div className="font-num font-bold text-[11px] tracking-widest text-[#a9a59c] uppercase mb-1">festival·waiting</div>
          <div className="font-num font-bold text-[20px] text-[#34322e] leading-tight">주최측 대시보드</div>
          <div className="text-[12.5px] text-[#7c7972] mt-0.5">축제 개최 및 입점 상인 관리</div>
        </div>
        <button
          onClick={handleLogout}
          className="flex-none text-[12.5px] font-semibold text-[#E5483B] bg-[#fbe4e1] border border-[#f5bab5] px-3 py-1.5 rounded-lg hover:bg-[#f9d0cb] transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="flex-none bg-white border-b border-[#e8e5de] px-5 sm:px-8 flex gap-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-3 text-[13.5px] font-num font-semibold border-b-2 transition-colors
              ${activeTab === tab.key
                ? 'border-[#e08a45] text-[#34322e]'
                : 'border-transparent text-[#a9a59c] hover:text-[#7c7972]'}`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.key === 'merchants' && merchants.length > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#e08a45] text-white text-[10px] font-bold">
                {merchants.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <ScrollArea className="flex-1 min-h-0" innerClassName="px-4 sm:px-8 py-5">
        <div className="max-w-[720px]">
          <AnimatePresence mode="wait">

            {/* 탭 1: 상인 승인 */}
            {activeTab === 'merchants' && (
              <motion.div
                key="merchants"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[13px] text-[#7c7972]">
                    승인 시 상인 계정이 활성화되어 부스 등록이 가능해집니다.
                  </div>
                  <button
                    onClick={fetchMerchants}
                    disabled={merchantsLoading}
                    className="text-[12px] text-[#b56a2c] font-semibold flex items-center gap-1 hover:underline disabled:opacity-40"
                  >
                    <span className={merchantsLoading ? 'animate-spin inline-block' : ''}>↻</span>
                  </button>
                </div>

                {merchantError && (
                  <div className="text-[12.5px] text-[#E5483B] bg-[#fbe4e1] rounded-xl py-3 px-4">
                    ⚠️ {merchantError}
                  </div>
                )}

                {merchantsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#a9a59c]">
                    <div className="w-7 h-7 border-2 border-[#e08a45] border-t-transparent rounded-full animate-spin" />
                    <div className="text-[13px]">목록을 불러오는 중...</div>
                  </div>
                ) : merchants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#e8e5de] gap-3">
                    <div className="text-[40px]">🌱</div>
                    <div className="text-[15px] font-semibold text-[#34322e]">승인 대기 중인 상인이 없습니다</div>
                    <div className="text-[12.5px] text-[#a9a59c]">새로운 상인이 가입하면 여기에 표시됩니다.</div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {merchants.map(m => (
                      <MerchantCard
                        key={m.id}
                        merchant={m}
                        onApprove={handleApprove}
                        loading={approvingId === m.id}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>
            )}

            {/* 탭 2: 축제 등록 */}
            {activeTab === 'festival' && (
              <motion.div
                key="festival"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-5"
              >

                {/* 등록 성공 결과 카드 */}
                <AnimatePresence>
                  {festivalSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-[#e6f2e6] border border-[#4CAF50] rounded-2xl p-4 flex flex-col gap-1.5"
                    >
                      <div className="text-[13px] font-num font-bold text-[#2f7a33] flex items-center gap-1.5">
                        ✅ 축제 등록 완료
                      </div>
                      <div className="text-[12.5px] text-[#2f7a33] flex flex-col gap-0.5">
                        <span>· 축제 ID: <strong>{festivalSuccess.festivalId}</strong></span>
                        <span>· 이름: {festivalSuccess.name}</span>
                        <span>· 장소: {festivalSuccess.location}</span>
                        <span>· 기간: {festivalSuccess.startDate} ~ {festivalSuccess.endDate}</span>
                      </div>
                      <button
                        onClick={() => setFestivalSuccess(null)}
                        className="self-start text-[11.5px] text-[#2f7a33] underline mt-1"
                      >
                        닫기
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="bg-white rounded-2xl border border-[#e8e5de] shadow-sm p-5 flex flex-col gap-4">

                  {/* 축제 이름 */}
                  <div>
                    <Label required>축제 이름 <span className="text-[10px] font-normal text-[#a9a59c] ml-1">name</span></Label>
                    <FWInput
                      value={form.name}
                      onChange={e => updateForm('name', e.target.value)}
                      placeholder="예: 2026 강릉 단오제"
                    />
                  </div>

                  {/* 개최 장소 */}
                  <div>
                    <Label required>개최 장소 <span className="text-[10px] font-normal text-[#a9a59c] ml-1">location</span></Label>
                    <FWInput
                      value={form.location}
                      onChange={e => updateForm('location', e.target.value)}
                      placeholder="예: 강원도 강릉시 단오장길 1"
                    />
                  </div>

                  {/* 기간 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label required>시작일 <span className="text-[10px] font-normal text-[#a9a59c] ml-1">startDate</span></Label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={e => updateForm('startDate', e.target.value)}
                        className="w-full h-[48px] border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 text-[14px] text-[#34322e] outline-none focus:border-[#e08a45] bg-white"
                      />
                    </div>
                    <div>
                      <Label required>종료일 <span className="text-[10px] font-normal text-[#a9a59c] ml-1">endDate</span></Label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={e => updateForm('endDate', e.target.value)}
                        className="w-full h-[48px] border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 text-[14px] text-[#34322e] outline-none focus:border-[#e08a45] bg-white"
                      />
                    </div>
                  </div>

                  {/* 설명 */}
                  <div>
                    <Label required>축제 설명 <span className="text-[10px] font-normal text-[#a9a59c] ml-1">description</span></Label>
                    <textarea
                      value={form.description}
                      onChange={e => updateForm('description', e.target.value)}
                      placeholder="축제에 대한 자세한 설명을 입력해 주세요."
                      rows={4}
                      className="w-full border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 py-3 text-[14px] text-[#34322e] outline-none focus:border-[#e08a45] bg-white placeholder:text-[#a9a59c] resize-none leading-relaxed"
                    />
                  </div>

{festivalError && (
                    <div className="text-[12.5px] text-[#E5483B] bg-[#fbe4e1] rounded-xl py-3 px-4">
                      ⚠️ {festivalError}
                    </div>
                  )}

                  <Btn variant="primary" full onClick={handleCreateFestival} disabled={festivalLoading}>
                    {festivalLoading ? '등록 중...' : '🎪 축제 시스템에 등록하기'}
                  </Btn>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 24, left: '50vw', transform: 'translateX(-50%)' }}
            className="bg-white border border-[#4CAF50] text-[#2f7a33] text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-lg z-[9999] flex items-center gap-2 whitespace-nowrap"
          >
            <span>✅</span> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
