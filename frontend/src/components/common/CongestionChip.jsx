const COLORS = {
  green:  '#4CAF50',
  yellow: '#F0B400',
  red:    '#E5483B',
}
const LABELS = {
  green: '여유',
  yellow: '보통',
  red: '혼잡',
}

export default function CongestionChip({ level, label }) {
  return (
    <span className="inline-flex items-center gap-1 h-[26px] px-2 rounded-lg text-[12px] text-[#7c7972] bg-[#f6f4ef] border border-[#e8e5de]">
      <span className="w-2 h-2 rounded-full flex-none" style={{ background: COLORS[level] }} />
      {label || LABELS[level]}
    </span>
  )
}
