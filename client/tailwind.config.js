/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#FDF4F6',
          100: '#FAE8EC',
          200: '#F5D3DB',
          300: '#EAAEB9',
          400: '#D9798C',
          500: '#7B1E3A', // Brand Primary Maroon
          600: '#691830',
          700: '#521225', // Royal Crimson Dark
          800: '#400C1B',
          900: '#2D0712',
          950: '#1A0309',
        },
        gold: {
          50: '#FBF8F1',
          100: '#F6EEDD',
          200: '#EDDCBA',
          300: '#DFC28F',
          400: '#D4AF67',
          500: '#C9A24B', // Brand Antique Gold
          600: '#B08838',
          700: '#8E6B29',
          800: '#6F5222',
          900: '#523C1A',
        },
        cream: {
          50: '#FFFEFA',
          100: '#FFFCF7',
          200: '#FFF8EE', // Brand Warm Cream
          300: '#F7EEDF',
          400: '#ECE0CE',
          500: '#D9C8B2',
          600: '#BDB09E',
        },
        charcoal: {
          DEFAULT: '#2B2B2B',
          light: '#4A4A4A',
          muted: '#6B6B6B',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        royal: '0 10px 30px -5px rgba(123, 30, 58, 0.08), 0 4px 10px -2px rgba(201, 162, 75, 0.05)',
        'royal-lg': '0 20px 45px -10px rgba(123, 30, 58, 0.16), 0 8px 20px -4px rgba(201, 162, 75, 0.12)',
        gold: '0 4px 20px -2px rgba(201, 162, 75, 0.25)',
        'gold-lg': '0 10px 30px -5px rgba(201, 162, 75, 0.45)',
        card: '0 4px 15px rgba(43, 43, 43, 0.04), 0 1px 3px rgba(43, 43, 43, 0.06)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 12px rgba(201,162,75,0.35))' },
          '50%': { filter: 'drop-shadow(0 0 24px rgba(201,162,75,0.65))' },
        },
      },
      animation: {
        float: 'float 4.5s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
