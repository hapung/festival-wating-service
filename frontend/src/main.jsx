import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

async function enableMocking() {
  // 개발 환경이면서 VITE_USE_MSW가 true일 때만 실행
  if (
    process.env.NODE_ENV !== 'development' ||
    import.meta.env.VITE_USE_MSW !== 'true'
  ) {
    return
  }

  const { worker } = await import('./mocks/browser')
  return worker.start()
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

