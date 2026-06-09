import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // 2.5초 후 온보딩 페이지로 이동
    const t = setTimeout(() => navigate('/onboarding'), 2500)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="flex flex-col h-full bg-[#faf8f4]">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.8 }}
            className="w-24 h-24 rounded-[28px] bg-[#e08a45] flex items-center justify-center shadow-[0_8px_28px_rgba(224,138,69,0.35)]"
          >
            <span className="text-5xl">🎪</span>
          </motion.div>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center"
          >
            <div className="font-num font-bold text-[28px] tracking-tight text-[#34322e]">
              festival<span className="text-[#e08a45]">·</span>waiting
            </div>
            <div className="text-[14px] text-[#7c7972] mt-1.5 font-medium">축제를 더 스마트하게</div>
          </motion.div>
        </div>

        {/* 로딩 도트 애니메이션 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex gap-2 mt-7"
        >
          {[0, 1, 2].map((i) => (
            <motion.span 
              key={i} 
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-[#e08a45]" 
            />
          ))}
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex-none pb-8 text-center text-[12px] text-[#a9a59c] font-num"
      >
        v1.0.0
      </motion.div>
    </div>
  )
}
