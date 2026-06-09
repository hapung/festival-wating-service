import { useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { useBoothDetail } from '../../api/queries'

function getAdminSession() {
  try {
    const s = sessionStorage.getItem('admin_session') || localStorage.getItem('admin_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function decodeJWT(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')))
  } catch { return null }
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-[#f0ece6] last:border-0">
      <span className="text-[11.5px] text-[#a9a59c]">{label}</span>
      <span className={`text-[13.5px] text-[#34322e] font-semibold break-all ${mono ? 'font-num' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function AdminSettingsPage() {
  const navigate = useNavigate()
  const session = getAdminSession()
  const boothId = session?.boothId
  const { data: booth } = useBoothDetail(boothId)

  const payload = session?.token ? decodeJWT(session.token) : null
  const role = session?.role || payload?.role || ''
  const roleLabel = role === 'ROLE_MERCHANT' ? '상인' : role === 'ROLE_ORGANIZER' ? '주최자' : role === 'ROLE_ADMIN' ? '관리자' : role

  const qrImageUrl = booth?.qrCodeUrl || null

  const handleDownload = async () => {
    if (!qrImageUrl) return
    try {
      const res = await fetch(qrImageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${booth.name}_QR.png`; a.click()
      URL.revokeObjectURL(url)
    } catch { window.open(qrImageUrl, '_blank') }
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-5 flex flex-col gap-6">

        {/* 제목 */}
        <div>
          <h1 className="font-num font-bold text-[20px] text-[#34322e]">설정</h1>
          <p className="text-[13px] text-[#a9a59c] mt-0.5">계정 및 부스 정보를 확인하세요</p>
        </div>

        {/* 계정 정보 */}
        <div className="bg-white rounded-2xl border border-[#e8e5de]">
          <div className="px-4 pt-4 pb-2">
            <span className="text-[12px] font-semibold text-[#a9a59c] uppercase tracking-wide">계정 정보</span>
          </div>
          <div className="px-4 pb-2">
            <InfoRow label="아이디" value={session?.username} mono />
            <InfoRow label="역할"   value={roleLabel} />
            <InfoRow label="부스명" value={booth?.name || session?.boothName} />
            <InfoRow label="부스 ID" value={boothId ?? '미등록'} mono />
          </div>
        </div>

        {/* QR 코드 */}
        {boothId && (
          <div className="bg-white rounded-2xl border border-[#e8e5de]">
            <div className="px-4 pt-4 pb-2">
              <span className="text-[12px] font-semibold text-[#a9a59c] uppercase tracking-wide">QR 코드</span>
            </div>
            <div className="px-4 pb-4 flex flex-col items-center gap-3">
              <p className="w-full text-[13px] text-[#7c7972] leading-relaxed">
                손님이 QR 코드를 스캔하면 이 부스의 대기 신청 화면으로 이동합니다.
              </p>
              {qrImageUrl ? (
                <>
                  <img
                    src={qrImageUrl}
                    alt="QR 코드"
                    className="w-52 rounded-2xl border border-[#e8e5de]"
                    style={{ display: 'block', height: 'auto' }}
                  />
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-[13px] font-num font-semibold transition-all active:scale-95"
                    style={{ background: '#e08a45', boxShadow: '0 3px 0 #b56a2c' }}
                  >
                    ⬇ QR 다운로드
                  </button>
                </>
              ) : (
                <div className="w-52 h-52 rounded-2xl border border-[#e8e5de] bg-[#f6f4ef] flex items-center justify-center text-[13px] text-[#a9a59c]">
                  QR 불러오는 중...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 부스 미등록 안내 */}
        {!boothId && (
          <div className="bg-[#fdf5ec] rounded-2xl border border-[#f5cfa0] px-4 py-4 flex flex-col gap-2">
            <span className="text-[13.5px] font-semibold text-[#b56a2c]">부스가 아직 등록되지 않았어요</span>
            <p className="text-[12.5px] text-[#c98b50] leading-relaxed">
              부스를 등록하면 QR 코드 발급, 대기열 관리, 통계 기능을 모두 사용할 수 있습니다.
            </p>
            <button
              onClick={() => navigate('/admin/register')}
              className="mt-1 self-start text-[12.5px] font-semibold text-[#b56a2c] underline"
            >
              부스 등록하러 가기 →
            </button>
          </div>
        )}

        {/* 부스 상세 정보 */}
        {booth && (
          <div className="bg-white rounded-2xl border border-[#e8e5de]">
            <div className="px-4 pt-4 pb-2">
              <span className="text-[12px] font-semibold text-[#a9a59c] uppercase tracking-wide">부스 상세</span>
            </div>
            <div className="px-4 pb-2">
              <InfoRow label="부스명"    value={booth.name} />
              <InfoRow label="위치 설명" value={booth.locationDescription} />
              <InfoRow label="대기 인원" value={`${booth.currentWaitingCount ?? 0}팀`} mono />
            </div>
          </div>
        )}

        {/* 앱 버전 */}
        <div className="text-center text-[11.5px] text-[#c5c1b9] pb-4">
          festival·waiting © 2026
        </div>

      </div>
    </AdminLayout>
  )
}
