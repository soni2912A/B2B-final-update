/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        bg:       'rgb(var(--bg) / <alpha-value>)',
        surface:  'rgb(var(--surface) / <alpha-value>)',
        surface2: 'rgb(var(--surface2) / <alpha-value>)',
        border:   'rgb(var(--border) / <alpha-value>)',
        border2:  'rgb(var(--border2) / <alpha-value>)',
        text1:    'rgb(var(--text1) / <alpha-value>)',
        text2:    'rgb(var(--text2) / <alpha-value>)',
        text3:    'rgb(var(--text3) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          light:   'rgb(var(--accent-light) / <alpha-value>)',
          mid:     'rgb(var(--accent-mid) / <alpha-value>)',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)',
        lg: '0 4px 16px rgba(0,0,0,.10)',
      },
    },
  },
  plugins: [],
}
