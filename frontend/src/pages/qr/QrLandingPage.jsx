import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import AppBar from '../../components/common/AppBar'
import { useBoothDetail } from '../../api/queries'
import ScrollArea from '../../components/common/ScrollArea'
import { getImageUrl } from '../../api/client'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const guestClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// OTP 입력 컴포넌트
function OtpInput({ onComplete }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(180)
  const refs = useRef([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timer])

  const mm = String(Math.floor(timer / 60)).padStart(2, '0')
  const ss = String(timer % 60).padStart(2, '0')

  const handleChange = (i, val) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) {
      const next = [...otp]; next[i] = ''; setOtp(next); return
    }
    if (digits.length > 1) {
      const next = [...otp]
      for (let j = 0; j < digits.length && i + j < 6; j++) next[i + j] = digits[j]
      setOtp(next)
      const focusIdx = Math.min(i + digits.length, 5)
      refs.current[focusIdx]?.focus()
      const filled = next.filter(Boolean)
      if (filled.length === 6) onComplete(next.join(''))
      return
    }
    const next = [...otp]; next[i] = digits; setOtp(next)
    if (i < 5) refs.current[i + 1]?.focus()
    if (next.filter(Boolean).length === 6) onComplete(next.join(''))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const next = [...otp]; next[i - 1] = ''; setOtp(next)
      refs.current[i - 1]?.focus()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-[13px] text-[#7c7972] text-center">6자리 인증번호 를 입력해 주세요</div>
      <div className="flex gap-2 justify-center">
        {otp.map((v, i) => {
          const isCurrent = v === '' && otp.slice(0, i).every(Boolean)
          return (
            <input
              key={i}
              ref={el => (refs.current[i] = el)}
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={v}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onFocus={e => e.target.select()}
              className="w-[44px] h-[54px] rounded-xl font-num font-bold text-[22px] text-center outline-none transition-colors"
              style={{
                border: `2px solid ${isCurrent ? '#e08a45' : v ? '#34322e' : '#d8d4cc'}`,
                background: isCurrent ? '#f8e9d8' : '#fff',
              }}
            />
          )
        })}
      </div>
      <div className="text-center text-[13px] text-[#7c7972]">
        <span className="font-num font-bold text-[#E5483B]">{mm}:{ss}</span> 후 재발송 가능
        <button onClick={() => setTimer(180)} className="ml-2 text-[#b56a2c] underline text-[12px]">재발송</button>
      </div>
    </div>
  )
}

export default function QrLandingPage() {
  const { boothId } = useParams()
  const navigate = useNavigate()
  const parsedBoothId = parseInt(boothId)

  const [step, setStep] = useState('phone') // 'phone' | 'otp' | 'confirmed' | 'pending'
  const [phone, setPhone] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: booth, isLoading, error } = useBoothDetail(parsedBoothId)

  const stored = localStorage.getItem(`waiting_booth_${boothId}`)
  const existingWaiting = stored ? JSON.parse(stored) : null

  const phoneClean = phone.replace(/-/g, '')

  const handleSendOtp = () => {
    if (!phone || !agreed) return
    setErrorMsg('')
    setStep('otp')
  }

  const [customerToken, setCustomerToken] = useState(null)

  const handleOtpComplete = useCallback(async (_otpValue) => {
    setStep('pending')
    setErrorMsg('')
    try {
      const res = await guestClient.post('/api/auth/customer-token', {
        phoneNumber: phoneClean,
        festivalId: booth.festivalId,
      })
      setCustomerToken(res.data.token)
      setStep('confirmed')
    } catch (e) {
      setErrorMsg('인증에 실패했습니다. 다시 시도해주세요.')
      setStep('phone')
    }
  }, [phoneClean, booth])

  const handleRegister = async () => {
    if (!customerToken) return
    setStep('pending')
    try {
      const res2 = await guestClient.post(
        `/api/booths/${parsedBoothId}/waitings`,
        {},
        { headers: { Authorization: `Bearer ${customerToken}` } }
      )
      const data = res2.data
      localStorage.setItem(`waiting_booth_${boothId}`, JSON.stringify({ waitingId: data.waitingId, waitingNumber: data.waitingNumber }))
      localStorage.setItem('customer_token', customerToken)
      localStorage.setItem('customer_festival_id', String(booth.festivalId))
      navigate(`/track/${data.waitingId}`)
    } catch (e) {
      const status = e?.response?.status
      if (status === 400) {
        setErrorMsg('이미 대기 중이거나 잘못된 요청입니다.')
      } else {
        setErrorMsg('접수 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      setStep('confirmed')
    }
  }

  if (isLoading) return (
    <div className="flex flex-col h-full bg-[#faf8f4] items-center justify-center">
      <div className="text-[14px] text-[#7c7972]">부스 정보를 불러오는 중...</div>
    </div>
  )

  if (error || !booth) return (
    <div className="flex flex-col h-full bg-[#faf8f4] items-center justify-center px-6 text-center">
      <div className="text-[36px] mb-2">🏮</div>
      <div className="text-[15px] font-bold text-[#34322e] mb-1">부스를 찾을 수 없습니다</div>
      <div className="text-[12.5px] text-[#7c7972] mb-4">유효하지 않은 QR 코 드입니다.</div>
      <button onClick={() => navigate('/home')} className="px-6 py-3 bg-[#e08a45] text-white rounded-xl font-semibold text-[15px]">홈으로 가기</button>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#faf8f4]">
      <AppBar back={step === 'otp' ? () => setStep('phone') : step === 'confirmed' ? () => setStep('otp') : true} title="대기 접수" />

      <ScrollArea className="flex-1 min-h-0" innerClassName="px-4 pt-4 pb-10 flex flex-col gap-4">

        {/* 부스 정보 */}
        <div className="bg-white rounded-2xl border border-[#e8e5de] p-4"
          style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3">
            {booth.imageUrl ? (
              <img src={getImageUrl(booth.imageUrl)} alt={booth.name} className="w-12 h-12 rounded-xl object-cover flex-none" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#efece6] border border-[#e8e5de] flex items-center justify-center text-2xl flex-none">🏮</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[17px] text-[#34322e]">{booth.name}</div>
              <div className="text-[12px] text-[#7c7972] mt-0.5">📍 {booth.locationDescription}</div>
            </div>
          </div>
          {booth.description && (
            <div className="mt-3 pt-3 border-t border-[#e8e5de] text-[13px] text-[#7c7972] leading-[1.5]">{booth.description}</div>
          )}
        </div>

        {/* 대기 현황 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-[#e8e5de] px-4 py-3.5"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="text-[11.5px] text-[#7c7972] font-semibold">현재 대기</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-num font-bold text-[32px] leading-none text-[#b56a2c]">{booth.currentWaitingCount}</span>
              <span className="text-[13px] text-[#7c7972]">팀</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e8e5de] px-4 py-3.5"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="text-[11.5px] text-[#7c7972] font-semibold">예상 대기</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-num font-bold text-[32px] leading-none text-[#34322e]">{booth.currentWaitingCount * 5}</span>
              <span className="text-[13px] text-[#7c7972]">분</span>
            </div>
          </div>
        </div>

        {/* 스텝별 콘텐츠 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={existingWaiting ? 'existing' : step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {existingWaiting ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f8e9d8] border border-[#ecd3b6]">
                  <span className="text-2xl">🎫</span>
                  <div className="flex-1">
                    <div className="font-bold text-[14px] text-[#b56a2c]">이 미 대기 중입니다</div>
                    <div className="text-[12px] text-[#7c7972] mt-0.5">내 대 기번호 {existingWaiting.waitingNumber}번</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/track/${existingWaiting.waitingId}`)}
                  className="w-full h-[52px] bg-[#e08a45] rounded-xl text-white font-semibold text-[15px] shadow-[0_3px_0_#b56a2c] active:translate-y-[1px] active:shadow-[0_1px_0_#b56a2c] transition-all"
                >
                  🔍 내 순서 확인하기
                </button>
              </div>

            ) : step === 'phone' ? (
              <div className="bg-white rounded-2xl border border-[#e8e5de] p-4 flex flex-col gap-3.5"
                style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="font-bold text-[15px] text-[#34322e]">대기 접수</div>
                <div>
                  <div className="text-[12px] text-[#7c7972] font-semibold mb-1.5 px-0.5">휴대폰 번호</div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={e => {
                      let val = e.target.value.replace(/[^0-9]/g, '')
                      if (val.length > 3 && val.length <= 7) {
                        val = val.slice(0, 3) + '-' + val.slice(3)
                      } else if (val.length > 7) {
                        val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11)
                      }
                      setPhone(val)
                    }}
                    placeholder="010-0000-0000"
                    className="w-full min-h-[50px] border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 font-num font-semibold text-[15px] outline-none focus:border-[#e08a45] placeholder:text-[#a9a59c] transition-colors"
                  />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer px-0.5">
                  <span
                    onClick={() => setAgreed(a => !a)}
                    className="w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center text-[13px] text-white flex-none transition-all"
                    style={{ borderColor: agreed ? '#e08a45' : '#d8d4cc', background: agreed ? '#e08a45' : '#fff' }}
                  >
                    {agreed ? '✓' : ''}
                  </span>
                  <span className="text-[13px] text-[#7c7972]">개인정보 수집·이용에 동의합니다 (대기 알림용)</span>
                </label>
                {errorMsg && (
                  <div className="text-[13px] text-[#E5483B] bg-[#fbe4e1] rounded-xl px-3.5 py-3 border border-[#E5483B]/30">{errorMsg}</div>
                )}
                <button
                  onClick={handleSendOtp}
                  disabled={!phone || !agreed}
                  className="w-full h-[52px] bg-[#e08a45] disabled:bg-[#d8d4cc] disabled:shadow-none disabled:text-[#a9a59c] rounded-xl text-white font-semibold text-[15px] shadow-[0_2px_0_#b56a2c] active:translate-y-px active:shadow-none transition-all"
                >
                  인증번호 받기
                </button>
              </div>

            ) : step === 'otp' ? (
              <div className="bg-white rounded-2xl border border-[#e8e5de] p-4 flex flex-col gap-4"
                style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="font-bold text-[15px] text-[#34322e]">인증번 호 입력</div>
                <div className="text-[13px] text-[#7c7972]">{phone}로 발송된 인증번호를 입력해 주세요</div>
                <OtpInput onComplete={handleOtpComplete} />
              </div>

            ) : step === 'confirmed' ? (
              <div className="bg-white rounded-2xl border border-[#e8e5de] p-4 flex flex-col gap-3.5"
                style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#e6f2e6] border border-[#4CAF50] flex items-center justify-center text-[11px] text-[#2f7a33] flex-none">✓</span>
                  <div className="font-bold text-[15px] text-[#34322e]">인증 완료</div>
                </div>
                <div className="text-[13px] text-[#7c7972] px-0.5">{phone} 인증이 완료되었습니다.<br />아래 버튼을 눌러 대기를 접수하세요.</div>
                {errorMsg && (
                  <div className="text-[13px] text-[#E5483B] bg-[#fbe4e1] rounded-xl px-3.5 py-3 border border-[#E5483B]/30">{errorMsg}</div>
                )}
                <button
                  onClick={handleRegister}
                  className="w-full h-[52px] bg-[#e08a45] rounded-xl text-white font-semibold text-[15px] shadow-[0_2px_0_#b56a2c] active:translate-y-px active:shadow-none transition-all"
                >
                  🎫 대기 접수하기
                </button>
              </div>

            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="text-[32px]">⏳</div>
                <div className="text-[14px] text-[#7c7972]">대기 접수 중...</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </ScrollArea>
    </div>
  )
}