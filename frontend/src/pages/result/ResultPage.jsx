import { useNavigate, useParams } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import Btn from '../../components/common/Btn'

const CONFIGS = {
  cancelled: {
    icon: '🚫',
    iconBg: '#eceae5',
    iconBorder: '#d8d4cc',
    title: '대기가 취소되었습니다.',
    desc: '다음에 다시 만나요!\n언제든 새로 대기를 접수할 수 있어요.',
    primary: '다시 대기 접수하기',
    secondary: '부스 목록으로 돌아가기',
  },
  noshow: {
    icon: '⏱️',
    iconBg: '#fbe4e1',
    iconBorder: '#E5483B',
    title: '시간이 초과되어\n대기가 자동 취소되었습니다.',
    desc: '호출 후 일정 시간 내 미방문으로\n순서가 자동 취소되었어요.',
    primary: '다시 대기 접수하기',
    secondary: '부스 목록으로 돌아가기',
  },
  completed: {
    icon: '✅',
    iconBg: '#e6f2e6',
    iconBorder: '#4CAF50',
    title: '입장이 완료되었습니다!',
    desc: '맛있게 즐기세요 🎉\n이용해 주셔서 감사합니다.',
    primary: null,
    secondary: '부스 목록으로 돌아가기',
  },
}

export default function ResultPage() {
  const { type } = useParams()
  const navigate = useNavigate()
  const cfg = CONFIGS[type] || CONFIGS.cancelled

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 로고 헤더 */}
      <div className="flex-none flex items-center justify-center px-4 py-3.5 border-b-0">
        <Logo />
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-[44px]"
          style={{ background: cfg.iconBg, border: `2px solid ${cfg.iconBorder}` }}
        >
          {cfg.icon}
        </div>
        <div>
          <div className="font-num font-bold text-[21px] leading-[1.35] whitespace-pre-line">{cfg.title}</div>
          <div className="text-[14px] text-[#7c7972] mt-2.5 leading-[1.55] whitespace-pre-line">{cfg.desc}</div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex-none px-4 pb-6 flex flex-col gap-2.5">
        {cfg.primary && (
          <Btn variant="primary" full onClick={() => navigate('/booth/1')}>
            {cfg.primary}
          </Btn>
        )}
        {cfg.secondary && (
          <Btn variant="secondary" full onClick={() => navigate('/booths/1')}>
            {cfg.secondary}
          </Btn>
        )}
      </div>
    </div>
  )
}
