import React from 'react';
import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/theme/ThemeProvider';

import '../src/storybook.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div style={{ fontFamily: 'var(--dxp-font)', padding: '2rem' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /date$/i } },
    layout: 'padded',
  },
};

export default preview;
