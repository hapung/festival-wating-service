import React, { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppBar from '../../components/common/AppBar'
import Btn from '../../components/common/Btn'
import Badge from '../../components/common/Badge'
import { useBoothDetail } from '../../api/queries'
import ScrollArea from '../../components/common/ScrollArea'
import { getImageUrl } from '../../api/client'

function MenuItem({ item }) {
  return (
    <div className={`flex gap-3 px-3.5 py-3 rounded-xl ${item.special ? 'bg-[#f8e9d8] border border-[#ecd3b6]' : 'border border-transparent'}`}>
      {item.imageUrl ? (
        <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-none" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-[#efece6] border border-[#e8e5de] flex-none" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-num font-semibold text-[14px]">{item.name}</span>
          {item.special && (
            <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-[#f8e9d8] border border-[#e08a45] text-[#b56a2c] text-[10.5px] font-num font-semibold">🌾 특산물</span>
          )}
        </div>
        <div className="text-[11.5px] text-[#7c7972] mt-1 leading-[1.4]">{item.desc}</div>
      </div>
      <div className="font-num font-bold text-[13.5px] text-[#b56a2c] flex-none">{item.price}</div>
    </div>
  )
}

// 페이지 본문 — React.memo로 격리
const BoothContent = React.memo(function BoothContent({ booth, existingWaiting, onGoTrack }) {
  return (
    <>
      <AppBar back backTo={booth.festivalId ? `/booths/${booth.festivalId}` : '/home'} title="부스 상세" />

      {/* 스크롤 영역 */}
      <ScrollArea className="flex-1 min-h-0">
        {/* 헤더 */}
        <div className="px-4 pt-3.5 pb-3">
          {booth.imageUrl ? (
            <img src={getImageUrl(booth.imageUrl)} alt={booth.name} className="h-28 w-full rounded-2xl object-cover mb-3" />
          ) : (
            <div className="h-28 rounded-2xl bg-[#efece6] border border-[#e8e5de] flex items-center justify-center text-[#a9a59c] text-[13px] mb-3">
              🏮 부스 대표 이미지
            </div>
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-num font-bold text-[19px]">{booth.name}</span>
            <Badge tone="gray">📍 {booth.locationDescription}</Badge>
          </div>
          <div className="text-[13px] text-[#7c7972] mt-1 leading-[1.5]">
            {booth.description}
          </div>
        </div>

        <div className="h-px bg-[#e8e5de] mx-4" />

        {/* 메뉴판 */}
        <div className="px-4 py-3">
          <div className="font-num font-bold text-[13px] py-1.5">메뉴판</div>
          <div className="px-1">
            {booth.products?.map(m => (
              <MenuItem key={m.id} item={{
                ...m,
                special: m.isSpecialty,
                price: `${m.price.toLocaleString()}원`,
                desc: m.description
              }} />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* sticky 하단 버튼 영역 */}
      <div className="flex-none bg-white border-t-[1.5px] border-[#d8d4cc] px-4 pt-4 pb-7 shadow-[0_-6px_18px_rgba(0,0,0,0.07)]">
        {existingWaiting ? (
          <>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f8e9d8] border border-[#ecd3b6] mb-3">
              <span className="text-lg">🎫</span>
              <div className="flex-1">
                <div className="font-num font-bold text-[13.5px] text-[#b56a2c]">이미 대기 중입니다</div>
                <div className="text-[11.5px] text-[#7c7972] mt-0.5">내 대기번호 {existingWaiting.waitingNumber}번 · 앞에 {booth.currentWaitingCount}팀</div>
              </div>
            </div>
            <button
              onClick={onGoTrack}
              className="w-full h-[52px] bg-[#e08a45] hover:bg-[#e08a45]/95 rounded-xl text-white font-semibold text-[15px] shadow-[0_3px_0_#b56a2c] active:translate-y-[2px] active:shadow-[0_1px_0_#b56a2c] transition-all flex items-center justify-center gap-1.5"
              style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}
            >
              🔍 내 순서 확인하기
            </button>
          </>
        ) : (
          /* 대기 접수는 QR 전용 안내 */
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#faf8f4] border border-[#e8e5de]">
            <div className="w-10 h-10 rounded-xl bg-[#efece6] flex items-center justify-center text-xl flex-none">
              📲
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-num font-semibold text-[13.5px] text-[#34322e]">현장 QR로 대기 접수</div>
              <div className="text-[11.5px] text-[#7c7972] mt-0.5 leading-[1.4]">
                부스 현장의 QR 코드를 스캔하면 바로 접수할 수 있어요.
              </div>
            </div>
          </div>
        )}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </>
  )
})

export default function BoothDetailPage() {
  const { boothId } = useParams()
  const navigate = useNavigate()

  const { data: boothDetail, isLoading, error } = useBoothDetail(parseInt(boothId))

  const stored = localStorage.getItem(`waiting_booth_${boothId}`)
  const parsedWaiting = stored ? JSON.parse(stored) : null

  const handleGoTrack = useCallback(() => {
    if (parsedWaiting) navigate(`/track/${parsedWaiting.waitingId}`)
  }, [navigate, parsedWaiting])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#faf8f4] items-center justify-center">
        <div className="text-[14px] text-[#7c7972] font-semibold">부스 정보 불러오는 중...</div>
      </div>
    )
  }

  if (error || !boothDetail) {
    return (
      <div className="flex flex-col h-full bg-[#faf8f4] items-center justify-center px-6 text-center">
        <div className="text-[36px] mb-2">🏮</div>
        <div className="text-[15px] font-bold text-[#34322e] mb-1">부스를 찾을 수 없습니다</div>
        <div className="text-[12.5px] text-[#7c7972] mb-4">해당 부스가 없거나 삭제되었을 수 있습니다.</div>
        <Btn variant="primary" onClick={() => navigate('/home')}>홈으로 가기</Btn>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#faf8f4] relative overflow-hidden">
      <BoothContent
        booth={boothDetail}
        existingWaiting={parsedWaiting}
        onGoTrack={handleGoTrack}
      />
    </div>
  )
}
