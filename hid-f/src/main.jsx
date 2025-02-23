import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Home from './home.jsx'
import FigmaCanvas from './CanvasEditor.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <Home />
    <App /> */}
    <FigmaCanvas />
  </StrictMode>,
)
