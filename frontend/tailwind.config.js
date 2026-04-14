/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FB',
        surface: '#FFFFFF',
        navy: '#1B3A6B',
        blue: {
          electric: '#2D7FF9',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
        cardHover: '0 8px 24px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
