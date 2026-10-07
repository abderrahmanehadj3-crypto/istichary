import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGlobalSensorsAndSecureContext } from './utils/globalHardwareInit';

// Initialize HTTPS verification and hardware sensor protections globally
initGlobalSensorsAndSecureContext();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
