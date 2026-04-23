module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#F1F8E9', 100: '#DCEDC8', 200: '#C8E6C9',
          300: '#A5D6A7', 400: '#81C784', 500: '#66BB6A',
          600: '#43A047', 700: '#2E7D32', 800: '#1B5E20',
          900: '#154318'
        }
      },
      fontFamily: { sans: ['Inter', 'Segoe UI', 'sans-serif'] },
      boxShadow: {
        card: '0 2px 12px rgba(27,94,32,0.08)',
        nav:  '0 -2px 16px rgba(27,94,32,0.12)'
      }
    }
  },
  plugins: []
}