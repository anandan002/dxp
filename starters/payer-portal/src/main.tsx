import React from 'react';
import ReactDOM from 'react-dom/client';
import { DxpProvider } from '@dxp/sdk-react';
import { ThemeProvider } from '@dxp/ui';
import { App } from './App';
import './index.css';

// Prefer env override. Default works with nginx routing (/dxp/api -> BFF).
const configuredBffUrl = import.meta.env.VITE_BFF_URL || '/dxp/api/v1';
const dxpConfig = {
  bffUrl: configuredBffUrl,
  getAccessToken: async () => null,
};

// Healthcare teal brand: change these per engagement. Everything else adapts.
const payerTheme = {
  colors: {
    brand: '#0d6e6e',
    brandDark: '#0a5555',
    brandLight: '#e6f7f7',
  },
  radius: 'md' as const,
  density: 'comfortable' as const,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={payerTheme}>
      <DxpProvider config={dxpConfig}>
        <App />
      </DxpProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
