/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f4f8f6',
          100: '#e3ece7',
          500: '#1e5245',
          600: '#0e3b3a',
          700: '#092b2a',
          800: '#061c1b',
          900: '#03100f',
        },
        editorial: {
          bg: '#F7F5F0',
          card: '#FFFFFF',
          cardMuted: '#FAF8F3',
          sand: '#F2EDE4',
          sandDark: '#E5E0D7',
          border: '#E5E0D7',
          text: '#1C2B26',
          muted: '#6E6A63',
          primary: '#0E3B3A',
          primaryHover: '#092B2A',
          accent: '#C29B38',
        },
      },
    },
  },
  plugins: [],
};
