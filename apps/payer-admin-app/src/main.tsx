import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OxygenUIThemeProvider } from '@wso2/oxygen-ui';
import { customTheme } from './theme';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OxygenUIThemeProvider theme={customTheme}>
      <App />
    </OxygenUIThemeProvider>
  </StrictMode>
);
