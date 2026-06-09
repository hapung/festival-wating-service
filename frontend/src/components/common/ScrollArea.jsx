import { useRef, useState, useCallback } from 'react'

/**
 * 커스텀 스크롤 인디케이터
 * - 네이티브 스크롤바 숨김
 * - 스크롤 시 컨테이너 오른쪽 끝에 얇은 pill 인디케이터 페이드인, 1.4s 후 페이드아웃
 * - 콘텐츠 너비에 영향 없음 (overlay)
 *
 * Usage:
 *   <ScrollArea className="flex-1 min-h-0" innerClassName="flex flex-col gap-3 p-4">
 *     {children}
 *   </ScrollArea>
 */
export default function ScrollArea({ children, className = '', innerClassName = '' }) {
  const viewRef  = useRef(null)
  const timerRef = useRef(null)

  const [visible, setVisible] = useState(false)
  const [thumb,   setThumb]   = useState({ h: 30, top: 0 })

  const onScroll = useCallback(() => {
    const el = viewRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight <= clientHeight + 2) return

    const ratio    = clientHeight / scrollHeight
    const thumbH   = Math.max(ratio * 100, 12)
    const maxTop   = 100 - thumbH
    const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * maxTop

    setThumb({ h: thumbH, top: thumbTop })
    setVisible(true)

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 1400)
  }, [])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 실제 스크롤 영역 */}
      <div
        ref={viewRef}
        onScroll={onScroll}
        className={`absolute inset-0 overflow-y-auto ${innerClassName}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* 인디케이터 트랙 — 컨테이너 오른쪽 끝에 고정, 콘텐츠 너비와 무관 */}
      <div
        className="absolute top-3 bottom-3 rounded-full pointer-events-none transition-all duration-300"
        style={{
          right: '3px',
          width: '3px',
          background: visible ? 'rgba(216,212,204,0.35)' : 'transparent',
        }}
      >
        <div
          className="absolute w-full rounded-full"
          style={{
            height:     `${thumb.h}%`,
            top:        `${thumb.top}%`,
            background: '#b8b3ab',
            opacity:    visible ? 1 : 0,
            transition: 'opacity 0.25s, top 0.08s linear',
          }}
        />
      </div>
    </div>
  )
}
