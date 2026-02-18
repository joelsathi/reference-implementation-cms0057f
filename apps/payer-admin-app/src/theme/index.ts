import { OxygenTheme } from '@wso2/oxygen-ui';

// Extend the OxygenUI theme with custom tokens
export const customTheme = {
  ...OxygenTheme,
  palette: {
    ...OxygenTheme.palette,
    text: {
      ...OxygenTheme.palette.text,
      tertiary: OxygenTheme.palette.mode === 'light' ? '#00000099' : '#FFFFFF99',
    },
  },
};
