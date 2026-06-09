import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout from './AdminLayout'
import Btn from '../../components/common/Btn'
import ScrollArea from '../../components/common/ScrollArea'
import { useFestivals, useBoothDetail, uploadImage } from '../../api/queries'
import client, { getImageUrl } from '../../api/client'

function getAdminSession() {
  try {
    const s = sessionStorage.getItem('admin_session') || localStorage.getItem('admin_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function saveAdminSession(updates) {
  const session = getAdminSession() || {}
  const updated = { ...session, ...updates }
  const storage = sessionStorage.getItem('admin_session') ? sessionStorage : localStorage
  storage.setItem('admin_session', JSON.stringify(updated))
}

function Label({ children }) {
  return <div className="text-[11.5px] text-[#7c7972] font-num font-semibold mb-1.5 tracking-wide">{children}</div>
}

function TextInput({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-[42px] border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 text-[14px] text-[#34322e] outline-none focus:border-[#e08a45] bg-white placeholder:text-[#c4c0b8] ${className}`}
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 py-3 text-[14px] text-[#34322e] outline-none focus:border-[#e08a45] resize-none bg-white placeholder:text-[#c4c0b8] leading-relaxed"
    />
  )
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="relative w-10 h-[22px] rounded-full flex-none transition-colors duration-200 focus:outline-none"
      style={{ background: on ? '#e08a45' : '#d8d4cc' }}
    >
      <div
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? 20 : 4 }}
      />
    </button>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="font-num font-bold text-[14px] text-[#34322e]">{children}</div>
      <div className="flex-1 h-px bg-[#e8e5de]" />
    </div>
  )
}

// 이미지 업로드 컴포넌트 — 파일 선택 시 서버에 즉시 업로드 후 URL 반환
function ImageUpload({ value, onChange, size = 'lg', label }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState(null)

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => setLocalPreview(ev.target.result)
    reader.readAsDataURL(file)
    setUploading(true)
    try {
      const serverUrl = await uploadImage(file)
      onChange(serverUrl)
    } catch {
      // 업로드 실패해도 localPreview 유지
    } finally {
      setUploading(false)
    }
  }

  const handleFile = (e) => {
    processFile(e.target.files?.[0])
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    processFile(e.dataTransfer.files?.[0])
  }

  const displaySrc = localPreview || value

  if (size === 'lg') return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      className="relative w-full h-[160px] rounded-xl border-[1.5px] border-dashed border-[#d8d4cc] bg-[#faf8f4] overflow-hidden cursor-pointer hover:border-[#e08a45] hover:bg-[#fdf5ec] transition-all group"
    >
      {displaySrc ? (
        <>
          <img src={displaySrc} alt="" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-[11px] font-semibold">업로드 중...</span>
            </div>
          )}
          {!uploading && (
            <>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-[13px] font-semibold bg-black/50 px-3 py-1.5 rounded-lg transition-all">사진 변경</span>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); onChange(''); setLocalPreview(null) }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-[13px] flex items-center justify-center hover:bg-black/70">×</button>
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-1.5 text-[#a9a59c] group-hover:text-[#b56a2c] transition-colors">
          <div className="text-[28px]">🖼️</div>
          <div className="text-[12.5px] font-semibold">{label || '사진 추가'}</div>
          <div className="text-[11px]">클릭하거나 드래그해서 업로드</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )

  return (
    <div onClick={() => !uploading && inputRef.current?.click()}
      className="relative w-[42px] h-[42px] rounded-xl border-[1.5px] border-dashed border-[#d8d4cc] bg-[#faf8f4] overflow-hidden cursor-pointer hover:border-[#e08a45] flex-none transition-all group">
      {displaySrc ? (
        <>
          <img src={displaySrc} alt="" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!uploading && (
            <button type="button" onClick={e => { e.stopPropagation(); onChange(''); setLocalPreview(null) }}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center">×</button>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-[#c4c0b8] group-hover:text-[#e08a45] transition-colors text-[20px]">+</div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── 부스 정보 조회 뷰 ────────────────────────────────────────────
function BoothView({ booth, qrCodeUrl, onEdit }) {

  return (
    <ScrollArea className="flex-1 min-h-0" innerClassName="max-w-[680px] mx-auto w-full">
      <div className="px-4 sm:px-6 py-5 pb-8 flex flex-col gap-4">

      {/* 부스 히어로 카드 */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="rounded-3xl overflow-hidden bg-white"
        style={{ boxShadow: '0 2px 0 rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.07)' }}>
        {/* 이미지 or 플레이스홀더 */}
        <div className="relative w-full h-[140px] bg-[#efece6] flex-none">
          {booth.imageUrl ? (
            <img src={getImageUrl(booth.imageUrl)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[48px] opacity-20">🏮</div>
          )}
          {/* 운영 상태 배지 */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[#4CAF50]/30"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
            <span className="text-[11px] font-num font-bold text-[#2f7a33]">운영 중</span>
          </div>
        </div>
        {/* 부스 정보 */}
        <div className="px-4 pt-3.5 pb-4 flex flex-col gap-1.5">
          <div className="font-num font-bold text-[18px] text-[#34322e] leading-snug">{booth.name}</div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-[#7c7972]">
            <span>📍</span><span>{booth.locationDescription}</span>
          </div>
          {booth.description && (
            <div className="mt-1.5 pt-2.5 border-t border-[#f0ede8] text-[13px] text-[#7c7972] leading-[1.6]">{booth.description}</div>
          )}
        </div>
      </motion.div>


      {/* 메뉴판 */}
      {booth.products?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-3 px-0.5">
            <span className="font-num font-bold text-[13.5px] text-[#34322e]">메뉴판</span>
            <span className="text-[11.5px] font-num font-semibold text-[#e08a45] bg-[#f8e9d8] px-2 py-0.5 rounded-full">{booth.products.length}개</span>
            <div className="flex-1 h-px bg-[#ece9e3]" />
          </div>
          <div className="flex flex-col gap-2.5">
            {booth.products.map((p, idx) => (
              <div key={p.productId ?? p.id ?? idx}
                className="flex gap-3.5 px-4 py-3.5 rounded-2xl bg-white"
                style={{
                  border: p.isSpecialty ? '1px solid #ecd3b6' : '1px solid #ece9e3',
                  background: p.isSpecialty ? 'linear-gradient(135deg, #fdf5ec, #fff)' : '#fff',
                  boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 3px 10px rgba(0,0,0,0.04)',
                }}>
                {p.imageUrl ? (
                  <img src={getImageUrl(p.imageUrl)} alt="" className="w-14 h-14 rounded-2xl object-cover flex-none" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#efece6] border border-[#e8e5de] flex items-center justify-center text-[22px] flex-none">🍽️</div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-num font-bold text-[14.5px] text-[#34322e]">{p.name}</span>
                    {p.isSpecialty && (
                      <span className="inline-flex items-center gap-0.5 h-[18px] px-2 rounded-full bg-[#f8e9d8] border border-[#e08a45]/50 text-[#b56a2c] text-[9.5px] font-num font-bold">🌾 특산물</span>
                    )}
                  </div>
                  {p.description && <div className="text-[12px] text-[#a9a59c] leading-[1.4]">{p.description}</div>}
                </div>
                <div className="flex-none self-center text-right">
                  <div className="font-num font-bold text-[15px] text-[#b56a2c]">{p.price?.toLocaleString()}</div>
                  <div className="text-[10.5px] text-[#a9a59c]">원</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 수정하기 버튼 */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.14 }}
        className="flex justify-end pb-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-[14px] font-num font-semibold transition-all active:scale-95"
          style={{ background: '#e08a45', boxShadow: '0 3px 0 #b56a2c' }}
        >
          ✏️ 수정하기
        </button>
      </motion.div>
      </div>
    </ScrollArea>
  )
}

// ── 부스 등록/수정 폼 뷰 ─────────────────────────────────────────
function BoothForm({ initialData, isCreate, festivals, onSave, onCancel }) {
  const [festivalId, setFestivalId] = useState(initialData?.festivalId ? String(initialData.festivalId) : '')
  const [boothName, setBoothName]   = useState(initialData?.name || '')
  const [loc, setLoc]               = useState(initialData?.locationDescription || '')
  const [desc, setDesc]             = useState(initialData?.description || '')
  const [boothImage, setBoothImage] = useState(initialData?.imageUrl || '')
  const [menus, setMenus]           = useState(
    initialData?.products?.map((p, idx) => ({
      _id: p.productId ?? p.id ?? idx,
      name: p.name || '',
      price: String(p.price || ''),
      desc: p.description || '',
      special: p.isSpecialty || false,
      image: p.imageUrl || '',
    })) || []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const updateMenu = (i, key, val) => setMenus(ms => ms.map((m, idx) => idx === i ? { ...m, [key]: val } : m))
  const addMenu    = () => setMenus(ms => [...ms, { _id: Date.now(), name: '', price: '', desc: '', special: false, image: '' }])
  const removeMenu = (i) => setMenus(ms => ms.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    console.log("--- handleSubmit Clicked ---")
    if (!boothName.trim()) { 
      console.warn("Validation failed: boothName is empty")
      setError('부스명을 입력해 주세요.') 
      return
    }
    if (isCreate && !festivalId) { 
      console.warn("Validation failed: festivalId is empty")
      setError('축제를 선택해 주세요.') 
      return
    }
    if (!loc.trim()) {
      console.warn("Validation failed: loc is empty")
      setError('부스 위치를 입력해 주세요.')
      return
    }
    setError(''); setLoading(true)

    const payload = {
      festivalId: isCreate ? Number(festivalId) : (initialData?.festivalId || 1),
      name: boothName,
      description: desc,
      locationDescription: loc,
      imageUrl: boothImage || null,
      products: menus.map(m => ({
        name: m.name,
        price: Number(m.price) || 0,
        description: m.desc,
        isSpecialty: m.special,
        imageUrl: m.image || null,
      })),
    }
    console.log("Payload prepared:", payload)

    try {
      let data
      if (!isCreate && initialData?.boothId) {
        // PUT 시도 → 없으면 POST fallback
        try {
          const res = await client.put(`/api/booths/${initialData.boothId}`, payload)
          data = res.data
        } catch (putErr) {
          if (putErr?.response?.status === 405 || putErr?.response?.status === 404) {
            const res = await client.post('/api/booths', payload)
            data = res.data
          } else {
            throw putErr
          }
        }
      } else {
        const res = await client.post('/api/booths', payload)
        data = res.data
      }
      const boothId = data.boothId ?? data.id
      saveAdminSession({ boothId, boothName: data.name })
      const session = getAdminSession()
      if (session?.username) localStorage.setItem(`booth_${session.username}`, boothId)
      onSave(data)
    } catch (err) {
      console.error("Error in handleSubmit:", err)
      const status = err?.response?.status
      if (err.isSessionExpired || status === 401) {
        setError('SESSION_EXPIRED')
      } else if (status === 403) {
        setError('해당 작업을 수행할 권한이 없습니다. (상인 계정으로 로그인했는지 확인해주세요.)')
      } else {
        const errorData = err?.response?.data
        const errorMsg = typeof errorData === 'string' ? errorData : errorData?.message
        setError(errorMsg || '서버 연결에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollArea className="flex-1 min-h-0" innerClassName="max-w-[680px] mx-auto w-full">
      <div className="px-5 sm:px-7 py-5 flex flex-col gap-6 pb-12">

      {/* 기본 정보 */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <SectionTitle>기본 정보</SectionTitle>
        <div className="flex flex-col gap-3.5">
          {isCreate && (
            <div>
              <Label>참여 축제</Label>
              <select value={festivalId} onChange={e => setFestivalId(e.target.value)}
                className="w-full h-[42px] border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 text-[14px] text-[#34322e] outline-none focus:border-[#e08a45] bg-white appearance-none">
                <option value="">축제를 선택해 주세요</option>
                {festivals.map(f => <option key={f.festivalId} value={f.festivalId}>{f.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>부스명</Label><TextInput value={boothName} onChange={setBoothName} placeholder="예: 할매 손칼국수" /></div>
            <div><Label>위치 설명</Label><TextInput value={loc} onChange={setLoc} placeholder="예: A구역 12번" /></div>
          </div>
          <div><Label>소개글</Label><TextArea value={desc} onChange={setDesc} placeholder="부스를 간단히 소개해 주세요." /></div>
          <div><Label>부스 대표 사진</Label><ImageUpload value={boothImage} onChange={setBoothImage} label="부스 사진 추가" /></div>
        </div>
      </motion.div>

      {/* 메뉴 */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="font-num font-bold text-[14px] text-[#34322e]">메뉴</div>
            <motion.span key={menus.length} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: 'backOut' }}
              className="text-[12px] font-num font-semibold text-[#e08a45] bg-[#f8e9d8] px-2 py-0.5 rounded-full inline-block">
              {menus.length}개
            </motion.span>
          </div>
          <div className="flex-1 h-px bg-[#e8e5de] mx-3" />
        </div>

        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {menus.map((m, i) => (
              <motion.div key={m._id ?? i}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                className="rounded-xl border-[1.5px] border-[#e8e5de] bg-white p-4 flex flex-col gap-3 overflow-hidden">
                <div className="flex gap-3 items-start">
                  <div className="flex-none"><Label>사진</Label><ImageUpload size="sm" value={m.image || ''} onChange={v => updateMenu(i, 'image', v)} /></div>
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>메뉴명</Label><TextInput value={m.name} onChange={v => updateMenu(i, 'name', v)} placeholder="메뉴 이름" /></div>
                      <div><Label>가격 (원)</Label><TextInput value={m.price} onChange={v => updateMenu(i, 'price', v.replace(/\D/g, ''))} placeholder="0" /></div>
                    </div>
                  </div>
                </div>
                <div><Label>설명</Label><TextInput value={m.desc} onChange={v => updateMenu(i, 'desc', v)} placeholder="메뉴 설명 (선택)" /></div>
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2.5">
                    <Toggle on={m.special} onChange={v => updateMenu(i, 'special', v)} />
                    <span className="text-[13px] text-[#7c7972]">
                      {m.special ? <span className="text-[#b56a2c] font-semibold">특산품으로 표시</span> : '특산품으로 표시'}
                    </span>
                  </div>
                  <button onClick={() => removeMenu(i)}
                    className="text-[12px] text-[#a9a59c] hover:text-[#E5483B] transition-colors px-2 py-1 rounded-lg hover:bg-[#fbe4e1]">
                    삭제
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.97 }} onClick={addMenu}
            className="border-[1.5px] border-dashed border-[#d8d4cc] rounded-xl h-[48px] text-[#a9a59c] text-[13.5px] flex items-center justify-center gap-1.5 hover:border-[#e08a45] hover:text-[#b56a2c] hover:bg-[#fdf5ec] transition-all">
            <span className="text-[16px] leading-none">+</span> 메뉴 추가
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl py-3 px-4 text-center">
            {error === 'SESSION_EXPIRED' ? (
              <div className="bg-[#fdf5ec] border border-[#ecd3b6] rounded-xl py-3 px-4 flex flex-col items-center gap-2">
                <div className="text-[13px] font-semibold text-[#b56a2c]">🔄 세션이 만료되었습니다</div>
                <div className="text-[12px] text-[#7c7972]">서버가 재시작되어 로그인이 필요합니다.</div>
                <button
                  onClick={() => { window.location.href = '/admin/login?reason=session_expired' }}
                  className="mt-1 text-[12.5px] font-num font-semibold text-white bg-[#e08a45] px-4 py-1.5 rounded-lg hover:bg-[#c97a3a] transition-colors"
                >
                  다시 로그인하기
                </button>
              </div>
            ) : (
              <div className="text-[12.5px] text-[#E5483B] bg-[#fbe4e1] rounded-xl py-2.5 px-4">
                {error}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.18 }}
        className="flex gap-2.5 pb-2">
        {!isCreate && (
          <Btn variant="secondary" full onClick={onCancel} disabled={loading}>취소</Btn>
        )}
        <Btn variant="primary" full onClick={handleSubmit} disabled={loading}>
          {loading ? (isCreate ? '등록 중...' : '저장 중...') : (isCreate ? '부스 등록하기' : '완료')}
        </Btn>
      </motion.div>
      </div>
    </ScrollArea>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────
export default function AdminRegisterPage() {
  const session         = getAdminSession()
  const existingBoothId = session?.boothId || null

  const { data: festivals = [] } = useFestivals()
  const { data: boothData, isLoading: isBoothLoading, isError: isBoothError } = useBoothDetail(existingBoothId)

  const [editing, setEditing]       = useState(false)
  const [savedBooth, setSavedBooth] = useState(null)
  const [qrCodeUrl, setQrCodeUrl]   = useState('')

  useEffect(() => {
    if (boothData?.qrCodeUrl) setQrCodeUrl(boothData.qrCodeUrl)
    // 부스 데이터 로드 성공 시 username 키로 localStorage에 저장 (재로그인 시 복원용)
    if (boothData) {
      const boothId = boothData.boothId ?? boothData.id
      const s = getAdminSession()
      if (s?.username && boothId) localStorage.setItem(`booth_${s.username}`, boothId)
    }
  }, [boothData])

  const displayBooth = savedBooth || boothData

  // 실제 부스 존재 여부: API 응답이 성공적으로 왔을 때만 true
  // - 세션에 boothId가 남아있어도 API 실패/404면 create 모드로 처리
  const hasBooth     = !!displayBooth
  const showLoading  = existingBoothId && isBoothLoading && !displayBooth
  const showCreate   = !showLoading && !hasBooth
  const showView     = hasBooth && !editing
  const showEdit     = hasBooth && editing

  const handleSave = (data) => {
    setSavedBooth(data)
    setQrCodeUrl(data.qrCodeUrl || '')
    setEditing(false)
  }

  return (
    <AdminLayout>
      {/* 헤더 */}
      <div className="flex-none px-5 sm:px-7 pt-5 pb-4 bg-white flex items-center justify-between rounded-b-3xl z-10 relative" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <div>
          <div className="font-num font-bold text-[17px] text-[#34322e]">
            {showCreate ? '부스 등록' : showEdit ? '부스 수정' : '내 부스'}
          </div>
          <div className="text-[12px] text-[#a9a59c] mt-0.5">
            {showCreate && '방문객에게 보여질 부스 정보와 메뉴를 입력해 주세요.'}
            {showEdit   && '정보를 수정하고 완료 버튼을 눌러주세요.'}
            {showView   && `부스 #${displayBooth?.boothId ?? displayBooth?.id} · 운영 중`}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <AnimatePresence mode="wait">

        {showLoading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center text-[14px] text-[#7c7972]">
            부스 정보를 불러오는 중...
          </motion.div>
        )}

        {showCreate && (
          <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <BoothForm isCreate festivals={festivals} onSave={handleSave} onCancel={null} />
          </motion.div>
        )}

        {showView && (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <BoothView booth={displayBooth} qrCodeUrl={qrCodeUrl} onEdit={() => setEditing(true)} />
          </motion.div>
        )}

        {showEdit && (
          <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <BoothForm initialData={displayBooth} isCreate={false} festivals={festivals}
              onSave={handleSave} onCancel={() => setEditing(false)} />
          </motion.div>
        )}

      </AnimatePresence>
    </AdminLayout>
  )
}
