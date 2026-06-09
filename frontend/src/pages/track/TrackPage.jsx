import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import StepBar from '../../components/common/StepBar'
import Btn from '../../components/common/Btn'
import { useWaitingStatus, useCancelWaiting, useBoothDetail, useMyActiveWaitings } from '../../api/queries'

function TrackCard({ number = 15, ahead = 5, tone = 'normal', note, phoneNumber }) {
  const isImminent = tone === 'imminent'

  const formatPhone = (num) => {
    if (!num) return ''
    const clean = num.replace(/\D/g, '')
    if (clean.length === 11) return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`
    if (clean.length === 10) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`
    return num
  }

  return (
    <motion.div
      className="rounded-3xl overflow-hidden"
      style={{
        boxShadow: isImminent
          ? '0 12px 40px rgba(229,72,59,0.2)'
          : '0 12px 40px rgba(224,138,69,0.15)',
      }}
      animate={isImminent ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
      transition={isImminent ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      {/* 상단 컬러 스트라이프 */}
      <div className="h-[5px] w-full"
        style={{
          background: isImminent
            ? 'linear-gradient(90deg, #E5483B, #ff7d6b, #E5483B)'
            : 'linear-gradient(90deg, #e08a45, #f8a55c, #e08a45)',
        }}
      />

      {/* 메인 카드 본체 */}
      <div className="px-7 pt-6 pb-6 text-center"
        style={{
          background: isImminent
            ? 'linear-gradient(160deg, #fff5f4 0%, #fff 60%)'
            : 'linear-gradient(160deg, #fff9f4 0%, #fff 60%)',
          border: `1.5px solid ${isImminent ? '#ffd0cc' : '#edd9c3'}`,
          borderTop: 'none',
        }}
      >
        {/* 라벨 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-num font-bold mb-4"
          style={{
            background: isImminent ? '#fbe4e1' : '#f8e9d8',
            color: isImminent ? '#E5483B' : '#b56a2c',
          }}>
          {isImminent ? '⚡ 곧 입장 차례예요' : '🎫 대기 중'}
        </div>

        {/* 번호 */}
        <div className="font-num font-black leading-none mb-1"
          style={{
            fontSize: 88,
            color: isImminent ? '#E5483B' : '#e08a45',
            letterSpacing: '-4px',
            textShadow: isImminent
              ? '0 4px 16px rgba(229,72,59,0.2)'
              : '0 4px 16px rgba(224,138,69,0.2)',
          }}>
          {String(number).padStart(2, '0')}
          <span className="text-[28px] font-bold ml-1" style={{ color: isImminent ? '#E5483B' : '#e08a45', opacity: 0.5, letterSpacing: 0 }}>번</span>
        </div>

        {/* 구분선 */}
        <div className="my-4 h-px w-full"
          style={{ background: 'repeating-linear-gradient(90deg, #e8e5de 0px, #e8e5de 5px, transparent 5px, transparent 10px)' }} />

        {/* 앞 팀 수 */}
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-[11px] text-[#a9a59c] font-semibold mb-0.5">앞에 남은 팀</div>
            <div className="flex items-baseline gap-1 justify-center">
              <span className="font-num font-black text-[40px] leading-none"
                style={{ color: isImminent ? '#E5483B' : '#34322e' }}>{ahead}</span>
              <span className="text-[15px] text-[#a9a59c]">팀</span>
            </div>
          </div>
        </div>

        {/* 위치 안내 */}
        {note && (
          <div className="mt-4 py-2.5 px-4 rounded-2xl text-[13px] font-num font-semibold"
            style={{ background: isImminent ? '#fbe4e1' : '#f8e9d8', color: isImminent ? '#E5483B' : '#b56a2c' }}>
            📍 {note}
          </div>
        )}

        {/* 연락처 */}
        {phoneNumber && (
          <div className="mt-3 text-[12px] text-[#a9a59c]">
            등록 번호 <span className="font-num font-semibold text-[#7c7972]">{formatPhone(phoneNumber)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function TrackPage() {
  const { waitingId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [calledAcked, setCalledAcked] = useState(false)

  // API Call - 실시간 순서/상태 폴링 조회 (4초 주기)
  const { data: waitingData, isLoading: isWaitingLoading, error } = useWaitingStatus(parseInt(waitingId))

  // my-active API로 활성 대기 복원 → boothId 추출
  const festivalId = localStorage.getItem('customer_festival_id')
  const { data: activeWaitings } = useMyActiveWaitings(festivalId ? parseInt(festivalId) : null)
  const activeEntry = activeWaitings?.find(w => w.waitingId === parseInt(waitingId))

  // fallback: localStorage에서 boothId 찾기 (my-active 응답 전까지)
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
  const waitingTeamsAhead = waitingData?.waitingTeamsAhead ?? waitingData?.aheadCount ?? 0
  
  // WAITING 상태에서 남은 팀이 2팀 이하면 IMMINENT로 취급
  const isImminent = status === 'WAITING' && waitingTeamsAhead <= 2
  const isCalled = status === 'CALLED' && !calledAcked
  
  const stepActive = { 
    WAITING: isImminent ? 1 : 0, 
    CALLED: 2, 
    COMPLETED: 3 
  }[status] ?? 0

  const clearSession = (bid) => {
    if (bid) localStorage.removeItem(`waiting_booth_${bid}`)
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_festival_id')
  }

  // 상태 변경에 따른 화면 분기
  useEffect(() => {
    if (status === 'COMPLETED') {
      clearSession(boothId)
      navigate('/result/completed', { replace: true })
    } else if (status === 'CANCELLED') {
      clearSession(boothId)
      navigate('/result/cancelled', { replace: true })
    }
  }, [status, navigate, boothId])

  const handleCancel = () => {
    cancelMutation.mutate(parseInt(waitingId), {
      onSuccess: () => {
        clearSession(boothId)
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

        <AnimatePresence mode="wait">
          <motion.div
            key={isImminent ? 'imminent' : 'normal'}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <TrackCard
              number={waitingData.waitingNumber}
              ahead={waitingTeamsAhead}
              tone={isImminent ? 'imminent' : 'normal'}
              note={isImminent ? '매장 근처에서 대기해 주세요' : undefined}
              phoneNumber={waitingData.phoneNumber}
            />
          </motion.div>
        </AnimatePresence>
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
      <AnimatePresence>
        {isCalled && (
          <motion.div
            className="absolute inset-0 backdrop-blur-[2px] flex items-center justify-center z-20 p-5"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="w-[88%] bg-white rounded-[28px] px-6 pt-8 pb-6 text-center"
              style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300, delay: 0.05 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-[#f8e9d8] border-2 border-[#e08a45] flex items-center justify-center text-[34px] mx-auto mb-4"
                animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >🔔</motion.div>
              <div className="font-num font-bold text-[20px] text-[#b56a2c] leading-[1.35]">
                매장 앞으로<br />방문해 주세요!
              </div>
              <div className="text-[13px] text-[#7c7972] mt-2.5 leading-[1.5]">
                {waitingData.waitingNumber}번 고객님, 입장 순서가 되었어요.<br />3분 내 미방문 시 자동 취소될 수 있어요.
              </div>
              <div className="mt-5">
                <Btn variant="primary" full onClick={() => setCalledAcked(true)}>확인</Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* 취소 확인 바텀시트 */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            className="absolute inset-0 flex items-end z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {/* 딤 배경 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={() => setShowCancelModal(false)} />
            {/* 시트 */}
            <motion.div
              className="relative w-full bg-white rounded-t-[24px] px-5 pt-3 pb-6"
              style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.18)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            >
              <div className="w-10 h-1 rounded-full bg-[#d8d4cc] mx-auto mb-5" />
              <div className="text-center">
                <div className="text-[30px] mb-2.5">⚠️</div>
                <div className="font-num font-bold text-[18px]">정말 대기를 취소하시겠어요?</div>
                <div className="text-[13px] text-[#7c7972] mt-2 leading-[1.5]">
                  취소하면 순서가 사라지고,<br />재접수 시 맨 뒤로 이동해요.
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="flex-1 h-[52px] rounded-2xl font-num font-semibold text-[14px] transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: '#fff', border: '1.5px solid #E5483B', color: '#E5483B' }}
                >
                  {cancelMutation.isPending ? '취소 중...' : '취소하기'}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-[2] h-[52px] rounded-2xl font-num font-bold text-[15px] text-white transition-all active:scale-95"
                  style={{ background: '#e08a45', boxShadow: '0 3px 0 #b56a2c' }}
                >
                  계속 기다리기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
