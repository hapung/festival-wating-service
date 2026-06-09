export default function Card({ children, className = '', style, onClick }) {
  return (
    <div
      className={`bg-white border border-[#d8d4cc] rounded-2xl shadow-[0_1px_0_rgba(0,0,0,0.02),0_6px_16px_rgba(0,0,0,0.05)] ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
