import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Btn from '../../components/common/Btn'

const SLIDES = [
  { icon: '📱', title: 'QR 하나로\n바로 대기 접수', desc: '부스 앞 QR을 스캔하면\n앱 설치 없이 바로 대기를 접수할 수 있어요.' },
  { icon: '🔔', title: '내 순서, 실시간으로 확인', desc: '화면을 보지 않아도 순서가 가까워지면\n알림으로 알려드려요.' },
  { icon: '🗺️', title: '주변 축제를\n한눈에 비교', desc: '위치 기반으로 근처 축제를 탐색하고\nAI가 딱 맞는 곳을 추천해 드려요.' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const slide = SLIDES[step]
  const isLast = step === SLIDES.length - 1

  const next = () => {
    if (isLast) navigate('/home')
    else setStep(s => s + 1)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {!isLast && (
        <div className="flex-none flex justify-end px-4 pt-3">
          <button onClick={() => navigate('/home')} className="text-[13px] text-[#a9a59c] font-num">
            건너뛰기
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-7 gap-7">
        <div className="w-52 h-52 rounded-[32px] bg-[#efece6] border-[1.5px] border-dashed border-[#d8d4cc] flex items-center justify-center text-[56px]">
          {slide.icon}
        </div>
        <div className="text-center">
          <div className="font-num font-bold text-[22px] leading-[1.3] text-[#34322e] tracking-tight whitespace-pre-line">
            {slide.title}
          </div>
          <div className="text-[14px] text-[#7c7972] mt-3 leading-[1.6] whitespace-pre-line">
            {slide.desc}
          </div>
        </div>
      </div>

      <div className="flex-none px-5 pb-7 flex flex-col items-center gap-5">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 22 : 8,
                background: i === step ? '#e08a45' : '#d8d4cc',
              }}
            />
          ))}
        </div>
        <Btn variant="primary" full onClick={next}>
          {isLast ? '시작하기 →' : '다음 →'}
        </Btn>
        <button
          onClick={() => navigate('/admin')}
          className="text-[13px] text-[#a9a59c] font-num pb-1"
        >
          부스 운영자이신가요?
        </button>
      </div>
    </div>
  )
}
