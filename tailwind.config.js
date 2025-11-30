/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

export default {
  content: [
    "./index.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFBF0', 100: '#FFF4D6', 200: '#FFE9AD', 300: '#FFD978', 400: '#FFC85C',
          500: '#FFB84D', 600: '#D4AF37', 700: '#B8941F', 800: '#997A0B', 900: '#7A6108',
        },
        secondary: {
          50: '#FFF1F1', 100: '#FFDCDC', 200: '#FFB4B4', 300: '#FF8A8A', 400: '#E35C5C',
          500: '#A11D1F', 600: '#8B0000', 700: '#6B0000', 800: '#4D0000', 900: '#2D0000',
        },
        neutral: {
          50: '#F7F5F4', 100: '#E6E4E3', 200: '#C9C6C5', 300: '#9E9B9A', 400: '#6B6867',
          500: '#3A3938', 600: '#2A2827', 700: '#1F1E1D', 800: '#1A1918', 850: '#151413',
          900: '#111111', 950: '#0A0A0A',
        },
        success: {
          50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC', 400: '#4ADE80',
          500: '#22C55E', 600: '#16A34A', 700: '#15803D', 800: '#166534', 900: '#14532D',
        },
        warning: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24',
          500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F',
        },
        error: {
          50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5', 400: '#F87171',
          500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D',
        },
        danger: {
          50: '#FFF1F1', 100: '#FFDCDC', 200: '#FFB4B4', 300: '#FF8A8A', 400: '#E35C5C',
          500: '#A11D1F', 600: '#8B0000', 700: '#6B0000', 800: '#4D0000', 900: '#2D0000',
        },
        info: {
          50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD', 300: '#7DD3FC', 400: '#38BDF8',
          500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1', 800: '#075985', 900: '#0C4A6E',
        },
        'bg-base': '#0A0A0A', 'bg-elevated': '#111111', 'bg-surface': '#1A1918',
        'bg-modal': '#1F1E1D', 'bg-input': '#2A2827', 'bg-hover': '#3A3938',
        'text-primary': '#F7F5F4', 'text-secondary': '#E6E4E3',
        'text-muted': '#C9C6C5', 'text-disabled': '#9E9B9A',
        'border-subtle': 'rgba(255, 184, 77, 0.08)',
        'border-default': 'rgba(255, 184, 77, 0.15)',
        'border-strong': 'rgba(255, 184, 77, 0.25)', 'border-focus': '#FFB84D',
        'overlay-light': 'rgba(10, 10, 10, 0.5)',
        'overlay-heavy': 'rgba(10, 10, 10, 0.85)',
        'overlay-modal': 'rgba(10, 10, 10, 0.75)',
        gold: { 500: '#FFB84D', 600: '#D4AF37', 700: '#B8941F', },
        dark: { 
          DEFAULT: '#0f172a',
          50: '#F7F5F4', 100: '#E6E4E3', 200: '#C9C6C5', 300: '#9E9B9A',
          600: '#2A2827', 700: '#1F1E1D', 800: '#1A1918', 850: '#151413',
          900: '#111111', 950: '#0A0A0A', 
        },
        accent: { 500: '#FFB84D', 600: '#D4AF37', },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'], display: ['Playfair Display', 'serif'], },
      boxShadow: {
        'subtle': '0 4px 12px rgba(0, 0, 0, 0.6)', 'strong': '0 10px 25px rgba(0, 0, 0, 0.8)',
        'gold': '0 4px 20px rgba(255, 184, 77, 0.4), 0 0 40px rgba(255, 184, 77, 0.15)',
        'gold-glow': '0 0 30px rgba(255, 184, 77, 0.3), 0 0 60px rgba(255, 184, 77, 0.15)',
        'red-glow': '0 0 20px rgba(161, 29, 31, 0.4), 0 0 40px rgba(161, 29, 31, 0.2)',
        'inner-dark': 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
        'lifted': '0 8px 32px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: { 'xl': '0.75rem', '2xl': '1rem', '3xl': '1.5rem', },
      backgroundImage: {
        'theatre-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #111111 50%, #1A1918 100%)',
        'theatre-radial': 'radial-gradient(ellipse at top, #1A1918 0%, #111111 50%, #0A0A0A 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FFC85C 0%, #FFB84D 50%, #D4AF37 100%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255, 184, 77, 0.3) 50%, transparent 100%)',
        'red-gradient': 'linear-gradient(135deg, #E35C5C 0%, #A11D1F 50%, #8B0000 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(26, 25, 24, 0.95) 0%, rgba(17, 17, 17, 0.98) 100%)',
        'overlay-gradient': 'linear-gradient(180deg, rgba(10, 10, 10, 0) 0%, rgba(10, 10, 10, 0.8) 100%)',
      },
      backdropBlur: { xs: '2px', },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out', 'slide-in': 'slideIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out', 'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite', 'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' }, },
        slideIn: { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' }, },
        slideUp: { from: { opacity: '0', transform: 'translateY(100%)' }, to: { opacity: '1', transform: 'translateY(0)' }, },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' }, },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 184, 77, 0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(255, 184, 77, 0)' }, },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' }, },
        glow: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' }, },
      },
    },
  },
  plugins: [ require('@tailwindcss/forms'), ],
};
