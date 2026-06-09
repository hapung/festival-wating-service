export default function Logo({ size = 'md' }) {
  const textSize = size === 'lg' ? 'text-2xl' : 'text-base'
  return (
    <div className={`font-num font-bold ${textSize} flex items-center gap-1.5 tracking-tight`}>
      <span className="w-5 h-5 rounded-[6px] bg-[#e08a45] inline-block" />
      <span className="text-[#34322e]">festival</span>
      <span className="text-[#e08a45]">·</span>
      <span className="text-[#34322e]">waiting</span>
    </div>
  )
}
