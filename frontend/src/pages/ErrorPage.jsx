import { useNavigate } from 'react-router-dom'
import Logo from '../components/common/Logo'
import Btn from '../components/common/Btn'

export default function ErrorPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-none px-4 py-3.5"><Logo /></div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
        <div className="w-24 h-24 rounded-full bg-[#fbe4e1] border-2 border-[#E5483B] flex items-center justify-center text-[40px]">⚠️</div>
        <div>
          <div className="font-num font-bold text-[20px] leading-[1.35]">QR이 유효하지 않아요</div>
          <div className="text-[13.5px] text-[#7c7972] mt-2.5 leading-[1.6]">이 QR은 만료되었거나<br />등록되지 않은 부스예요.</div>
          <div className="text-[12px] text-[#a9a59c] mt-2">부스 운영자에게 문의하거나<br />다시 스캔해 주세요.</div>
        </div>
      </div>
      <div className="flex-none px-4 pb-6 flex flex-col gap-2.5">
        <Btn variant="primary" full onClick={() => navigate('/')}>홈으로 돌아가기</Btn>
        <Btn variant="ghost" full className="text-[13px] text-[#7c7972]">문제 신고하기</Btn>
      </div>
    </div>
  )
}
