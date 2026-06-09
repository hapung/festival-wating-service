import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../../components/common/AppBar'
import Btn from '../../components/common/Btn'

export default function AuthPhonePage() {
  const [phone, setPhone] = useState('')
  const navigate = useNavigate()

  const handleSubmit = () => {
    if (phone.length >= 8) {
      sessionStorage.setItem('otp_pending', `010${phone}`)
      navigate('/auth/otp')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <AppBar back title="전화번호 인증" />

      <div className="flex-1 px-5 py-7 flex flex-col gap-7">
        <div>
          <div className="font-num font-bold text-[21px] leading-[1.4] text-[#34322e]">
            전화번호로<br />빠르게 시작해요
          </div>
          <div className="text-[13.5px] text-[#7c7972] mt-2.5 leading-[1.6]">
            대기 순서 알림을 받으려면<br />전화번호 인증이 필요해요.
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="text-[12px] text-[#7c7972] font-num font-semibold">휴대폰 번호</div>
          <div className="flex gap-2">
            <div className="w-[70px] h-[50px] rounded-xl border-[1.5px] border-[#d8d4cc] flex items-center justify-center font-num font-semibold text-[15px] text-[#7c7972] bg-[#f6f4ef] flex-none">
              010
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={8}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="0000 - 0000"
              className="flex-1 h-[50px] border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 font-num font-semibold text-[15px] text-[#34322e] outline-none focus:border-[#e08a45] placeholder:text-[#a9a59c]"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#f6f4ef] border border-[#e8e5de] text-[12.5px] text-[#7c7972] leading-[1.55]">
          📋 전화번호는 대기 알림 발송 목적으로만 사용되며, 축제 종료 후 자동 삭제됩니다.
        </div>

        <div className="flex-1" />
        <Btn variant="primary" full onClick={handleSubmit} disabled={phone.length < 8}>
          인증번호 받기
        </Btn>
      </div>
    </div>
  )
}
