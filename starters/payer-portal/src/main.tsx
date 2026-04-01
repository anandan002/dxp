import React from 'react';
import ReactDOM from 'react-dom/client';
import { DxpProvider } from '@dxp/sdk-react';
import { ThemeProvider } from '@dxp/ui';
import { App } from './App';
import './index.css';

// Engagement-specific config
// In dev, point directly to BFF (bypasses Kong + Keycloak — DEV_AUTH_BYPASS=true in BFF)
const dxpConfig = {
  bffUrl: 'http://localhost:4201/api/v1',
  getAccessToken: async () => null,
};

// Healthcare teal brand — change these per engagement. Everything else adapts.
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
