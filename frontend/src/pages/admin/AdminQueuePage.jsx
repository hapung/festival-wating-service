import React from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import Badge from '../../components/common/Badge'
import Btn from '../../components/common/Btn'
import Card from '../../components/common/Card'
import { useBoothWaitings, useBoothDetail, useCallWaiting, useCompleteWaiting, useCancelWaiting } from '../../api/queries'
import ScrollArea from '../../components/common/ScrollArea'

function getAdminSession() {
  try {
    const s = sessionStorage.getItem('admin_session') || localStorage.getItem('admin_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

const STATUS_BADGE = {
  WAITING:   ['gray',   'WAITING'],
  CALLED:    ['orange', 'CALLED'],
  COMPLETED: ['green',  'COMPLETED'],
  CANCELLED: ['red',    'CANCELLED'],
}

// 태블릿+ 테이블용 액션 버튼
function QueueActions({ status, waitingId, onCall, onComplete, onCancel, isMutating }) {
  const W = status === 'WAITING'
  const C = status === 'CALLED'
  return (
    <div className="flex gap-1.5 justify-end flex-wrap">
      <Btn sm variant={W ? 'primary' : undefined} disabled={!W || isMutating} onClick={onCall}>🔊 호출</Btn>
      <Btn sm disabled={!C || isMutating} onClick={() => onComplete(waitingId)}
        style={{ borderColor: C ? '#4CAF50' : undefined, color: C ? '#2f7a33' : undefined }}>
        ✅ 입장완료
      </Btn>
      <Btn sm variant={(W || C) ? 'danger' : undefined} disabled={!(W || C) || isMutating} onClick={() => onCancel(waitingId)}>
        ❌ 노쇼
      </Btn>
    </div>
  )
}

// 모바일 카드형 아이템
function QueueCard({ r, onCall, onComplete, onCancel, isMutating }) {
  const W = r.status === 'WAITING'
  const C = r.status === 'CALLED'
  const dim = r.status === 'COMPLETED' || r.status === 'CANCELLED'

  return (
    <div
      className="bg-white rounded-2xl border border-[#e8e5de] p-4 flex flex-col gap-3"
      style={{
        opacity: dim ? 0.5 : 1,
        borderColor: C ? '#e08a45' : undefined,
        boxShadow: C ? '0 0 0 2px #f8e9d8' : undefined,
      }}
    >
      {/* 상단: 번호 + 상태 + 시각 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="font-num font-bold text-[26px] leading-none"
            style={{ color: C ? '#b56a2c' : '#34322e' }}
          >
            {r.waitingNumber}번
          </span>
          <Badge tone={STATUS_BADGE[r.status]?.[0] || 'gray'}>
            {STATUS_BADGE[r.status]?.[1] || r.status}
          </Badge>
        </div>
        <span className="text-[12px] text-[#a9a59c] font-num">{r.time}</span>
      </div>

      {/* 전화번호 */}
      <div className="text-[13px] font-num text-[#7c7972]">📞 {r.phoneNumber}</div>

      {/* 버튼 — 활성 상태일 때만 표시 */}
      {(W || C) && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onCall(r.waitingId)}
            disabled={!W || isMutating}
            className="flex-1 h-10 rounded-xl text-[13px] font-num font-semibold transition-all
              disabled:opacity-30 disabled:cursor-not-allowed
              bg-[#e08a45] text-white shadow-[0_2px_0_#b56a2c]
              active:translate-y-[1px] active:shadow-[0_1px_0_#b56a2c]"
          >
            🔊 호출
          </button>
          <button
            onClick={() => onComplete(r.waitingId)}
            disabled={!C || isMutating}
            className="flex-1 h-10 rounded-xl text-[13px] font-num font-semibold transition-all
              disabled:opacity-30 disabled:cursor-not-allowed
              bg-[#e6f2e6] text-[#2f7a33] border border-[#4CAF50]"
          >
            ✅ 완료
          </button>
          <button
            onClick={() => onCancel(r.waitingId)}
            disabled={isMutating}
            className="flex-1 h-10 rounded-xl text-[13px] font-num font-semibold transition-all
              disabled:opacity-30 disabled:cursor-not-allowed
              bg-[#fbe4e1] text-[#E5483B] border border-[#E5483B]"
          >
            ❌ 노쇼
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminQueuePage() {
  const navigate = useNavigate()
  const session = getAdminSession()
  const boothId = session?.boothId ?? 1

  const { data: booth, isLoading: isBoothLoading } = useBoothDetail(boothId)
  const { data: queueList, isLoading: isQueueLoading, isFetching } = useBoothWaitings(boothId)

  const callMutation     = useCallWaiting()
  const completeMutation = useCompleteWaiting()
  const cancelMutation   = useCancelWaiting()

  const isMutating = callMutation.isPending || completeMutation.isPending || cancelMutation.isPending

  // call-next는 boothId 기준 자동 호출 (개별 waitingId 지정 불가)
  const handleCall     = () => callMutation.mutate(boothId)
  const handleComplete = (id) => completeMutation.mutate(id)
  const handleCancel   = (id) => cancelMutation.mutate(id)

  const activeQueue  = queueList?.filter(q => q.status === 'WAITING' || q.status === 'CALLED') || []
  const waitingCount = activeQueue.length

  const isEmpty = !queueList || queueList.length === 0

  return (
    <AdminLayout>
      {/* 헤더 */}
      <div className="flex-none flex items-center justify-between px-4 sm:px-7 py-4 sm:py-5 border-b border-[#e8e5de] bg-white gap-3">
        <div className="min-w-0">
          <div className="font-num font-bold text-[17px] sm:text-[19px]">실시간 대기열</div>
          <div className="text-[11.5px] sm:text-[12.5px] text-[#7c7972] mt-0.5 truncate">
            {isBoothLoading ? '불러오는 중...' : `${booth?.name || '부스'} · ${booth?.locationDescription || ''}`}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-none">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#f8e9d8] border border-[#e08a45]">
            <span className="text-[11px] sm:text-[12px] text-[#b56a2c] font-num font-semibold">대기</span>
            <span className="font-num font-bold text-[20px] sm:text-[24px] text-[#b56a2c] leading-none inline-flex items-center">
              {isQueueLoading ? '···' : waitingCount}
            </span>
            <span className="text-[11px] sm:text-[12px] text-[#b56a2c]">팀</span>
          </div>
          {/* 백그라운드 갱신 중일 때만 깜빡이는 인디케이터 */}
          <span className="flex items-center gap-1.5 text-[11.5px] text-[#7c7972]">
            <span className={`w-2 h-2 rounded-full ${isFetching && !isQueueLoading ? 'bg-[#e08a45] animate-pulse' : 'bg-[#4CAF50]'}`} />
            <span className="hidden sm:inline">{isFetching && !isQueueLoading ? '동기화 중' : '실시간'}</span>
          </span>
        </div>
      </div>

      {/* 콘텐츠 */}
      <ScrollArea className="flex-1 min-h-0" innerClassName="px-4 sm:px-7 py-3 sm:py-4">
        {isQueueLoading ? (
          <div className="text-center py-16 text-[14px] text-[#7c7972]">대기열 목록을 불러오는 중...</div>
        ) : isEmpty ? (
          <div className="text-center py-16">
            <div className="text-[36px] mb-3">📋</div>
            <div className="text-[14px] text-[#7c7972]">아직 접수된 대기 고객이 없습니다.</div>
          </div>
        ) : (
          <>
            {/* 모바일: 카드 리스트 */}
            <div className="flex sm:hidden flex-col gap-3">
              {queueList.map(r => (
                <QueueCard
                  key={r.waitingId}
                  r={r}
                  onCall={() => handleCall()}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  isMutating={isMutating}
                />
              ))}
            </div>

            {/* 태블릿+: 테이블 */}
            <div className="hidden sm:block">
              <Card className="overflow-hidden">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      {['대기번호', '전화번호', '접수시각', '상태', '액션'].map((h, i) => (
                        <th
                          key={h}
                          className="text-left font-num text-[11px] font-bold tracking-widest text-[#7c7972] uppercase px-3.5 py-3 border-b-[1.5px] border-[#d8d4cc]"
                          style={{ width: ['90px', undefined, '90px', '120px', '300px'][i], textAlign: i === 4 ? 'right' : 'left' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queueList.map(r => {
                      const dim = r.status === 'COMPLETED' || r.status === 'CANCELLED'
                      return (
                        <tr key={r.waitingId} style={{ opacity: dim ? 0.5 : 1 }}>
                          <td className="px-3.5 py-3 border-b border-[#e8e5de] font-num font-bold text-[16px]"
                            style={{ color: r.status === 'CALLED' ? '#b56a2c' : '#34322e' }}>
                            {r.waitingNumber}번
                          </td>
                          <td className="px-3.5 py-3 border-b border-[#e8e5de] font-num">{r.phoneNumber}</td>
                          <td className="px-3.5 py-3 border-b border-[#e8e5de] text-[#7c7972] font-num">{r.time}</td>
                          <td className="px-3.5 py-3 border-b border-[#e8e5de]">
                            <Badge tone={STATUS_BADGE[r.status]?.[0] || 'gray'}>
                              {STATUS_BADGE[r.status]?.[1] || r.status}
                            </Badge>
                          </td>
                          <td className="px-3.5 py-3 border-b border-[#e8e5de]">
                            <QueueActions
                              status={r.status}
                              waitingId={r.waitingId}
                              onCall={() => handleCall()}
                              onComplete={handleComplete}
                              onCancel={handleCancel}
                              isMutating={isMutating}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          </>
        )}
      </ScrollArea>
    </AdminLayout>
  )
}
