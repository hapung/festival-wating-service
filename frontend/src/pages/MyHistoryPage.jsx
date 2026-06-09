import { useNavigate } from 'react-router-dom'
import AppBar from '../components/common/AppBar'
import Card from '../components/common/Card'
import Badge from '../components/common/Badge'
import ScrollArea from '../components/common/ScrollArea'

const HISTORY = [
  { booth: '할매 손칼국수', festival: '망원 한강 야시장', date: '6.8', no: 15, status: 'COMPLETED' },
  { booth: '제주 흑돼지 꼬치', festival: '망원 한강 야시장', date: '6.8', no: 22, status: 'CANCELLED' },
  { booth: '춘천 닭갈비 트럭', festival: '연남 수제 먹거리 페어', date: '6.5', no: 8, status: 'COMPLETED' },
  { booth: '전통 호떡 & 어묵', festival: '연남 수제 먹거리 페어', date: '6.5', no: 31, status: 'COMPLETED' },
]
const TONE  = { WAITING: 'gray', CALLED: 'orange', COMPLETED: 'green', CANCELLED: 'red' }
const LABEL = { WAITING: '대기중', CALLED: '호출됨', COMPLETED: '입장완료', CANCELLED: '취소' }
const TABS = ['전체', '대기중', '완료', '취소']

export default function MyHistoryPage() {
  return (
    <div className="flex flex-col h-full bg-[#faf8f4]">
      <AppBar back title="내 대기 이력" />
      {/* 탭 */}
      <div className="flex bg-white border-b border-[#e8e5de] px-4">
        {TABS.map((t, i) => (
          <div key={i} className="flex-1 text-center py-2.5 text-[13.5px] font-num"
            style={{ fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#b56a2c' : '#7c7972', borderBottom: i === 0 ? '2.5px solid #e08a45' : '2.5px solid transparent' }}>
            {t}
          </div>
        ))}
      </div>
      <ScrollArea className="flex-1 min-h-0" innerClassName="px-4 py-3.5 flex flex-col gap-2.5">
        {HISTORY.map((r, i) => (
          <Card key={i} className="p-3.5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none text-xl"
              style={{ background: r.status === 'COMPLETED' ? '#e6f2e6' : '#eceae5', border: '1px solid #e8e5de' }}>
              {r.status === 'COMPLETED' ? '✅' : '🚫'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-num font-bold text-[14px]">{r.booth}</div>
              <div className="text-[11.5px] text-[#7c7972] mt-0.5">{r.festival} · {r.date} · {r.no}번</div>
            </div>
            <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
          </Card>
        ))}
      </ScrollArea>
    </div>
  )
}
