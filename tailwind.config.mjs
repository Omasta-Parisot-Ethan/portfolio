/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        eop: {
          dark: '#232836',
          light: '#f5dbf7',
          offwhite: '#fffaff',
          rose: '#e8bce9',
        },
      },
      fontFamily: {
        display: ['"Syne"', '"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      transitionTimingFunction: {
        'eop-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'eop-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
};
