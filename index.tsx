import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const useHashRouter = import.meta.env.VITE_ROUTER_MODE === 'hash';
const previewRoutes = new Set(['schedule', 'standings', 'stats', 'media', 'news']);

if (useHashRouter && !window.location.hash) {
  const previewParams = new URLSearchParams(window.location.search);
  const route = previewParams.get('route');

  if (route && previewRoutes.has(route)) {
    const season = previewParams.get('season');
    const routeSearch = season ? `?season=${encodeURIComponent(season)}` : '';
    window.history.replaceState(null, '', window.location.pathname);
    window.location.hash = `/${route}${routeSearch}`;
  }
}

const app = useHashRouter ? (
  <HashRouter>
    <App />
  </HashRouter>
) : (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <App />
  </BrowserRouter>
);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>{app}</React.StrictMode>,
);
