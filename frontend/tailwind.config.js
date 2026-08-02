/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecf7f0',
          100: '#d8eee0',
          500: '#14532d',
          600: '#0f5237',
          700: '#0b412b',
          800: '#083221',
          900: '#03100f',
        },
        editorial: {
          bg: '#F7F5F0',
          card: '#FFFFFF',
          cardMuted: '#F8FAF9',
          sand: '#ECF7F0',
          sandDark: '#E2E8F0',
          border: '#E2E8F0',
          text: '#1E293B',
          muted: '#64748B',
          primary: '#0F5237',
          primaryHover: '#0B412B',
          accent: '#16A34A',
        },
      },
    },
  },
  plugins: [],
};
