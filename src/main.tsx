import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initErrorMonitoring } from './lib/errorMonitoring'

initErrorMonitoring()

createRoot(document.getElementById('root')!).render(<App />)
