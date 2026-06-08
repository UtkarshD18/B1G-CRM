import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProfiler } from './profiler.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProfiler>
      <App />
    </AppProfiler>
  </StrictMode>,
)
