import React, { useState } from 'react'
import AdminLayout from './AdminLayout'
import { useBoothDetail, useCallWaiting, useCompleteWaiting, useCancelWaiting } from '../../api/queries'

function getAdminSession() {
  try {
    const s = sessionStorage.getItem('admin_session') || localStorage.getItem('admin_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export default function AdminQueuePage() {
  const session = getAdminSession()
  const boothId = session?.boothId ?? 1

  const { data: booth, isLoading } = useBoothDetail(boothId, { refetchInterval: 10000 })
  const callMutation     = useCallWaiting()
  const completeMutation = useCompleteWaiting()
  const cancelMutation   = useCancelWaiting()

  const [calledWaiting, setCalledWaiting] = useState(null)

  const waitingCount = booth?.currentWaitingCount ?? 0
  const isMutating = callMutation.isPending || completeMutation.isPending || cancelMutation.isPending

  const handleCallNext = () => {
    callMutation.mutate(boothId, {
      onSuccess: (data) => setCalledWaiting({ waitingId: data.waitingId, waitingNumber: data.waitingNumber })
    })
  }
  const handleComplete = () => {
    if (!calledWaiting) return
    completeMutation.mutate(calledWaiting.waitingId, { onSuccess: () => setCalledWaiting(null) })
  }
  const handleCancel = () => {
    if (!calledWaiting) return
    cancelMutation.mutate(calledWaiting.waitingId, { onSuccess: () => setCalledWaiting(null) })
  }

  return (
    <AdminLayout>
      {/* 헤더 */}
      <div className="flex-none flex items-center justify-between px-4 sm:px-7 py-4 bg-white rounded-b-3xl z-10 relative"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <div>
          <div className="font-num font-bold text-[17px]">실시간 대기열</div>
          <div className="text-[12px] text-[#7c7972] mt-0.5 truncate">
            {isLoading ? '불러오는 중...' : `${booth?.name || '부스'} · ${booth?.locationDescription || ''}`}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#f8e9d8] border border-[#ecd3b6]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e08a45]" />
          <span className="font-num font-bold text-[13px] text-[#b56a2c]">{isLoading ? '·' : waitingCount}팀 대기 중</span>
        </div>
      </div>

      {/* 메인 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 max-w-[420px] w-full mx-auto">

        {calledWaiting ? (
          /* ── 호출 상태 ── */
          <>
            {/* 번호표 */}
            <div className="w-full rounded-[28px] overflow-hidden"
              style={{ boxShadow: '0 12px 40px rgba(224,138,69,0.18)' }}>
              {/* 상단 스트라이프 */}
              <div className="h-2 w-full"
                style={{ background: 'repeating-linear-gradient(90deg, #e08a45 0px, #e08a45 16px, #f8a55c 16px, #f8a55c 32px)' }} />
              <div className="bg-white px-6 pt-6 pb-5 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-num font-bold text-[#e08a45] bg-[#f8e9d8] mb-4">
                  🔊 호출됨
                </div>
                <div className="text-[11px] text-[#a9a59c] font-semibold tracking-widest mb-1">WAITING NO.</div>
                <div className="font-num font-black text-[96px] leading-none text-[#e08a45]" style={{ letterSpacing: '-4px' }}>
                  {String(calledWaiting.waitingNumber).padStart(3, '0')}
                </div>
                <div className="mt-3 h-px w-full" style={{ background: 'repeating-linear-gradient(90deg, #e8e5de 0px, #e8e5de 6px, transparent 6px, transparent 12px)' }} />
              </div>
              {/* 하단 스트라이프 */}
              <div className="h-2 w-full"
                style={{ background: 'repeating-linear-gradient(90deg, #e08a45 0px, #e08a45 16px, #f8a55c 16px, #f8a55c 32px)' }} />
            </div>

            {/* 액션 버튼 */}
            <div className="w-full grid grid-cols-2 gap-3">
              <button onClick={handleCancel} disabled={isMutating}
                className="flex flex-col items-center justify-center gap-1.5 h-[76px] rounded-3xl font-num font-semibold text-[13px] transition-all active:scale-95 disabled:opacity-40"
                style={{ background: '#fbe4e1', color: '#E5483B' }}>
                <span className="text-[26px] leading-none">🚫</span>
                <span>{cancelMutation.isPending ? '처리 중...' : '노쇼'}</span>
              </button>
              <button onClick={handleComplete} disabled={isMutating}
                className="flex flex-col items-center justify-center gap-1.5 h-[76px] rounded-3xl font-num font-semibold text-[13px] transition-all active:scale-95 disabled:opacity-40"
                style={{ background: '#e6f2e6', color: '#2f7a33' }}>
                <span className="text-[26px] leading-none">✅</span>
                <span>{completeMutation.isPending ? '처리 중...' : '입장 완료'}</span>
              </button>
            </div>
          </>
        ) : (
          /* ── 대기 상태 ── */
          <>
            {/* 대기 현황 원형 디스플레이 */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-[200px] h-[200px] rounded-full flex items-center justify-center"
                style={{
                  background: waitingCount > 0
                    ? 'radial-gradient(circle at 40% 35%, #fff8f0, #fdebd8)'
                    : 'radial-gradient(circle at 40% 35%, #f6f4ef, #ece9e3)',
                  boxShadow: waitingCount > 0
                    ? '0 8px 32px rgba(224,138,69,0.2), inset 0 -3px 0 rgba(0,0,0,0.05)'
                    : '0 8px 32px rgba(0,0,0,0.07), inset 0 -3px 0 rgba(0,0,0,0.04)',
                  border: `2px solid ${waitingCount > 0 ? '#ecd3b6' : '#dedad4'}`,
                }}>
                <div className="text-center">
                  <div className="font-num font-black leading-none"
                    style={{ fontSize: 72, color: waitingCount > 0 ? '#e08a45' : '#c4c0b8', letterSpacing: '-3px' }}>
                    {isLoading ? '·' : waitingCount}
                  </div>
                  <div className="text-[14px] font-semibold mt-1" style={{ color: waitingCount > 0 ? '#c98b50' : '#a9a59c' }}>팀 대기 중</div>
                </div>
              </div>
              <div className="text-[12.5px] text-[#a9a59c]">
                {waitingCount > 0 ? `예상 대기 약 ${waitingCount * 5}분` : '현재 대기 손님이 없어요'}
              </div>
            </div>

            {/* 호출 버튼 */}
            <button
              onClick={handleCallNext}
              disabled={waitingCount === 0 || isMutating || isLoading}
              className="flex items-center gap-2.5 px-10 py-4 rounded-3xl text-white font-num font-bold text-[16px] transition-all
                disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none
                active:translate-y-[2px]"
              style={{ background: '#e08a45', boxShadow: '0 4px 0 #b56a2c, 0 8px 24px rgba(224,138,69,0.3)' }}
            >
              <span className="text-[22px] leading-none">🔊</span>
              <span>{callMutation.isPending ? '호출 중...' : '다음 손님 호출'}</span>
            </button>
          </>
        )}

      </div>
    </AdminLayout>
  )
}
