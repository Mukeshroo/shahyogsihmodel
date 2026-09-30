import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupApiInterceptor } from './api/setupInterceptor.ts';

// Setup resilient API interception for static hosting (e.g. GitHub Pages) and fullstack fallback
try {
  setupApiInterceptor();
} catch (e) {
  console.warn('API interceptor skipped:', e);
}

// Safely register PWA Service Worker if supported
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service worker registration ignored:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

