import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#2563eb',
          600: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
