const STEPS = ['접수완료', '순서 임박', '호출됨', '입장 완료']

export default function StepBar({ active = 0, danger = false }) {
  return (
    <div className="flex items-start px-1">
      {STEPS.map((label, i) => {
        const done = i < active
        const cur  = i === active
        const ringColor = cur
          ? (danger ? '#E5483B' : '#e08a45')
          : done ? '#e08a45' : '#d8d4cc'
        const bg = cur
          ? (danger ? '#E5483B' : '#e08a45')
          : done ? '#f8e9d8' : '#fff'
        const textColor = cur
          ? (danger ? '#E5483B' : '#b56a2c')
          : done ? '#7c7972' : '#a9a59c'

        return (
          <div key={i} className="flex items-start" style={{ flex: i < 3 ? '1' : 'none' }}>
            <div className="flex flex-col items-center gap-1.5 w-16">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-num font-bold text-[13px] flex-none"
                style={{
                  border: `2px solid ${ringColor}`,
                  background: bg,
                  color: cur ? '#fff' : done ? '#b56a2c' : '#a9a59c',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className="text-[10.5px] text-center leading-tight font-num"
                style={{ color: textColor, fontWeight: cur ? 700 : 400 }}
              >
                {label}
              </span>
            </div>
            {i < 3 && (
              <div
                className="flex-1 h-0.5 mt-4 rounded-sm"
                style={{ background: i < active ? '#e08a45' : '#d8d4cc' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
