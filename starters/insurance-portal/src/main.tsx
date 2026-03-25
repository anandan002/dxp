import React from 'react';
import ReactDOM from 'react-dom/client';
import { DxpProvider } from '@dxp/sdk-react';
import { ThemeProvider } from '@dxp/ui';
import { App } from './App';
import './index.css';

// Engagement-specific config
const dxpConfig = {
  bffUrl: '/api/v1',
  getAccessToken: async () => localStorage.getItem('dxp_access_token'),
};

// Client brand — change these per engagement. Everything else adapts.
const acmeTheme = {
  colors: {
    brand: '#1d6fb8',
    brandDark: '#175a96',
    brandLight: '#eff8ff',
  },
  radius: 'md' as const,
  density: 'comfortable' as const,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={acmeTheme}>
      <DxpProvider config={dxpConfig}>
        <App />
      </DxpProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
