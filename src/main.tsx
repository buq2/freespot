import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import './components/Map/icons' // Initialize Leaflet icons
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
