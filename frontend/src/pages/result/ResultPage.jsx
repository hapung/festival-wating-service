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
    secondary: '홈으로 돌아가기',
  },
  noshow: {
    icon: '⏱️',
    iconBg: '#fbe4e1',
    iconBorder: '#E5483B',
    title: '시간이 초과되어\n대기가 자동 취소되었습니다.',
    desc: '호출 후 일정 시간 내 미방문으로\n순서가 자동 취소되었어요.',
    primary: '다시 대기 접수하기',
    secondary: '홈으로 돌아가기',
  },
  completed: {
    icon: '🎉',
    iconBg: '#f8e9d8',
    iconBorder: '#e08a45',
    title: '지금 입장해 주세요!',
    desc: '매장 앞으로 방문해 주세요 😊\n즐거운 시간 보내세요!',
    primary: null,
    secondary: '홈으로 돌아가기',
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
      <div className="flex-none px-4 pb-6 flex flex-row gap-2.5">
        {cfg.secondary && (
          <Btn variant="secondary" full onClick={() => navigate('/home')}>
            {cfg.secondary}
          </Btn>
        )}
        {cfg.primary && (
          <Btn variant="primary" full onClick={() => navigate('/booth/1')}>
            {cfg.primary}
          </Btn>
        )}
      </div>
    </div>
  )
}
