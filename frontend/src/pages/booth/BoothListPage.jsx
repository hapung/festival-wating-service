import { useNavigate, useParams } from 'react-router-dom'
import AppBar from '../../components/common/AppBar'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import { useFestivalBooths, useFestivals } from '../../api/queries'
import ScrollArea from '../../components/common/ScrollArea'
import { getImageUrl } from '../../api/client'

function BoothRow({ booth }) {
  const navigate = useNavigate()
  const id = booth.boothId ?? booth.id
  return (
    <Card
      className="p-3.5 flex gap-3 items-center cursor-pointer active:scale-[.98] transition-transform"
      onClick={() => navigate(`/booth/${id}`)}
    >
      {booth.imageUrl ? (
        <img src={getImageUrl(booth.imageUrl)} alt={booth.name} className="w-14 h-14 rounded-xl object-cover flex-none" />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-[#efece6] border border-[#e8e5de] flex-none flex items-center justify-center text-2xl">
          🏮
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-num font-bold text-[15px]">{booth.name}</div>
        <div className="text-[12px] text-[#7c7972] mt-1">
          {booth.locationDescription}
        </div>
      </div>
      {booth.currentWaitingCount > 0 ? (
        <div className="flex flex-col items-center flex-none">
          <span className="font-num font-bold text-[26px] leading-none text-[#b56a2c]">
            {booth.currentWaitingCount}
          </span>
          <span className="text-[10px] text-[#7c7972]">팀 대기</span>
        </div>
      ) : (
        <Badge tone="green" className="flex-none">바로 입장 가능</Badge>
      )}
    </Card>
  )
}

function SkeletonRow() {
  return (
    <div className="p-3.5 flex gap-3 items-center bg-white rounded-[14px] border border-[#e8e5de]">
      <div className="w-14 h-14 rounded-xl bg-[#efece6] animate-pulse flex-none" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-[#efece6] rounded animate-pulse w-2/3" />
        <div className="h-3 bg-[#efece6] rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}

export default function BoothListPage() {
  const { festivalId } = useParams()
  const { data: booths, isLoading, error } = useFestivalBooths(festivalId)
  const { data: festivals } = useFestivals()

  const festival = festivals?.find(f => f.festivalId === parseInt(festivalId))
  const title = festival?.name ?? '부스 목록'
  const period = festival
    ? `${festival.startDate.slice(5).replace('-', '.')} – ${festival.endDate.slice(5).replace('-', '.')}`
    : ''

  return (
    <div className="flex flex-col h-full bg-[#faf8f4]">
      <AppBar back backTo="/home" title={title} sub={period} />

      <ScrollArea className="flex-1 min-h-0" innerClassName="px-4 py-4 flex flex-col gap-3">
        {/* 상단 카운트 + 정렬 */}
        <div className="flex justify-between items-center">
          <span className="font-num font-bold text-[14px]">
            부스{' '}
            <span className="text-[#e08a45]">{isLoading ? '-' : (booths?.length ?? 0)}</span>
          </span>
          <span className="text-[12px] text-[#7c7972]">대기 적은 순 ⌄</span>
        </div>

        {/* 로딩 스켈레톤 */}
        {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}

        {/* 에러 */}
        {error && (
          <div className="text-center py-12 text-[14px] text-[#7c7972]">
            부스 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        )}

        {/* 목록 */}
        {booths?.map(b => <BoothRow key={b.boothId ?? b.id} booth={b} />)}

        {/* 빈 상태 */}
        {!isLoading && !error && booths?.length === 0 && (
          <div className="text-center py-12 text-[14px] text-[#7c7972]">
            등록된 부스가 없어요.
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
