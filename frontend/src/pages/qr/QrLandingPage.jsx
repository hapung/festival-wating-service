import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppBar from '../../components/common/AppBar'
import Btn from '../../components/common/Btn'
import { useBoothDetail, useRegisterWaiting } from '../../api/queries'
import ScrollArea from '../../components/common/ScrollArea'
import { getImageUrl } from '../../api/client'

export default function QrLandingPage() {
  const { boothId } = useParams()
  const navigate = useNavigate()
  const parsedBoothId = parseInt(boothId)

  const [phone, setPhone]   = useState('')
  const [agreed, setAgreed] = useState(false)

  const { data: booth, isLoading, error } = useBoothDetail(parsedBoothId)
  const registerMutation = useRegisterWaiting()

  // 이미 이 부스 대기 중인지 확인
  const stored = localStorage.getItem(`waiting_booth_${boothId}`)
  const existingWaiting = stored ? JSON.parse(stored) : null

  const handleRegister = useCallback(() => {
    if (!phone || !agreed) return
    registerMutation.mutate({ boothId: parsedBoothId, phoneNumber: phone }, {
      onSuccess: (data) => {
        localStorage.setItem(
          `waiting_booth_${boothId}`,
          JSON.stringify({ waitingId: data.waitingId, waitingNumber: data.waitingNumber })
        )
        navigate(`/track/${data.waitingId}`)
      }
    })
  }, [phone, agreed, parsedBoothId, boothId, navigate, registerMutation])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#faf8f4] items-center justify-center">
        <div className="text-[14px] text-[#7c7972]">부스 정보를 불러오는 중...</div>
      </div>
    )
  }

  if (error || !booth) {
    return (
      <div className="flex flex-col h-full bg-[#faf8f4] items-center justify-center px-6 text-center">
        <div className="text-[36px] mb-2">🏮</div>
        <div className="text-[15px] font-bold text-[#34322e] mb-1">부스를 찾을 수 없습니다</div>
        <div className="text-[12.5px] text-[#7c7972] mb-4">유효하지 않은 QR 코드입니다.</div>
        <Btn variant="primary" onClick={() => navigate('/home')}>홈으로 가기</Btn>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#faf8f4]">
      <AppBar back title="대기 접수" />

      <ScrollArea className="flex-1 min-h-0" innerClassName="px-4 pt-4 pb-10 flex flex-col gap-4">

        {/* 부스 정보 헤더 */}
        <div className="bg-white rounded-2xl border border-[#e8e5de] p-4"
          style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3">
            {booth.imageUrl ? (
              <img src={getImageUrl(booth.imageUrl)} alt={booth.name} className="w-12 h-12 rounded-xl object-cover flex-none" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#efece6] border border-[#e8e5de] flex items-center justify-center text-2xl flex-none">
                🏮
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[17px] text-[#34322e]"
                style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
                {booth.name}
              </div>
              <div className="text-[12px] text-[#7c7972] mt-0.5">📍 {booth.locationDescription}</div>
            </div>
          </div>
          {booth.description && (
            <div className="mt-3 pt-3 border-t border-[#e8e5de] text-[13px] text-[#7c7972] leading-[1.5]">
              {booth.description}
            </div>
          )}
        </div>

        {/* 현재 대기 현황 */}
        <div className="flex justify-between items-center bg-white rounded-2xl border border-[#e8e5de] px-5 py-4"
          style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)' }}>
          <div>
            <div className="text-[12px] text-[#7c7972] font-semibold">현재 대기</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-num font-bold text-[32px] leading-none text-[#b56a2c]">
                {booth.currentWaitingCount}
              </span>
              <span className="text-[14px] text-[#7c7972]">팀</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-[#7c7972] font-semibold">예상 대기</div>
            <div className="flex items-baseline gap-1 mt-0.5 justify-end">
              <span className="font-num font-bold text-[32px] leading-none text-[#34322e]">
                {booth.currentWaitingCount * 5}
              </span>
              <span className="text-[14px] text-[#7c7972]">분</span>
            </div>
          </div>
        </div>

        {existingWaiting ? (
          /* 이미 대기 중인 경우 */
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f8e9d8] border border-[#ecd3b6]">
              <span className="text-2xl">🎫</span>
              <div className="flex-1">
                <div className="font-bold text-[14px] text-[#b56a2c]">이미 대기 중입니다</div>
                <div className="text-[12px] text-[#7c7972] mt-0.5">
                  내 대기번호 {existingWaiting.waitingNumber}번
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/track/${existingWaiting.waitingId}`)}
              className="w-full h-[52px] bg-[#e08a45] rounded-xl text-white font-semibold text-[15px] shadow-[0_3px_0_#b56a2c] active:translate-y-[1px] active:shadow-[0_1px_0_#b56a2c] transition-all"
              style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}
            >
              🔍 내 순서 확인하기
            </button>
          </div>
        ) : (
          /* 접수 폼 */
          <div className="bg-white rounded-2xl border border-[#e8e5de] p-4 flex flex-col gap-3.5"
            style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="font-bold text-[15px] text-[#34322e]"
              style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
              대기 접수
            </div>

            {/* 전화번호 입력 */}
            <div>
              <div className="text-[12px] text-[#7c7972] font-semibold mb-1.5 px-0.5">휴대폰 번호</div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full min-h-[50px] border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 font-num font-semibold text-[15px] outline-none focus:border-[#e08a45] placeholder:text-[#a9a59c] transition-colors"
              />
            </div>

            {/* 개인정보 동의 */}
            <label className="flex items-center gap-2.5 cursor-pointer px-0.5">
              <span
                onClick={() => setAgreed(a => !a)}
                className="w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center text-[13px] text-white flex-none transition-all"
                style={{
                  borderColor: agreed ? '#e08a45' : '#d8d4cc',
                  background:  agreed ? '#e08a45' : '#fff',
                }}
              >
                {agreed ? '✓' : ''}
              </span>
              <span className="text-[13px] text-[#7c7972]">
                개인정보 수집·이용에 동의합니다 (대기 알림용)
              </span>
            </label>

            {/* 접수 버튼 */}
            <button
              onClick={handleRegister}
              disabled={!phone || !agreed || registerMutation.isPending}
              className="w-full h-[52px] bg-[#e08a45] disabled:bg-[#d8d4cc] disabled:shadow-none disabled:text-[#a9a59c] rounded-xl text-white font-semibold text-[15px] shadow-[0_2px_0_#b56a2c] active:translate-y-px active:shadow-none transition-all"
              style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}
            >
              {registerMutation.isPending ? '접수 중...' : '접수 완료하기'}
            </button>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
