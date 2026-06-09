const VARIANTS = {
  primary:   'bg-[#e08a45] border-[#b56a2c] text-white shadow-[0_2px_0_#b56a2c]',
  secondary: 'bg-white border-[#34322e] text-[#34322e]',
  ghost:     'bg-transparent border-[#d8d4cc] text-[#7c7972]',
  danger:    'bg-white border-[#E5483B] text-[#E5483B]',
  disabled:  'bg-[#efece6] border-[#e8e5de] text-[#a9a59c] opacity-65 cursor-not-allowed shadow-none',
}

export default function Btn({ variant = 'secondary', disabled, full, sm, children, onClick, className = '', style }) {
  const v = disabled ? 'disabled' : variant
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
        flex items-center justify-center gap-1.5 border-[1.5px] rounded-xl cursor-default
        font-num font-semibold tracking-tight whitespace-nowrap
        ${sm ? 'min-h-[34px] text-[13px] rounded-lg px-3' : 'min-h-[48px] text-[15px] px-4'}
        ${full ? 'w-full' : ''}
        ${VARIANTS[v]}
        ${className}
      `}
      style={style}
    >
      {children}
    </button>
  )
}
