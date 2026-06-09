import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { useRecommendFestivals, useFestivalBooths, useBoothDetail, useAiCurate, useFestivals, useMyActiveWaitings } from '../../api/queries'
import ScrollArea from '../../components/common/ScrollArea'
import { getImageUrl } from '../../api/client'

// ── 주소 → 좌표 변환 훅 (캐시 포함) ─────────────────────────────
const _geoCache = {}   // 모듈 레벨 캐시: 같은 주소 반복 geocoding 방지

function useGeocodedFestivals(festivals) {
  const [geocoded, setGeocoded] = useState([])
  const prevIdsRef = useRef('')

  useEffect(() => {
    if (!festivals?.length) { setGeocoded([]); return }

    // 같은 festivals 목록이면 재실행 방지
    const ids = festivals.map(f => f.festivalId).join(',')
    if (ids === prevIdsRef.current && geocoded.length === festivals.length) return
    prevIdsRef.current = ids

    const kakao = window.kakao
    if (!kakao?.maps?.services) { setGeocoded(festivals); return }

    const geocoder = new kakao.maps.services.Geocoder()

    Promise.all(
      festivals.map(f => new Promise(resolve => {
        if (f.lat && f.lng) { resolve(f); return }
        if (_geoCache[f.location]) { resolve({ ...f, ..._geoCache[f.location] }); return }
        geocoder.addressSearch(f.location, (result, status) => {
          if (status === kakao.maps.services.Status.OK && result[0]) {
            const coords = { lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) }
            _geoCache[f.location] = coords
            resolve({ ...f, ...coords })
          } else {
            resolve(f)
          }
        })
      }))
    ).then(setGeocoded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festivals])

  return geocoded
}

// ── 디자인 토큰 (wireframe-kit 기준) ──────────────────────────────
// --wf-paper:#fff  --wf-paper2:#faf8f4  --wf-ink:#34322e
// --wf-ink2:#7c7972  --wf-ink3:#a9a59c
// --wf-line:#d8d4cc  --wf-line2:#e8e5de  --wf-fill:#efece6  --wf-fill2:#f6f4ef
// --wf-accent:#e08a45  --wf-accent-ink:#b56a2c
// --wf-green:#4CAF50  --wf-yellow:#F0B400  --wf-red:#E5483B

// ── 공통 서브컴포넌트 ─────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-[7px] font-semibold text-[16px] tracking-[-0.3px]"
      style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif", color: '#34322e' }}>
      <span className="w-[18px] h-[18px] rounded-[6px] bg-[#e08a45] inline-block flex-none" />
      festival<span className="text-[#e08a45]">·</span>waiting
    </div>
  )
}

function SearchInput({ value, onChange, placeholder = '어떤 축제를 찾고 계세요?', autoFocus, className = '', size = 'normal', onKeyDown, onFocus }) {
  const heightClass = size === 'small' ? 'min-h-[44px] text-[14px]' : 'min-h-[56px] text-[15px]'
  const iconSize = size === 'small' ? 'text-[14px]' : 'text-[18px]'
  const clearSize = size === 'small' ? 'text-[18px]' : 'text-[22px]'

  return (
    <div className={`flex items-center gap-[12px] ${heightClass} border-[2px] border-[#34322e] rounded-[18px] px-[16px] bg-white ${className}`}
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
      <span className={`text-[#e08a45] flex-none ${iconSize}`}>✦</span>
      <input
        autoFocus={autoFocus}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1 outline-none bg-transparent text-[#34322e] placeholder:text-[#a9a59c] w-full min-w-0 font-medium"
        style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}
      />
      {value && (
        <button onClick={() => onChange({ target: { value: '' } })}
          className={`flex-none text-[#a9a59c] ${clearSize} leading-none active:scale-90 transition-transform`}>×</button>
      )}
    </div>
  )
}

function FilterInput({ icon, value, placeholder, onClick }) {
  return (
    <div onClick={onClick} className="flex items-center gap-[10px] min-h-[50px] border border-[#d8d4cc] rounded-[16px] px-[16px] bg-white text-[14px] text-[#a9a59c] cursor-pointer active:bg-gray-50 transition-colors">
      {icon && <span className="flex-none">{icon}</span>}
      <span className={value ? 'text-[#34322e]' : 'text-[#a9a59c]'}>{value || placeholder}</span>
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <div className="text-[12px] text-[#7c7972] font-semibold mb-[6px]"
      style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
      {children}
    </div>
  )
}

// SVG 마커 이미지 생성 (핀만, 툴팁은 CustomOverlayMap으로 별도 처리)
function makeMarkerSvg(level, isActive) {
  const FILL = { green: '#4CAF50', yellow: '#F0B400', red: '#E5483B' }
  const DARK = { green: '#2e7d32', yellow: '#a07800', red: '#9e1b10' }
  const fill = FILL[level] || '#4CAF50'
  const dark = DARK[level] || '#2e7d32'

  const r = isActive ? 17 : 13
  const pad = 3
  const tailW = isActive ? 9 : 6
  const tailH = isActive ? 15 : 11
  const w = (r + pad) * 2
  const bodyH = (r + pad) * 2
  const h = bodyH + tailH
  const cx = r + pad
  const cy = r + pad
  const inner = Math.round(r * 0.38)

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`,
    isActive ? `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="${dark}" fill-opacity="0.15"/>` : '',
    `<ellipse cx="${cx}" cy="${h - 2}" rx="${tailW + 1}" ry="2.5" fill="rgba(0,0,0,0.13)"/>`,
    `<polygon points="${cx},${h} ${cx - tailW},${bodyH - 2} ${cx + tailW},${bodyH - 2}" fill="${fill}"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="white" stroke-width="3"/>`,
    isActive ? `<circle cx="${cx}" cy="${cy}" r="${r - 1.5}" fill="none" stroke="${dark}" stroke-width="2"/>` : '',
    `<circle cx="${cx}" cy="${cy}" r="${inner}" fill="white" fill-opacity="0.9"/>`,
    `</svg>`,
  ].join('')

  return {
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(parts)}`,
    size: { width: w, height: h },
    options: { offset: { x: cx, y: h } },
  }
}

const RADIUS_TO_LEVEL = (km) => {
  if (km <= 5) return 6
  if (km <= 10) return 7
  if (km <= 20) return 8
  if (km <= 30) return 9
  return 10
}

function KakaoMapArea({ pins = [], empty, noResults, onZoomIn, onZoomOut, mapRef, onMarkerClick, centerCoords, radiusKm }) {
  const center = centerCoords || { lat: 37.5568, lng: 126.9242 }
  const level = radiusKm ? RADIUS_TO_LEVEL(radiusKm) : 7
  const [activePin, setActivePin] = useState(null)

  // 위치가 바뀌면 지도 이동
  useEffect(() => {
    if (!centerCoords || !mapRef?.current) return
    const kakao = window.kakao
    if (!kakao?.maps) return
    mapRef.current.setCenter(new kakao.maps.LatLng(centerCoords.lat, centerCoords.lng))
  }, [centerCoords, mapRef])

  // 핀이 생기면 모든 마커가 보이도록 bounds 자동 맞춤
  useEffect(() => {
    const validPins = pins.filter(p => p.lat && p.lng)
    if (!validPins.length || !mapRef?.current) return
    const kakao = window.kakao
    if (!kakao?.maps) return

    setTimeout(() => {
      if (!mapRef.current) return
      if (validPins.length === 1) {
        mapRef.current.setCenter(new kakao.maps.LatLng(validPins[0].lat, validPins[0].lng))
        mapRef.current.setLevel(6)
      } else {
        const bounds = new kakao.maps.LatLngBounds()
        validPins.forEach(p => bounds.extend(new kakao.maps.LatLng(p.lat, p.lng)))
        mapRef.current.setBounds(bounds, 70)
      }
    }, 100)
  }, [pins, mapRef])

  const handleMarkerClick = (p, i) => {
    if (!p.festival) return
    setActivePin(prev => prev === i ? null : i)
  }

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden w-full h-full rounded-[14px]">
      <Map
        center={center}
        isPanto={true}
        level={level}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        onClick={() => setActivePin(null)}
      >
        {!empty && pins.map((p, i) => {
          const isActive = activePin === i
          return (
            <MapMarker
              key={i}
              position={{ lat: p.lat, lng: p.lng }}
              image={makeMarkerSvg(p.level, isActive)}
              onClick={() => handleMarkerClick(p, i)}
              zIndex={isActive ? 20 : 10}
            />
          )
        })}

        {/* 말풍선 툴팁 — xAnchor/yAnchor로 마커 정중앙 위에 정렬 */}
        {activePin !== null && pins[activePin]?.festival && (() => {
          const p = pins[activePin]
          const DOT = { green: '#4CAF50', yellow: '#F0B400', red: '#E5483B' }
          return (
            <CustomOverlayMap
              key={`bubble-${activePin}`}
              position={{ lat: p.lat, lng: p.lng }}
              xAnchor={0.5}
              yAnchor={1}
              zIndex={50}
            >
              {/* paddingBottom = 활성 마커 높이(55px) + 여백(6px) */}
              <div style={{ paddingBottom: '61px', textAlign: 'center' }}>
                <div className="fw-map-bubble" style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'white',
                  border: '1.5px solid #e8e5de',
                  borderRadius: '12px',
                  padding: '7px 12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,.13)',
                  whiteSpace: 'nowrap',
                  fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif",
                  pointerEvents: 'none',
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: DOT[p.level] || '#4CAF50',
                  }} />
                  <span style={{
                    fontSize: '12px', fontWeight: 700, color: '#34322e',
                    maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {p.festival.name}
                  </span>
                  {/* 아래 화살표 테두리 */}
                  <span style={{
                    position: 'absolute', bottom: '-7px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '7px solid #e8e5de',
                  }} />
                  {/* 아래 화살표 흰 fill */}
                  <span style={{
                    position: 'absolute', bottom: '-5.5px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid white',
                  }} />
                </div>
              </div>
            </CustomOverlayMap>
          )
        })()}
      </Map>

      {/* 줌 버튼 */}
      <div className="absolute right-3 bottom-3 flex flex-col bg-white rounded-xl border border-[#d8d4cc] overflow-hidden shadow-md z-10">
        <button
          onClick={onZoomIn}
          className="w-9 h-9 flex items-center justify-center text-[#7c7972] border-b border-[#e8e5de] text-[20px] font-light active:bg-[#f6f4ef] transition-colors"
        >＋</button>
        <button
          onClick={onZoomOut}
          className="w-9 h-9 flex items-center justify-center text-[#7c7972] text-[20px] font-light active:bg-[#f6f4ef] transition-colors"
        >－</button>
      </div>

      {empty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#a9a59c] bg-white/50 backdrop-blur-sm" />
        </div>
      )}
      {noResults && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
            <div className="text-[28px]">🔍</div>
            <div className="text-[13px] font-semibold text-[#34322e]">주변에 축제가 없어요</div>
            <div className="text-[11.5px] text-[#a9a59c]">조건을 바꿔서 다시 검색해 보세요</div>
          </div>
        </div>
      )}
    </div>
  )
}

function CongestionChip({ level, label }) {
  const DOT = { green: '#4CAF50', yellow: '#F0B400', red: '#E5483B' }
  return (
    <span className="inline-flex items-center gap-[5px] h-[26px] px-[9px] rounded-[8px] text-[12px] text-[#7c7972] bg-[#f6f4ef] border border-[#e8e5de]">
      <span className="w-[9px] h-[9px] rounded-full flex-none" style={{ background: DOT[level] }} />
      {label}
    </span>
  )
}

function BoothImage({ src, alt }) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <div className="relative h-[110px] w-full rounded-2xl overflow-hidden mb-3 bg-[#efece6]">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#efece6]" />}
      <img
        src={src} alt={alt}
        onLoad={() => setLoaded(true)}
        className="h-full w-full object-cover transition-opacity duration-500"
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  )
}

function Badge({ children, tone = 'default', className = '' }) {
  const styles = {
    default: 'bg-[#eceae5] border-[#d8d4cc] text-[#7c7972]',
    green: 'bg-[#e6f2e6] border-[#4CAF50]/30 text-[#2f7a33]',
    gray: 'bg-[#f6f4ef] border-[#d8d4cc] text-[#7c7972]'
  }[tone] || 'bg-[#eceae5] border-[#d8d4cc] text-[#7c7972]'

  return (
    <span className={`inline-flex items-center h-[24px] px-[10px] rounded-full text-[12px] font-semibold border whitespace-nowrap ${styles} ${className}`}
      style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
      {children}
    </span>
  )
}

function FestivalCard({ ai, name, period, dist, nearbySpots = [], onClick }) {
  const touristSpots = nearbySpots
  return (
    <div className={`relative bg-white border-[1.5px] border-[#d8d4cc] rounded-[14px] p-[13px] cursor-pointer active:scale-[.98] transition-transform ${ai ? 'mt-3' : ''}`}
      style={{ boxShadow: '0 1px 0 rgba(0,0,0,.02), 0 6px 16px rgba(0,0,0,.05)' }}
      onClick={onClick}>
      {ai && (
        <div className="absolute -top-[11px] left-[12px] text-white text-[11px] font-semibold px-[9px] py-[3px] rounded-[10px_10px_10px_2px]"
          style={{ background: '#e08a45', boxShadow: '0 2px 6px rgba(180,106,44,.35)', fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
          ✦ {ai}
        </div>
      )}
      <div className={`flex justify-between items-start ${ai ? 'mt-[6px]' : ''}`}>
        <div>
          <div className="font-bold text-[15px] text-[#34322e]"
            style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>{name}</div>
          <div className="text-[11.5px] text-[#7c7972] mt-[3px]">{period}</div>
        </div>
        <Badge>📍 {dist}</Badge>
      </div>

      {/* 인근 관광지 혼잡도 리스트 */}
      {touristSpots && touristSpots.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#e8e5de] flex flex-col gap-1.5">
          <div className="text-[10px] text-[#a9a59c] font-semibold tracking-wide flex items-center gap-1">
            <span>🌲</span> 주변 관광지 실시간 혼잡도
          </div>
          {touristSpots.map((s, idx) => {
            const isCongested = s.congestionRate > 80
            const isModerate = s.congestionRate > 40
            const dotColor = isCongested ? '#E5483B' : isModerate ? '#F0B400' : '#4CAF50'
            const textColor = isCongested ? '#E5483B' : isModerate ? '#b56a2c' : '#2f7a33'
            const bgColor = isCongested ? '#fbe4e1' : isModerate ? '#fbf0cf' : '#e6f2e6'

            return (
              <div key={idx} className="flex justify-between items-center text-[12px] bg-[#faf8f4] px-2.5 py-1.5 rounded-lg border border-[#e8e5de]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: dotColor }} />
                  <span className="font-medium text-[#34322e] truncate">{s.name}</span>
                  <span className="text-[10px] text-[#7c7972] font-num">{s.distanceKm}km</span>
                </div>
                <span className="text-[10.5px] font-semibold font-num px-2 py-0.5 rounded-full flex-none" style={{ background: bgColor, color: textColor }}>
                  {s.level ?? (s.congestionRate > 70 ? '혼잡' : s.congestionRate > 40 ? '보통' : '쾌적')} ({s.congestionRate}%)
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 위치 선택 컴포넌트 ────────────────────────────────────────────

function LocationPicker({ current, onSelect }) {
  const [input, setInput] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')

  const geocodeAndSelect = (address) => {
    const kakao = window.kakao
    if (!kakao?.maps?.services) { setGeoError('지도 서비스를 불러오는 중입니다.'); return }
    setGeoLoading(true)
    setGeoError('')
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.addressSearch(address, (result, status) => {
      setGeoLoading(false)
      if (status === kakao.maps.services.Status.OK && result[0]) {
        onSelect(address, { lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) })
      } else {
        // addressSearch 실패 시 keywordSearch 시도
        const places = new kakao.maps.services.Places()
        places.keywordSearch(address, (res, st) => {
          if (st === kakao.maps.services.Status.OK && res[0]) {
            onSelect(address, { lat: parseFloat(res[0].y), lng: parseFloat(res[0].x) })
          } else {
            setGeoError('위치를 찾을 수 없습니다. 다시 입력해 주세요.')
          }
        })
      }
    })
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) { setGeoError('이 기기에서는 현재 위치를 지원하지 않습니다.'); return }
    setGeoLoading(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false)
        onSelect('현재 위치', { lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => { setGeoLoading(false); setGeoError('위치 권한을 허용해 주세요.') },
      { timeout: 8000 }
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 직접 입력 */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setGeoError('') }}
          onKeyDown={e => e.key === 'Enter' && input.trim() && geocodeAndSelect(input.trim())}
          placeholder="주소 또는 장소명 입력"
          className="flex-1 h-[44px] border-[1.5px] border-[#d8d4cc] rounded-xl px-3.5 text-[14px] text-[#34322e] outline-none focus:border-[#e08a45] bg-white placeholder:text-[#c4c0b8]"
        />
        <button
          onClick={() => input.trim() && geocodeAndSelect(input.trim())}
          disabled={!input.trim() || geoLoading}
          className="h-[44px] px-4 rounded-xl bg-[#e08a45] text-white text-[13px] font-semibold disabled:opacity-40 flex-none"
        >
          {geoLoading ? '…' : '확인'}
        </button>
      </div>

      {geoError && <div className="text-[12px] text-[#E5483B] px-1">{geoError}</div>}

      {/* 현재 위치 */}
      <button
        onClick={handleCurrentLocation}
        disabled={geoLoading}
        className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#f0f7ff] border border-[#c5dcf5] text-[13.5px] font-semibold text-[#2b6cb0] disabled:opacity-40"
      >
        <span className="text-[18px]">📡</span> 현재 위치 사용
      </button>

    </div>
  )
}

// ── 바텀 시트 컴포넌트 ─────────────────────────────────────────────

function BottomSheet({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] z-50 flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            <div className="flex-none pt-3 pb-4 px-4 flex flex-col items-center">
              <div className="w-[38px] h-[4px] rounded-sm bg-[#d8d4cc] mb-4" />
              <div className="w-full flex justify-between items-center">
                <span className="font-bold text-[16px] text-[#34322e]">{title}</span>
                <button onClick={onClose} className="text-[#a9a59c] text-[20px] leading-none">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto nice-scroll px-4 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── 상태별 화면 ───────────────────────────────────────────────────

const CARD_GRADIENTS = [
  ['#f4845f', '#e8573a'],
  ['#e08a45', '#c46d2c'],
  ['#6dbf8b', '#3d9e65'],
  ['#5b9bd5', '#3478b8'],
  ['#a67bc5', '#7c52a8'],
  ['#e06b8a', '#c44068'],
  ['#5bbfbf', '#3a9898'],
]

const CARD_ICONS = ['🎪', '🎆', '🌸', '🍱', '🎵', '🌺', '🎠', '🥁', '🌾', '🎡']

function useVisibleFestivalCount() {
  const [count, setCount] = React.useState(() => window.innerHeight >= 700 ? 6 : window.innerHeight >= 680 ? 4 : 2)
  React.useEffect(() => {
    const update = () => setCount(window.innerHeight >= 700 ? 6 : window.innerHeight >= 680 ? 4 : 2)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return count
}

function ActiveFestivalCards({ onFestivalClick }) {
  const { data: festivals = [], isLoading } = useFestivals()
  const maxCount = useVisibleFestivalCount()
  const active = festivals.slice(0, maxCount)

  const dDays = (endDate) => {
    if (!endDate) return ''
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return '종료'
    if (diff === 0) return '오늘 마감'
    return `D-${diff}`
  }

  if (isLoading) return (
    <div className="grid grid-cols-2 gap-2.5 px-5">
      {[...Array(maxCount)].map((_, i) => (
        <div key={i} className="h-[90px] rounded-[22px] bg-[#efece6] animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )

  if (active.length === 0) return (
    <div className="mx-5 rounded-3xl bg-[#f6f4ef] border border-[#e8e5de] flex flex-col items-center justify-center py-10 gap-2">
      <div className="text-[32px]">🎪</div>
      <div className="text-[13px] font-semibold text-[#7c7972]">등록된 축제가 없어요</div>
      <div className="text-[11.5px] text-[#a9a59c]">아래 검색으로 주변 축제를 찾아보세요</div>
    </div>
  )

  return (
    <div className="grid grid-cols-2 gap-2.5 px-5">
      {active.map((f, idx) => {
        const [from, to] = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]
        const icon = CARD_ICONS[idx % CARD_ICONS.length]
        const dd = dDays(f.endDate)
        const isUrgent = dd === '오늘 마감' || dd === 'D-1' || dd === 'D-2'
        return (
          <motion.button
            key={f.festivalId}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.32, delay: idx * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onFestivalClick(f)}
            className="relative h-[90px] rounded-[22px] overflow-hidden flex flex-col justify-between p-3 text-left"
            style={{
              background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
              boxShadow: `0 4px 14px ${from}50`,
            }}
          >
            {/* 배경 장식 원 */}
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-20"
              style={{ background: 'white' }} />
            <div className="absolute -right-1 -bottom-4 w-10 h-10 rounded-full opacity-10"
              style={{ background: 'white' }} />

            {/* 상단: 아이콘 + D-day */}
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[20px] leading-none">{icon}</span>
              <span className={`text-[9.5px] font-num font-bold px-1.5 py-0.5 rounded-full leading-none ${isUrgent ? 'bg-white/50 text-white' : 'bg-white/25 text-white/90'
                }`}>
                {dd}
              </span>
            </div>

            {/* 하단: 축제명 + 지역 */}
            <div className="relative z-10">
              <div className="text-white font-bold text-[12px] leading-[1.3] line-clamp-1"
                style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
                {f.name}
              </div>
              <div className="text-white/70 text-[10px] font-num mt-0.5 line-clamp-1">
                {f.location?.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

// ── 홈 메인용 축제 부스 시트 ─────────────────────────────────────
function FestivalBoothSheet({ festival, onClose }) {
  const { data: booths = [], isLoading } = useFestivalBooths(festival?.festivalId)
  const [selectedBoothId, setSelectedBoothId] = useState(null)
  const { data: boothDetail, isLoading: isBoothDetailLoading } = useBoothDetail(selectedBoothId)
  const [view, setView] = useState('booths') // 'booths' | 'booth_detail'

  if (!festival) return null

  return (
    <>
      {/* 딤 배경 */}
      <motion.div
        key="dim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 z-30"
        onClick={onClose}
      />
      {/* 시트 */}
      <motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[22px] z-40 flex flex-col"
        style={{ height: '75vh', boxShadow: '0 -8px 30px rgba(0,0,0,.12)' }}
      >
        {/* 드래그 핸들 */}
        <div className="w-[38px] h-[4px] rounded-sm bg-[#d8d4cc] mx-auto mt-[10px] mb-[4px] flex-none" />

        {/* 헤더 */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#e8e5de] flex-none">
          {view === 'booth_detail' ? (
            <button onClick={() => { setView('booths'); setSelectedBoothId(null) }}
              className="text-[#a9a59c] text-[22px] font-bold leading-none pb-0.5 flex-none">‹</button>
          ) : (
            <button onClick={onClose}
              className="text-[#a9a59c] text-[22px] font-bold leading-none pb-0.5 flex-none">✕</button>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] text-[#34322e] truncate"
              style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
              {view === 'booth_detail' ? (boothDetail?.name ?? '부스 상세') : festival.name}
            </div>
            {view === 'booths' && (
              <div className="text-[11px] text-[#a9a59c] mt-0.5 font-num">{festival.startDate} ~ {festival.endDate}</div>
            )}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence mode="wait">
            {/* 부스 목록 */}
            {view === 'booths' && (
              <motion.div key="booths" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                {isLoading ? (
                  <div className="flex flex-col gap-3 pt-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-[70px] rounded-[14px] bg-[#efece6] animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                    ))}
                  </div>
                ) : booths.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="text-[32px]">🏮</div>
                    <div className="text-[14px] font-semibold text-[#34322e]">등록된 부스가 없어요</div>
                    <div className="text-[12px] text-[#a9a59c]">아직 상인이 부스를 등록하지 않았어요</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-1 pb-10">
                    {booths.map(b => (
                      <div key={b.boothId ?? b.id}
                        onClick={() => { setSelectedBoothId(b.boothId ?? b.id); setView('booth_detail') }}
                        className="bg-white border-[1.5px] border-[#d8d4cc] rounded-[14px] p-3.5 flex gap-3 items-center cursor-pointer active:scale-[.98] transition-transform">
                        <div className="w-12 h-12 rounded-xl bg-[#efece6] border border-[#e8e5de] flex-none flex items-center justify-center text-2xl">🏮</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-num font-bold text-[15px] text-[#34322e]">{b.name}</div>
                          <div className="text-[11.5px] text-[#7c7972] mt-0.5 truncate">{b.locationDescription}</div>
                        </div>
                        {b.currentWaitingCount > 0 ? (
                          <div className="flex flex-col items-center flex-none">
                            <span className="font-num font-bold text-[22px] leading-none text-[#b56a2c]">{b.currentWaitingCount}</span>
                            <span className="text-[10px] text-[#7c7972] mt-0.5">팀 대기</span>
                          </div>
                        ) : (
                          <Badge tone="green" className="flex-none">바로 입장</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 부스 상세 */}
            {view === 'booth_detail' && (
              <motion.div key="booth_detail" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}>
                {(isBoothDetailLoading || !boothDetail) ? (
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="h-[110px] rounded-2xl bg-[#efece6] animate-pulse" />
                    {[...Array(3)].map((_, i) => <div key={i} className="h-[56px] rounded-xl bg-[#efece6] animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />)}
                  </div>
                ) : (
                  <div className="pb-10">
                    {boothDetail.imageUrl ? (
                      <img src={getImageUrl(boothDetail.imageUrl)} alt={boothDetail.name} className="h-[110px] w-full rounded-2xl object-cover mb-3" />
                    ) : (
                      <div className="h-[110px] rounded-2xl bg-[#efece6] border border-[#e8e5de] flex items-center justify-center text-[#a9a59c] text-[13px] mb-3">
                        🏮 부스 대표 이미지
                      </div>
                    )}
                    <div className="flex items-start gap-2 mb-2">
                      <Badge tone="gray">📍 {boothDetail.locationDescription}</Badge>
                    </div>
                    <div className="text-[12.5px] text-[#7c7972] mb-3">{boothDetail.description}</div>
                    <div className="h-px bg-[#e8e5de] my-3" />
                    <div className="font-num font-bold text-[13px] mb-2 text-[#34322e]">메뉴판</div>
                    <div className="flex flex-col gap-1">
                      {boothDetail.products?.map(m => (
                        <div key={m.productId ?? m.id}
                          className={`flex gap-3 px-3 py-2.5 rounded-xl ${m.isSpecialty ? 'bg-[#f8e9d8] border border-[#ecd3b6]' : 'border border-transparent'}`}>
                          {m.imageUrl ? (
                            <img src={getImageUrl(m.imageUrl)} alt={m.name} className="w-10 h-10 rounded-xl object-cover flex-none" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#efece6] border border-[#e8e5de] flex-none" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-num font-bold text-[13px] text-[#34322e]">{m.name}</span>
                              {m.isSpecialty && <span className="inline-flex items-center h-4 px-1.5 rounded-full bg-[#f8e9d8] border border-[#e08a45] text-[#b56a2c] text-[9px] font-num font-bold">🌾 특산물</span>}
                            </div>
                            <div className="text-[11px] text-[#7c7972] mt-0.5">{m.description}</div>
                          </div>
                          <div className="font-num font-bold text-[13px] text-[#b56a2c] flex-none">{m.price?.toLocaleString()}원</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}

// 상태 1 & 2: 메인 화면 (기본 & 타이핑 중 통합)
function HomeMain({ isTyping, onFocus, query, setQuery, onSearch, openSheet, filters, mapRef, handleZoomIn, handleZoomOut, recommendations, onMarkerClick, centerCoords, radiusKm, onFestivalClick }) {
  const SUGGESTIONS = ['🌾 특산물 먹거리 축제', '🎆 야경 좋은 불꽃 축제', '👨‍👩‍👧 가족 체험 부스']
  const [boothSheetFestival, setBoothSheetFestival] = useState(null)

  return (
    <>
      {/* 앱바 (헤더) */}
      <div className="flex-none flex items-center justify-between px-6 pt-7 pb-5 bg-white z-10 relative" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <Logo />
      </div>

      {/* 검색 + 필터 */}
      <div className="flex-none px-5 py-4 flex flex-col gap-[14px] z-10 relative">
        {/* SearchInput은 언마운트되지 않고 항상 유지됨 */}
        <SearchInput value={query} onChange={e => setQuery(e.target.value)} autoFocus={isTyping} onFocus={onFocus} onKeyDown={(e) => e.key === 'Enter' && query.trim() !== '' && onSearch()} />
        {/* 구분선 */}
        <div className="flex items-center gap-3 text-[11px] text-[#a9a59c] px-3 font-semibold mt-1 mb-1">
          <span className="flex-1 h-px bg-[#d8d4cc]/60" />또는 직접 조건 설정<span className="flex-1 h-px bg-[#d8d4cc]/60" />
        </div>
        {/* 필터 폼 */}
        <div className={`flex flex-col gap-3 transition-opacity duration-200 ${isTyping ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-2 gap-[10px]">
            <div><FieldLabel>위치</FieldLabel><FilterInput onClick={() => openSheet('location')} icon="📍" value={filters.location} /></div>
            <div><FieldLabel>반경</FieldLabel><FilterInput onClick={() => openSheet('radius')} value={filters.radius} /></div>
          </div>
          <div><FieldLabel>가용 시간</FieldLabel><FilterInput onClick={() => openSheet('time')} icon="🕒" value={filters.time} /></div>
        </div>
      </div>

      {/* 하단 영역 (진행중 축제 또는 추천 검색어) */}
      {!isTyping ? (
        <>
          {/* 진행 중인 축제 */}
          <div className="flex-1 min-h-0 flex flex-col pt-2 pb-1">
            <div className="flex items-center justify-between px-5 mb-3 flex-none">
              <div>
                <div className="font-bold text-[15px] text-[#34322e]"
                  style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
                  등록된 축제
                </div>
                <div className="text-[11.5px] text-[#a9a59c] mt-0.5">검색하면 내 주변 축제를 찾아줘요</div>
              </div>
              <button onClick={onSearch}
                className="text-[12px] font-num font-semibold text-[#b56a2c] flex items-center gap-1">
                전체보기 ›
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <ActiveFestivalCards onFestivalClick={(f) => setBoothSheetFestival(f)} />
            </div>
          </div>

          {/* 하단 검색 버튼 */}
          <div className="flex-none px-6 pt-4 bg-white z-10 relative" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
            <button
              onClick={onSearch}
              className="w-full min-h-[56px] rounded-[18px] font-bold text-[16px] text-white flex items-center justify-center gap-[7px] active:translate-y-[2px] transition-all"
              style={{ background: '#e08a45', borderBottom: '3px solid #c46d2c', fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
              🔍 주변 축제 검색하기
            </button>
          </div>
        </>
      ) : (
        <>
          {/* 추천 검색어 */}
          <div className="flex-1 overflow-auto nice-scroll px-5 py-4 flex flex-col gap-[9px] z-10 relative">
            <span className="text-[11px] text-[#a9a59c] font-semibold"
              style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>추천 검색어</span>
            <div className="bg-white rounded-3xl border border-[#d8d4cc] p-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
              {SUGGESTIONS.map((t, i) => (
                <div key={i}
                  onClick={() => { setQuery(t.replace(/^[^\s]+\s/, '')); onSearch(); }}
                  className="flex items-center gap-[10px] px-[12px] py-[10px] rounded-2xl text-[13px] text-[#34322e] hover:bg-[#f6f4ef] active:bg-[#efece6] cursor-pointer transition-colors">
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* 하단 AI 검색 버튼 */}
          <div className="flex-none px-5 py-4 bg-white z-10 relative rounded-t-3xl" style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.07)' }}>
            <button
              onClick={onSearch}
              className="w-full min-h-[52px] rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center gap-[7px] active:opacity-80 transition-opacity"
              style={{ background: '#e08a45', border: '1.5px solid #b56a2c', boxShadow: '0 3px 0 #b56a2c', fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
              ✦ AI 검색
            </button>
          </div>
        </>
      )}

      {/* 축제 부스 시트 오버레이 */}
      <AnimatePresence>
        {boothSheetFestival && (
          <FestivalBoothSheet
            festival={boothSheetFestival}
            onClose={() => setBoothSheetFestival(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// 상태 3: 검색 결과
function HomeResults({ query, recommendations, isRecommendLoading, selectedFestivalId, setSelectedFestivalId, booths, isBoothsLoading, selectedBoothId, setSelectedBoothId, boothDetail, isBoothDetailLoading, onBack, navigate, mapRef, handleZoomIn, handleZoomOut, filters, openSheet }) {
  const [sheetState, setSheetState] = useState('hidden') // 'hidden' | 'collapsed' | 'expanded'
  const [sheetView, setSheetView] = useState('festivals') // 'festivals' | 'booths' | 'booth_detail'
  const [selectedFestival, setSelectedFestival] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [festivalSort, setFestivalSort] = useState('distance') // 'distance' | 'name'
  const [boothSort, setBoothSort] = useState('waiting') // 'waiting' | 'name'
  const [mapFocusCoords, setMapFocusCoords] = useState(null) // 카드 클릭 시 지도 포커스 좌표

  // AI 큐레이터 쿼리 연동
  const { data: aiResult, isLoading: isAiLoading } = useAiCurate(query, !!query)

  useEffect(() => {
    setIsMounted(true)
    // 약간의 딜레이를 주어 화면 렌더링이 완료된 후 애니메이션이 시작되도록 함 (순간이동 방지)
    const timer = setTimeout(() => {
      // url로 특정 축제를 지정해서 들어온 게 아니라면 기본적으로 collapsed 상태로 올림
      if (!(selectedFestivalId && recommendations)) {
        setSheetState('collapsed')
      }
    }, 50)
    
    // 지도 마커 클릭으로 진입한 경우 — selectedFestivalId가 이미 설정됐으면 부스 뷰 바로 열기
    if (selectedFestivalId && recommendations) {
      const f = recommendations.find(r => r.festivalId === selectedFestivalId)
      if (f) {
        setSelectedFestival(f)
        setSheetState('expanded')
        setSheetView('booths')
      }
    }
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 필터 바뀌면 축제 목록으로 리셋
  useEffect(() => {
    if (!isMounted) return
    setSheetView('festivals')
    setSelectedFestival(null)
    setSheetState('expanded')
  }, [filters])

  const handleDragEnd = (e, info) => {
    if (info.offset.y < -30) setSheetState('expanded')
    else if (info.offset.y > 30) setSheetState('collapsed')
  }

  // 지도의 핀 정보 (축제 위경도)
  const pins = recommendations?.filter(f => f.lat && f.lng).map(f => {
    const maxCongestion = f.nearbySpots?.reduce((max, s) => Math.max(max, s.congestionRate), 0) || 0
    const level = maxCongestion > 80 ? 'red' : maxCongestion > 40 ? 'yellow' : 'green'
    return {
      lat: f.lat,
      lng: f.lng,
      level,
      festival: f
    }
  }) || []

  // 정렬 적용된 축제 목록
  const sortedRecommendations = recommendations ? [...recommendations].sort((a, b) => {
    if (festivalSort === 'distance') {
      return a.distanceKm - b.distanceKm
    } else {
      return a.name.localeCompare(b.name, 'ko')
    }
  }) : []

  // 정렬 적용된 부스 목록
  const sortedBooths = booths ? [...booths].sort((a, b) => {
    if (boothSort === 'waiting') {
      return a.currentWaitingCount - b.currentWaitingCount
    } else {
      return a.name.localeCompare(b.name, 'ko')
    }
  }) : []

  return (
    <>
      {/* 앱바: 뒤로가기 + 검색창 */}
      <div className="flex-none flex items-center gap-[10px] px-5 h-[68px] bg-white border-b border-[#e8e5de] z-20 relative">
        <button onClick={onBack}
          className="w-[40px] h-[40px] border-[1.5px] border-[#d8d4cc] rounded-[10px] flex items-center justify-center text-[#7c7972] flex-none text-[20px] bg-white active:bg-gray-50 transition-colors pb-0.5">
          ‹
        </button>
        <SearchInput value={query} onChange={e => setQuery(e.target.value)} className="flex-1" size="small" />
      </div>

      {/* 필터 칩 행 */}
      {filters && openSheet && (
        <div className="flex-none flex items-center gap-2 px-4 py-2.5 bg-white border-b border-[#e8e5de] overflow-x-auto z-20 relative" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => openSheet('location')}
            className="flex-none flex items-center gap-1 px-3 py-1.5 rounded-full border-[1.5px] border-[#e08a45] bg-[#f8e9d8] text-[12px] font-num font-semibold text-[#b56a2c] whitespace-nowrap">
            📍 {filters.location}
          </button>
          <button onClick={() => openSheet('radius')}
            className="flex-none flex items-center gap-1 px-3 py-1.5 rounded-full border-[1.5px] border-[#d8d4cc] bg-white text-[12px] font-num font-semibold text-[#7c7972] whitespace-nowrap">
            🔍 {filters.radius}
          </button>
          <button onClick={() => openSheet('time')}
            className="flex-none flex items-center gap-1 px-3 py-1.5 rounded-full border-[1.5px] border-[#d8d4cc] bg-white text-[12px] font-num font-semibold text-[#7c7972] whitespace-nowrap">
            🕒 {filters.time}
          </button>
          {isRecommendLoading && (
            <span className="flex-none text-[11px] text-[#a9a59c] font-num ml-1 animate-pulse">검색 중...</span>
          )}
        </div>
      )}

      {/* 지도 (flex-1) */}
      <div className="flex-1 min-h-0 relative z-0">
        <KakaoMapArea
          mapRef={mapRef}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          centerCoords={mapFocusCoords || filters?.locationCoords}
          radiusKm={filters ? parseFloat(filters.radius?.replace(' km', '') || 10) : undefined}
          pins={pins}
          noResults={sortedRecommendations.length === 0 && !isRecommendLoading}
          onMarkerClick={(f) => {
            setSelectedFestivalId(f.festivalId)
            setSelectedFestival(f)
            setSheetState('expanded')
            setSheetView('booths')
            if (f.lat && f.lng) setMapFocusCoords({ lat: f.lat, lng: f.lng })
          }}
        />
        {/* 혼잡도 범례 */}
        <div className="absolute top-[12px] left-[14px] right-[14px] flex gap-[7px] z-10 pointer-events-none">
          <CongestionChip level="green" label="여유" />
          <CongestionChip level="yellow" label="보통" />
          <CongestionChip level="red" label="혼잡" />
        </div>
      </div>

      {/* 드래그 가능한 슬라이드업 바텀 시트 */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={sheetState}
        initial="hidden"
        variants={{
          hidden: { y: '100%' },
          collapsed: { y: '88%' },
          expanded: { y: '0%' }
        }}
        transition={{ type: 'spring', damping: 22, stiffness: 120 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] z-20 px-4 pt-[10px] flex flex-col"
        style={{ height: '75vh', boxShadow: '0 -6px 20px rgba(0,0,0,.08)' }}
      >
        {/* 드래그 핸들 */}
        <div className="w-[38px] h-[4px] rounded-sm bg-[#d8d4cc] mx-auto mb-[12px] flex-none cursor-grab active:cursor-grabbing" />

        {/* === 콘텐츠 영역 (뷰 전환 애니메이션) === */}
        <div className="flex-1 min-h-0 relative overflow-hidden mt-[12px]">
          <AnimatePresence mode="wait">
            {/* === 축제 리스트 뷰 === */}
            {sheetView === 'festivals' && (
              <motion.div
                key="festivals"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col"
              >
                {/* AI 큐레이션 영역 */}
                {isAiLoading && (
                  <div className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#e8e5de] animate-pulse mb-3 flex-none">
                    <div className="h-3.5 bg-[#efece6] rounded w-1/3 mb-2" />
                    <div className="h-3 bg-[#efece6] rounded w-2/3" />
                  </div>
                )}
                {aiResult && (
                  <div className="p-3.5 rounded-xl bg-[#f8e9d8] border border-[#ecd3b6] mb-3 flex flex-col gap-1.5 flex-none">
                    <div className="flex items-center gap-1.5 text-[11.5px] text-[#b56a2c] font-bold">
                      <span>✨ ennoia AI 스마트 추천 ({aiResult.parsedLocation})</span>
                    </div>
                    <div className="text-[12.5px] text-[#34322e] leading-[1.5]">
                      {aiResult.aiRecommendationReason}
                    </div>
                    {aiResult.recommendedSpots?.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/70 rounded-lg px-2.5 py-1.5 text-[11px] mt-0.5">
                        <span className="font-semibold text-[#7c7972]">📍 {s.name}</span>
                        <span className="text-[#b56a2c] font-bold">혼잡도 {s.congestionRate}% ({s.level})</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center mb-[12px] flex-none px-1">
                  <span className="font-bold text-[14px] text-[#34322e]"
                    style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
                    주변 축제 <span className="text-[#e08a45]">{recommendations?.length || 0}</span>
                  </span>
                  <div className="flex bg-[#efece6]/60 border border-[#d8d4cc]/60 rounded-full p-[2px] gap-[2px] select-none font-num">
                    <button
                      onClick={() => setFestivalSort('distance')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] transition-all duration-200 ${festivalSort === 'distance'
                        ? 'bg-white text-[#34322e] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                        : 'text-[#7c7972] hover:text-[#34322e] font-medium'
                        }`}
                    >
                      거리순
                    </button>
                    <button
                      onClick={() => setFestivalSort('name')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] transition-all duration-200 ${festivalSort === 'name'
                        ? 'bg-white text-[#34322e] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                        : 'text-[#7c7972] hover:text-[#34322e] font-medium'
                        }`}
                    >
                      이름순
                    </button>
                  </div>
                </div>

                <ScrollArea className="flex-1 min-h-0" innerClassName="flex flex-col gap-4 pb-10 px-1 pt-3">
                  {isRecommendLoading ? (
                    <div className="text-center py-8 text-[13px] text-[#7c7972]">축제를 찾고 있습니다...</div>
                  ) : sortedRecommendations.length === 0 ? (
                    <div className="text-center py-8 flex flex-col items-center gap-2">
                      <div className="text-[28px]">🔍</div>
                      <div className="text-[14px] font-semibold text-[#34322e]">검색 결과가 없어요</div>
                      <div className="text-[12.5px] text-[#a9a59c]">위치나 반경 조건을 바꿔서 다시 검색해 보세요</div>
                    </div>
                  ) : (
                    sortedRecommendations.map((f, i) => (
                      <motion.div
                        key={f.festivalId}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                      >
                        <FestivalCard
                          ai={f.festivalId === 3 ? "인기 최고의 야시장!" : undefined}
                          name={f.name}
                          period={`${f.startDate} ~ ${f.endDate}`}
                          dist={`${f.distanceKm}km`}
                          nearbySpots={f.nearbySpots}
                          onClick={() => {
                            setSelectedFestivalId(f.festivalId)
                            setSelectedFestival(f)
                            setSheetState('expanded')
                            setSheetView('booths')
                            if (f.lat && f.lng) setMapFocusCoords({ lat: f.lat, lng: f.lng })
                          }}
                        />
                      </motion.div>
                    ))
                  )}
                </ScrollArea>
              </motion.div>
            )}

            {/* === 특정 축제의 부스 리스트 뷰 === */}
            {sheetView === 'booths' && (
              <motion.div
                key="booths"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="flex items-center gap-[10px] mb-[12px] flex-none px-1">
                  <button onClick={() => setSheetView('festivals')} className="text-[#a9a59c] text-[20px] font-bold pb-0.5">‹</button>
                  <div className="flex-1">
                    <div className="font-bold text-[15px] text-[#34322e] leading-tight" style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>{selectedFestival?.name}</div>
                    <div className="text-[11px] text-[#7c7972]">{selectedFestival?.startDate} ~ {selectedFestival?.endDate}</div>
                  </div>
                  <div className="flex bg-[#efece6]/60 border border-[#d8d4cc]/60 rounded-full p-[2px] gap-[2px] select-none font-num">
                    <button
                      onClick={() => setBoothSort('waiting')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] transition-all duration-200 ${boothSort === 'waiting'
                        ? 'bg-white text-[#34322e] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                        : 'text-[#7c7972] hover:text-[#34322e] font-medium'
                        }`}
                    >
                      대기순
                    </button>
                    <button
                      onClick={() => setBoothSort('name')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] transition-all duration-200 ${boothSort === 'name'
                        ? 'bg-white text-[#34322e] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                        : 'text-[#7c7972] hover:text-[#34322e] font-medium'
                        }`}
                    >
                      이름순
                    </button>
                  </div>
                </div>

                <ScrollArea className="flex-1 min-h-0" innerClassName="flex flex-col gap-3 pb-10 px-1 pt-1">
                  {isBoothsLoading ? (
                    <div className="text-center py-6 text-[13px] text-[#7c7972]">부스 로딩 중...</div>
                  ) : sortedBooths.length === 0 ? (
                    <div className="text-center py-6 text-[13px] text-[#7c7972]">아직 등록된 대기용 부스가 없습니다.</div>
                  ) : (
                    sortedBooths.map((b, i) => (
                      <motion.div
                        key={b.boothId ?? b.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                        onClick={() => { setSelectedBoothId(b.boothId ?? b.id); setSheetView('booth_detail'); }}
                        className="bg-white border-[1.5px] border-[#d8d4cc] rounded-[14px] p-3.5 flex gap-3 items-center cursor-pointer active:scale-[.98] transition-transform">
                        <div className="w-12 h-12 rounded-xl bg-[#efece6] border border-[#e8e5de] flex-none flex items-center justify-center text-2xl">🏮</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-num font-bold text-[15px]">{b.name}</div>
                          <div className="text-[11.5px] text-[#7c7972] mt-0.5">{b.locationDescription}</div>
                        </div>
                        {b.currentWaitingCount > 0 ? (
                          <div className="flex flex-col items-center flex-none">
                            <span className="font-num font-bold text-[22px] leading-none text-[#b56a2c]">{b.currentWaitingCount}</span>
                            <span className="text-[10px] text-[#7c7972] mt-0.5">팀 대기</span>
                          </div>
                        ) : (
                          <Badge tone="green" className="flex-none">바로 입장</Badge>
                        )}
                      </motion.div>
                    ))
                  )}
                </ScrollArea>
              </motion.div>
            )}

            {/* === 특정 부스 상세 정보 뷰 === */}
            {sheetView === 'booth_detail' && (
              <motion.div
                key="booth_detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="flex items-center gap-[10px] mb-[10px] flex-none px-1">
                  <button onClick={() => setSheetView('booths')} className="text-[#a9a59c] text-[20px] font-bold pb-0.5">‹</button>
                  <div className="flex-1 font-bold text-[15px] text-[#34322e]" style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
                    {boothDetail?.name ?? '부스 상세'}
                  </div>
                </div>

                <ScrollArea className="flex-1 min-h-0" innerClassName="px-1 pb-4">
                  {(isBoothDetailLoading || !boothDetail) ? (
                    <div className="flex flex-col gap-3 animate-pulse">
                      <div className="h-[110px] w-full rounded-2xl bg-[#efece6]" />
                      <div className="h-4 w-1/2 rounded-full bg-[#efece6]" />
                      <div className="h-3 w-2/3 rounded-full bg-[#efece6]" />
                      <div className="h-px bg-[#e8e5de]" />
                      <div className="h-3.5 w-1/4 rounded-full bg-[#efece6]" />
                      {[1, 2, 3].map(n => (
                        <div key={n} className="flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-xl bg-[#efece6] flex-none" />
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="h-3 w-1/2 rounded-full bg-[#efece6]" />
                            <div className="h-2.5 w-1/4 rounded-full bg-[#efece6]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {boothDetail.imageUrl ? (
                        <BoothImage src={getImageUrl(boothDetail.imageUrl)} alt={boothDetail.name} />
                      ) : (
                        <div className="h-[110px] rounded-2xl bg-[#efece6] border border-[#e8e5de] flex items-center justify-center text-[#a9a59c] text-[13px] mb-3">
                          🏮 부스 대표 이미지
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge tone="gray">📍 {boothDetail.locationDescription}</Badge>
                        <div className="text-[13px] text-[#7c7972]">{boothDetail.description}</div>
                      </div>
                      <div className="h-px bg-[#e8e5de] my-3" />
                      <div className="font-num font-bold text-[13px] mb-2 text-[#34322e]">메뉴판</div>
                      <div className="flex flex-col gap-1">
                        {boothDetail.products?.map(m => (
                          <div key={m.productId ?? m.id} className={`flex gap-3 px-3 py-2.5 rounded-xl ${m.isSpecialty ? 'bg-[#f8e9d8] border border-[#ecd3b6]' : 'border border-transparent'}`}>
                            {m.imageUrl ? (
                              <img src={getImageUrl(m.imageUrl)} alt={m.name} className="w-10 h-10 rounded-xl object-cover flex-none" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#efece6] border border-[#e8e5de] flex-none" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-num font-bold text-[13px] text-[#34322e]">{m.name}</span>
                                {m.isSpecialty && <span className="inline-flex items-center h-4 px-1.5 rounded-full bg-[#f8e9d8] border border-[#e08a45] text-[#b56a2c] text-[9px] font-num font-bold">🌾 특산물</span>}
                              </div>
                              <div className="text-[11px] text-[#7c7972] mt-0.5">{m.description}</div>
                            </div>
                            <div className="font-num font-bold text-[13px] text-[#b56a2c] flex-none">{m.price.toLocaleString()}원</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </ScrollArea>

                {/* 하단 고정 버튼 */}
                <div className="flex-none pt-3 pb-5 border-t border-[#e8e5de]">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#faf8f4] border border-[#e8e5de]">
                    <div className="w-9 h-9 rounded-xl bg-[#efece6] flex items-center justify-center text-lg flex-none">📲</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-num font-semibold text-[13px] text-[#34322e]">현장 QR로 대기 접수</div>
                      <div className="text-[11px] text-[#7c7972] mt-0.5">부스 현장의 QR 코드를 스캔하세요.</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </>
  )
}

// 상태 4: 검색 결과 없음
function HomeEmpty({ query, setQuery, onBack, mapRef, handleZoomIn, handleZoomOut, onExpandRadius }) {
  return (
    <>
      {/* 앱바 */}
      <div className="flex-none flex items-center gap-[10px] px-5 h-[68px] bg-white border-b border-[#e8e5de] z-10 relative">
        <button onClick={onBack}
          className="w-[40px] h-[40px] border-[1.5px] border-[#d8d4cc] rounded-[10px] flex items-center justify-center text-[#7c7972] flex-none text-[20px] bg-white active:bg-gray-50 transition-colors pb-0.5">
          ‹
        </button>
        <SearchInput value={query} onChange={e => setQuery(e.target.value)} className="flex-1" size="small" />
      </div>

      {/* 전체화면 지도 */}
      <div className="flex-1 min-h-0 relative z-0">
        <KakaoMapArea mapRef={mapRef} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

        {/* 안내 오버레이 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 z-10 pointer-events-none">
          <div
            className="w-full flex flex-col items-center gap-3 px-6 py-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
          >
            <div className="font-bold text-[16px] text-[#34322e] text-center"
              style={{ fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}>
              조건에 맞는 축제가 없어요
            </div>
            <button
              onClick={onExpandRadius}
              className="min-h-[46px] w-full rounded-[12px] font-semibold text-[15px] text-white active:opacity-80 transition-opacity pointer-events-auto"
              style={{ background: '#e08a45', border: '1.5px solid #b56a2c', boxShadow: '0 2px 0 #b56a2c', fontFamily: "'IBM Plex Sans KR', system-ui, sans-serif" }}
            >
              반경 넓히기
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const RADIUS_OPTIONS = ['10 km', '20 km', '30 km', '50 km']

const QUICK_LOCATIONS = [
  { label: '홍대입구', lat: 37.5568, lng: 126.9242 },
  { label: '강남역', lat: 37.4979, lng: 127.0276 },
  { label: '성수동', lat: 37.5440, lng: 127.0564 },
  { label: '이태원', lat: 37.5340, lng: 126.9947 },
  { label: '여의도', lat: 37.5219, lng: 126.9245 },
  { label: '종로', lat: 37.5704, lng: 126.9914 },
  { label: '잠실', lat: 37.5133, lng: 127.1001 },
]

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function HomePage() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState('default') // 'default' | 'typing' | 'results'

  // 필터 상태
  const [filters, setFilters] = useState({
    location: '홍대입구',
    radius: '10 km',
    time: '오늘 18:00 – 21:00'
  })
  // 위치 좌표 (자유 입력 geocoding 결과 저장)
  const [locationCoords, setLocationCoords] = useState({ lat: 37.5568, lng: 126.9242 })

  const combinedFilters = useMemo(
    () => ({ ...filters, locationCoords }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.location, filters.radius, filters.time, locationCoords.lat, locationCoords.lng]
  )

  // 바텀 시트 상태
  const [activeSheet, setActiveSheet] = useState(null) // null | 'location' | 'radius' | 'time'

  const navigate = useNavigate()
  const mapRef = useRef(null)

  // 앱 재진입 시 활성 대기 복원 → TrackPage로 자동 이동
  const savedFestivalId = localStorage.getItem('customer_festival_id')
  const { data: activeWaitings } = useMyActiveWaitings(savedFestivalId ? parseInt(savedFestivalId) : null)
  useEffect(() => {
    if (activeWaitings && activeWaitings.length > 0) {
      const active = activeWaitings.find(w => w.status === 'WAITING' || w.status === 'CALLED')
      if (active) navigate(`/track/${active.waitingId}`, { replace: true })
    }
  }, [activeWaitings, navigate])

  // API Call - 위치 기반 축제 추천 조회
  const coords = locationCoords
  const radKm = parseFloat(filters.radius.replace(' km', ''))
  const { data: recommendations, isLoading: isRecommendLoading } = useRecommendFestivals({
    latitude: coords.lat,
    longitude: coords.lng,
    maxDistanceKm: radKm,
    address: filters.location,
  })

  // 주소 → 좌표 변환 (지도 핀용)
  const geocodedRecommendations = useGeocodedFestivals(recommendations)

  // 결과 없을 때 자동으로 반경 확장
  const isEmpty = !isRecommendLoading && (!recommendations || recommendations.length === 0)
  const canExpand = radKm < 50

  // 검색 쿼리에 따른 클라이언트 필터링 (geocoded 좌표 포함)
  const filteredRecommendations = geocodedRecommendations.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(query.toLowerCase())
  )

  // 실시간 부스/상세조회 ID 관리
  const [selectedFestivalId, setSelectedFestivalId] = useState(null)
  const { data: booths, isLoading: isBoothsLoading } = useFestivalBooths(selectedFestivalId)

  const [selectedBoothId, setSelectedBoothId] = useState(null)
  const { data: boothDetail, isLoading: isBoothDetailLoading } = useBoothDetail(selectedBoothId)

  // 줌인/줌아웃 핸들러
  const handleZoomIn = () => {
    const map = mapRef.current
    if (!map) return
    map.setLevel(map.getLevel() - 1, { animate: true })
  }

  const handleZoomOut = () => {
    const map = mapRef.current
    if (!map) return
    map.setLevel(map.getLevel() + 1, { animate: true })
  }

  const handleQueryChange = (e) => {
    const val = typeof e === 'string' ? e : e?.target?.value || ''
    setQuery(val)
    if (val && view === 'default') setView('typing')
    if (!val) setView('default')
  }

  const handleSearch = () => {
    setView('results')
  }

  const handleBack = () => {
    setQuery('')
    setView('default')
    setSelectedFestivalId(null)
    setSelectedBoothId(null)
  }

  const handleFilterSelect = (key, value, coords) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    if (key === 'location' && coords) setLocationCoords(coords)
    setActiveSheet(null)
    // 필터 바뀌면 선택 초기화 + 결과 view로 자동 전환
    setSelectedFestivalId(null)
    setSelectedBoothId(null)
    setView('results')
  }


  return (
    <div className="flex flex-col h-[100dvh] bg-[#faf8f4] overflow-hidden relative">
      {(view === 'default' || view === 'typing') && (
        <HomeMain onFocus={() => setView('typing')}
          isTyping={view === 'typing'}
          query={query} setQuery={handleQueryChange} onSearch={handleSearch}
          openSheet={setActiveSheet} filters={filters}
          mapRef={mapRef} handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut}
          centerCoords={coords}
          radiusKm={radKm}
          recommendations={geocodedRecommendations}
          onFestivalClick={(f) => {
            setSelectedFestivalId(f.festivalId)
            setView('results')
          }}
          onMarkerClick={(f) => {
            setSelectedFestivalId(f.festivalId)
            setView('results')
          }}
        />
      )}
      {view === 'results' && (
        <HomeResults
          query={query}
          setQuery={handleQueryChange}
          recommendations={filteredRecommendations}
          isRecommendLoading={isRecommendLoading}
          selectedFestivalId={selectedFestivalId}
          setSelectedFestivalId={setSelectedFestivalId}
          booths={booths}
          isBoothsLoading={isBoothsLoading}
          selectedBoothId={selectedBoothId}
          setSelectedBoothId={setSelectedBoothId}
          boothDetail={boothDetail}
          isBoothDetailLoading={isBoothDetailLoading}
          onBack={handleBack}
          navigate={navigate}
          mapRef={mapRef}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          filters={combinedFilters}
          openSheet={setActiveSheet}
        />
      )}

      {/* 동적 바텀 시트 렌더링 */}
      <BottomSheet
        isOpen={activeSheet !== null}
        onClose={() => setActiveSheet(null)}
        title={
          activeSheet === 'location' ? '위치 선택' :
            activeSheet === 'radius' ? '반경 설정' :
              activeSheet === 'time' ? '가용 시간 설정' : ''
        }
      >
        <div className="flex flex-col gap-2">
          {activeSheet === 'location' && (
            <LocationPicker
              current={filters.location}
              onSelect={(label, coords) => handleFilterSelect('location', label, coords)}
            />
          )}
          {activeSheet === 'radius' && RADIUS_OPTIONS.map(rad => (
            <button key={rad} onClick={() => handleFilterSelect('radius', rad)}
              className={`p-4 rounded-xl text-left font-medium transition-colors ${filters.radius === rad ? 'bg-[#f8e9d8] text-[#b56a2c] border border-[#e08a45]' : 'bg-gray-50 text-[#34322e]'}`}>
              {rad}
            </button>
          ))}
          {activeSheet === 'time' && ['지금 당장', '오늘 18:00 – 21:00', '내일 주간', '이번 주말'].map(t => (
            <button key={t} onClick={() => handleFilterSelect('time', t)}
              className={`p-4 rounded-xl text-left font-medium transition-colors ${filters.time === t ? 'bg-[#f8e9d8] text-[#b56a2c] border border-[#e08a45]' : 'bg-gray-50 text-[#34322e]'}`}>
              🕒 {t}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
