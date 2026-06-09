export default function FWInput({ placeholder, icon, dim, search, value, numeric, style, onChange, onKeyDown, type = 'text' }) {
  return (
    <div
      className={`flex items-center gap-2 min-h-[48px] border-[1.5px] rounded-xl px-3.5 bg-white text-[14px]
        ${search ? 'border-[#34322e] shadow-[0_2px_8px_rgba(0,0,0,0.05)]' : 'border-[#d8d4cc]'}
        ${dim ? 'opacity-40 grayscale-[30%]' : ''}
      `}
      style={style}
    >
      {icon && <span className="text-[#a9a59c] flex">{icon}</span>}
      {onChange ? (
        <input
          type={type}
          value={value || ''}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={onKeyDown}
          inputMode={numeric ? 'numeric' : undefined}
          className={`flex-1 bg-transparent outline-none placeholder:text-[#a9a59c]
            ${value ? 'text-[#34322e]' : 'text-[#a9a59c]'}
            ${numeric ? 'font-num font-semibold' : ''}
          `}
        />
      ) : (
        <span className={`flex-1 ${value ? 'text-[#34322e]' : 'text-[#a9a59c]'} ${numeric ? 'font-num font-semibold' : ''}`}>
          {value || placeholder}
        </span>
      )}
      {numeric && <span className="text-[#a9a59c] text-lg">⌨</span>}
    </div>
  )
}
