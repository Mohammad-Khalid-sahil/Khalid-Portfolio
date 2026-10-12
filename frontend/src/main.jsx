import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './i18n'
import i18n from 'i18next'
import { RTL_LANGUAGES } from './i18n'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './registerServiceWorker.js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Ensure correct html language and text direction for accessibility/SEO
try {
  const lang = i18n.language || 'en'
  document.documentElement.lang = lang
  document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr'
} catch (e) {
  // ignore in non-browser environments
}

registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
