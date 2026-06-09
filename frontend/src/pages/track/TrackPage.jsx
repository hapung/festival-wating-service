import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import StepBar from '../../components/common/StepBar'
import Btn from '../../components/common/Btn'
import { useWaitingStatus, useCancelWaiting, useBoothDetail } from '../../api/queries'

function TrackCard({ number = 15, ahead = 5, tone = 'normal', note, phoneNumber }) {
  const accent = tone === 'imminent' ? '#E5483B' : '#e08a45'
  const bg = tone === 'imminent' ? '#fbe4e1' : '#ffffff'
  const border = tone === 'imminent' ? '#E5483B' : '#d8d4cc'

  const formatPhone = (num) => {
    if (!num) return ''
    const clean = num.replace(/\D/g, '')
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`
    }
    if (clean.length === 10) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`
    }
    return num
  }

  return (
    <div
      className="rounded-[20px] p-7 text-center"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        boxShadow: tone === 'imminent'
          ? '0 8px 28px rgba(229,72,59,.18)'
          : '0 6px 20px rgba(0,0,0,.06)',
      }}
    >
      <div className="text-[13px] text-[#7c7972] font-num font-semibold">내 대기번호</div>
      <div className="font-num font-bold leading-none my-1.5" style={{ fontSize: 76 }}>
        {number}<span className="text-[26px] text-[#7c7972]">번</span>
      </div>
      <div
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border"
        style={{
          background: tone === 'imminent' ? '#fff' : '#f6f4ef',
          borderColor: tone === 'imminent' ? '#E5483B' : '#e8e5de',
        }}
      >
        <span className="text-[14px] text-[#7c7972]">앞에</span>
        <span className="font-num font-bold text-[20px] leading-none" style={{ color: accent }}>{ahead}</span>
        <span className="text-[14px] text-[#7c7972]">팀 남음</span>
      </div>
      {note && (
        <div className="mt-3.5 text-[13px] font-num font-semibold" style={{ color: accent }}>
          📍 {note}
        </div>
      )}
      {phoneNumber && (
        <div className="mt-4 pt-3 border-t border-[#e8e5de]/60 text-[12px] text-[#7c7972]">
          등록된 연락처 : <span className="font-num font-semibold text-[#34322e]">{formatPhone(phoneNumber)}</span>
        </div>
      )}
    </div>
  )
}

export default function TrackPage() {
  const { waitingId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [calledAcked, setCalledAcked] = useState(false)
  const [devAdvancing, setDevAdvancing] = useState(false)

  // API Call - 실시간 순서/상태 폴링 조회 (4초 주기)
  const { data: waitingData, isLoading: isWaitingLoading, error } = useWaitingStatus(parseInt(waitingId))

  // localStorage에서 해당 waitingId를 가진 boothId 찾기
  let boothId = null
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('waiting_booth_')) {
      const val = JSON.parse(localStorage.getItem(key) || '{}')
      if (val.waitingId === parseInt(waitingId)) {
        boothId = parseInt(key.replace('waiting_booth_', ''))
        break
      }
    }
  }

  // API Call - 부스 상세 조회 (부스 이름 획득용)
  const { data: booth } = useBoothDetail(boothId)

  // 취소 Mutation
  const cancelMutation = useCancelWaiting()

  const status = waitingData?.status || 'WAITING'
  const waitingTeamsAhead = waitingData?.waitingTeamsAhead ?? 5
  
  // WAITING 상태에서 남은 팀이 2팀 이하면 IMMINENT로 취급
  const isImminent = status === 'WAITING' && waitingTeamsAhead <= 2
  const isCalled = status === 'CALLED' && !calledAcked
  
  const stepActive = { 
    WAITING: isImminent ? 1 : 0, 
    CALLED: 2, 
    COMPLETED: 3 
  }[status] ?? 0

  // 상태 변경에 따른 화면 분기
  useEffect(() => {
    if (status === 'COMPLETED') {
      if (boothId) {
        localStorage.removeItem(`waiting_booth_${boothId}`)
      }
      navigate('/result/completed', { replace: true })
    } else if (status === 'CANCELLED') {
      if (boothId) {
        localStorage.removeItem(`waiting_booth_${boothId}`)
      }
      navigate('/result/cancelled', { replace: true })
    }
  }, [status, navigate, boothId])

  // [DEV] 앞팀 한 칸 처리 후 폴링 데이터 즉시 갱신
  const handleDevAdvance = async () => {
    if (!boothId || devAdvancing) return
    setDevAdvancing(true)
    try {
      await fetch(`/api/dev/advance/${boothId}`, { method: 'POST' })
      await queryClient.invalidateQueries({ queryKey: ['waitingStatus', parseInt(waitingId)] })
    } finally {
      setDevAdvancing(false)
    }
  }

  const handleCancel = () => {
    cancelMutation.mutate(parseInt(waitingId), {
      onSuccess: () => {
        if (boothId) {
          localStorage.removeItem(`waiting_booth_${boothId}`)
        }
        navigate('/result/cancelled', { replace: true })
      }
    })
  }

  if (isWaitingLoading) {
    return (
      <div className="flex flex-col h-full bg-[#faf8f4] items-center justify-center">
        <div className="text-[14px] text-[#7c7972] font-semibold">대기 상태 조회 중...</div>
      </div>
    )
  }

  if (error || !waitingData) {
    return (
      <div className="flex flex-col h-full bg-[#faf8f4] items-center justify-center px-6 text-center">
        <div className="text-[36px] mb-2">🎫</div>
        <div className="text-[15px] font-bold text-[#34322e] mb-1">대기 내역을 찾을 수 없습니다</div>
        <div className="text-[12.5px] text-[#7c7972] mb-4">대기번호가 만료되었거나 취소되었습니다.</div>
        <Btn variant="primary" onClick={() => navigate('/home')}>홈으로 가기</Btn>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#faf8f4] relative">
      {/* 헤더 */}
      <div className="flex-none text-center px-4 py-4 bg-white border-b border-[#e8e5de]">
        <div className="font-num font-bold text-[15px]">{booth?.name || '부스 정보'}</div>
        <div className="text-[11px] text-[#a9a59c] mt-0.5">실시간 대기 현황 · 화면을 닫지 마세요</div>
      </div>

      {/* 메인 콘텐츠 */}
      <div
        className={`flex-1 flex flex-col px-5 py-6 gap-6 justify-center transition-all ${isCalled ? 'blur-sm opacity-60' : ''}`}
      >
        {isImminent && (
          <div className="self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbe4e1] border border-[#E5483B] text-[#E5483B] text-[12px] font-num font-bold">
            ⚡ 곧 입장하실 차례예요
          </div>
        )}

        <TrackCard
          number={waitingData.waitingNumber}
          ahead={waitingTeamsAhead}
          tone={isImminent ? 'imminent' : 'normal'}
          note={isImminent ? '매장 근처에서 대기해 주세요' : undefined}
          phoneNumber={waitingData.phoneNumber}
        />
        <StepBar active={stepActive} danger={isImminent} />
      </div>

      {/* 취소 버튼 */}
      <div className={`flex-none px-4 py-4 border-t border-[#e8e5de] ${isCalled ? 'blur-sm opacity-60' : ''}`}>
        {isCalled ? (
          <Btn disabled full>대기 취소</Btn>
        ) : (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full text-center text-[#E5483B] text-[15px] font-num font-semibold underline underline-offset-[3px] py-3"
          >
            대기 취소
          </button>
        )}
      </div>

      {/* CALLED 팝업 오버레이 */}
      {isCalled && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-20 p-5">
          <div className="w-[88%] bg-white rounded-[22px] px-6 pt-8 pb-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="w-20 h-20 rounded-full bg-[#f8e9d8] border-2 border-[#e08a45] flex items-center justify-center text-[34px] mx-auto mb-4">🔔</div>
            <div className="font-num font-bold text-[20px] text-[#b56a2c] leading-[1.35]">
              매장 앞으로<br />방문해 주세요!
            </div>
            <div className="text-[13px] text-[#7c7972] mt-2.5 leading-[1.5]">
              {waitingData.waitingNumber}번 고객님, 입장 순서가 되었어요.<br />3분 내 미방문 시 자동 취소될 수 있어요.
            </div>
            <div className="mt-5">
              <Btn variant="primary" full onClick={() => setCalledAcked(true)}>확인</Btn>
            </div>
          </div>
        </div>
      )}

      {/* [DEV ONLY] 앞팀 처리 버튼 */}
      {import.meta.env.DEV && boothId && (
        <div className="absolute top-16 right-3 z-10">
          <button
            onClick={handleDevAdvance}
            disabled={devAdvancing}
            className="flex flex-col items-center gap-0.5 bg-[#1a1a2e] text-white rounded-xl px-2.5 py-2 text-[10px] font-num font-bold shadow-lg opacity-80 hover:opacity-100 disabled:opacity-40 transition-opacity"
          >
            <span className="text-[16px] leading-none">{devAdvancing ? '⏳' : '⚡'}</span>
            <span>앞팀</span>
            <span>처리</span>
          </button>
        </div>
      )}

      {/* 취소 확인 바텀시트 */}
      {showCancelModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-end z-20">
          <div className="w-full bg-white rounded-t-[22px] px-5 pt-3 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.25)]">
            <div className="w-10 h-1 rounded-sm bg-[#d8d4cc] mx-auto mb-5" />
            <div className="text-center">
              <div className="text-[30px] mb-2.5">⚠️</div>
              <div className="font-num font-bold text-[18px]">정말 대기를 취소하시겠어요?</div>
              <div className="text-[13px] text-[#7c7972] mt-2 leading-[1.5]">
                취소하면 순서가 사라지고,<br />재접수 시 맨 뒤로 이동해요.
              </div>
            </div>
            <div className="flex flex-col gap-2.5 mt-6">
              <Btn variant="primary" full onClick={() => setShowCancelModal(false)}>계속 기다리기</Btn>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="w-full min-h-[48px] text-[#E5483B] font-num font-semibold text-[15px] disabled:opacity-50"
              >
                {cancelMutation.isPending ? '취소 중...' : '대기 취소하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
