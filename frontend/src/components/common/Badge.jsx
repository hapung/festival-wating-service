const TONE = {
  gray:   'bg-[#eceae5] border-[#d8d4cc] text-[#7c7972]',
  orange: 'bg-[#f8e9d8] border-[#e08a45] text-[#b56a2c]',
  green:  'bg-[#e6f2e6] border-[#4CAF50] text-[#2f7a33]',
  yellow: 'bg-[#fbf0cf] border-[#F0B400] text-[#9a7400]',
  red:    'bg-[#fbe4e1] border-[#E5483B] text-[#b3372d]',
}

export default function Badge({ tone = 'gray', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full font-num text-[12px] font-semibold border whitespace-nowrap ${TONE[tone]} ${className}`}>
      {children}
    </span>
  )
}
