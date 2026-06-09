import { useNavigate } from 'react-router-dom'

export default function AppBar({ title, sub, back, backTo, right, center }) {
  const navigate = useNavigate()
  const handleBack = () => {
    if (backTo) navigate(backTo, { replace: true })
    else navigate(-1)
  }
  return (
    <div className="flex-none flex items-center gap-2.5 px-4 py-3.5 bg-[#ffffff] border-b border-[#e8e5de]">
      {back && (
        <button
          onClick={handleBack}
          className="w-8 h-8 border-[1.5px] border-[#d8d4cc] rounded-lg flex items-center justify-center text-[#7c7972] flex-none"
        >
          ‹
        </button>
      )}
      <div className={`flex-1 min-w-0 ${center ? 'text-center' : ''}`}>
        <h1 className="font-num font-semibold text-[17px] text-[#34322e] m-0 tracking-tight">{title}</h1>
        {sub && <div className="text-[12px] text-[#7c7972] mt-0.5">{sub}</div>}
      </div>
      {right && <div className="flex-none">{right}</div>}
    </div>
  )
}
