import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../../components/common/AppBar'
import Btn from '../../components/common/Btn'

export default function AuthOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(163)
  const navigate = useNavigate()
  const inputRefs = useRef([])

  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timer])

  const mm = String(Math.floor(timer / 60)).padStart(2, '0')
  const ss = String(timer % 60).padStart(2, '0')

  const handleChange = (i, val) => {
    // 숫자만 추출
    const digits = val.replace(/\D/g, '')
    
    if (!digits) {
      const next = [...otp]
      next[i] = ''
      setOtp(next)
      return
    }

    // 여러 자리 붙여넣기 처리
    if (digits.length > 1) {
      const next = [...otp]
      for (let j = 0; j < digits.length && i + j < 6; j++) {
        next[i + j] = digits[j]
      }
      setOtp(next)
      const focusIdx = Math.min(i + digits.length, 5)
      inputRefs.current[focusIdx]?.focus()
      return
    }

    // 한 글자 입력
    const next = [...otp]
    next[i] = digits
    setOtp(next)
    
    // 다음 칸으로 포커스 이동
    if (i < 5) {
      inputRefs.current[i + 1]?.focus()
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const next = [...otp]
      next[i - 1] = ''
      setOtp(next)
      inputRefs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputRefs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < 5) {
      inputRefs.current[i + 1]?.focus()
    }
  }

  const handleFocus = (e) => {
    e.target.select()
  }

  const filled = otp.filter(Boolean).length

  return (
    <div className="flex flex-col h-full bg-white">
      <AppBar back title="인증번호 입력" />

      <div className="flex-1 px-5 py-7 flex flex-col gap-7">
        <div>
          <div className="font-num font-bold text-[21px] leading-[1.4] text-[#34322e]">
            인증번호를<br />입력해 주세요
          </div>
          <div className="text-[13.5px] text-[#7c7972] mt-2.5 leading-[1.5]">
            6자리 인증번호를 보냈어요.
          </div>
        </div>

        {/* OTP 박스 */}
        <div className="flex gap-2 justify-center">
          {otp.map((v, i) => {
            const isCurrent = v === '' && otp.slice(0, i).every(Boolean)
            return (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                id={`otp-${i}`}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={v}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onFocus={handleFocus}
                className="w-[46px] h-[58px] rounded-xl font-num font-bold text-2xl text-center outline-none transition-colors duration-200"
                style={{
                  border: `2px solid ${isCurrent ? '#e08a45' : v ? '#34322e' : '#d8d4cc'}`,
                  background: isCurrent ? '#f8e9d8' : '#fff',
                }}
              />
            )
          })}
        </div>

        {/* 타이머 */}
        <div className="text-center text-[13px] text-[#7c7972]">
          <span className="font-num font-bold text-[#E5483B]">{mm}:{ss}</span> 후 재발송 가능
        </div>

        <div className="flex-1" />
        <Btn variant="primary" full disabled={filled < 6} onClick={() => {
          const phone = sessionStorage.getItem('otp_pending') || ''
          sessionStorage.removeItem('otp_pending')
          localStorage.setItem('user_session', JSON.stringify({ phone, authenticated: true }))
          navigate('/home', { replace: true })
        }}>
          확인
        </Btn>
        <div className="text-center text-[13px] text-[#a9a59c]">
          인증번호를 못 받았나요?{' '}
          <button onClick={() => setTimer(163)} className="text-[#b56a2c] underline">재발송</button>
        </div>
      </div>
    </div>
  )
}
