import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#010E2A',
          green: '#22B974',
          brightGreen: '#2ECD8A',
          darkGreen: '#16794C',
          surface: '#F4F4F6',
          mint: '#D1EBE0',
          inactive: '#A9B2C3',
        },
        semantic: {
          errorLight: '#FEE4E2',
          errorDark: '#B42318',
          warningLight: '#FEF0C7',
          warningDark: '#B54708',
          infoLight: '#E0F2FE',
          infoDark: '#026AA2',
          successLight: '#D1EBE0',
          successDark: '#16794C',
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      height: {
        'screen-dvh': '100dvh',
      },
      minHeight: {
        'screen-dvh': '100dvh',
      }
    },
  },
  plugins: [],
};

export default config;
