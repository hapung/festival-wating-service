import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

async function enableMocking() {
  // MSW 비활성화 시 기존 서비스 워커 자동 해제
  if (import.meta.env.VITE_USE_MSW !== 'true') {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    }
    return
  }

  const { worker } = await import('./mocks/browser')
  return worker.start()
}

enableMocking()
  .catch((err) => {
    console.error('Failed to start MSW:', err)
  })
  .finally(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </StrictMode>,
    )
  })

