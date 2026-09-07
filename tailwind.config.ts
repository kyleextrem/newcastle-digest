import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif-main': ['Georgia', 'serif'],
        'serif-alt': ['EB Garamond', 'serif'],
        'sans-main': ['DM Sans', 'sans-serif'],
        'sans-display': ['Montserrat', 'sans-serif'],
        'mono-main': ['Fira Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
