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
        // 🎭 INSPIRATION POINT THEATRE - Cinematografische Dark Palette
        // Modern, koel, premium met goudaccent | WCAG AA+ compliant
        
        // ═══════════════════════════════════════════════
        // PRIMARY: Gold (Theater spotlight - enige warme accent)
        // ═══════════════════════════════════════════════
        primary: {
          50: '#FFFBF0',
          100: '#FFF4D6',
          200: '#FFE9AD',
          300: '#FFD978',
          400: '#FFC85C',
          500: '#FFB84D',  // ⭐ Main CTA
          600: '#F5A938',  // Hover
          700: '#E69821',  // Active
          800: '#CC7A0B',
          900: '#A86208',
        },
        
        // ═══════════════════════════════════════════════
        // SECONDARY: Iris (Cinematografisch accent - optioneel)
        // ═══════════════════════════════════════════════
        secondary: {
          50: '#EEEEFF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',  // ⭐ Secondary actions
          600: '#4F46E5',  // Hover
          700: '#4338CA',  // Active
          800: '#3730A3',
          900: '#312E81',
        },
        
        // ═══════════════════════════════════════════════
        // NEUTRAL: Koele blauw-grijs (Theater dark atmosphere)
        // ═══════════════════════════════════════════════
        neutral: {
          50: '#F8FAFC',   // Bijna wit (text on light bg)
          100: '#E6ECF5',  // Text primary (zacht wit-blauw)
          200: '#B8C3D6',  // Text secondary
          300: '#8A98B3',  // Text muted
          400: '#5A6680',  // Text disabled
          500: '#3D4D6B',  // Border strong
          600: '#2B3650',  // Border default / Input bg
          700: '#222D42',  // Modal bg
          800: '#1B2437',  // Surface bg (cards)
          850: '#151D2E',  // Card elevated variant
          900: '#121A2B',  // Elevated containers
          950: '#0B1020',  // ⭐ Body bg (diepste cinema-zwart)
        },
        
        // ═══════════════════════════════════════════════
        // SEMANTIC STATES
        // ═══════════════════════════════════════════════
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',  // ⭐ Main
          600: '#16A34A',  // Hover
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',  // Focus ring variant
          400: '#FBBF24',
          500: '#F59E0B',  // ⭐ Main
          600: '#D97706',  // Hover
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',  // ⭐ Main
          600: '#DC2626',  // Hover
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',  // ⭐ Main (cyaan - cinematografisch)
          500: '#0EA5E9',  // Hover
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        
        // ═══════════════════════════════════════════════
        // � SEMANTIC TOKENS (gebruik deze in alle components!)
        // ═══════════════════════════════════════════════
        
        // Backgrounds (dark → light)
        'bg-base': '#0B1020',        // Body (neutral-950)
        'bg-elevated': '#121A2B',    // Containers (neutral-900)
        'bg-surface': '#1B2437',     // Cards (neutral-800)
        'bg-modal': '#222D42',       // Modals (neutral-700)
        'bg-input': '#2B3650',       // Inputs (neutral-600)
        'bg-hover': '#364363',       // Hover (tussenwaarde)
        
        // Text (light → dark)
        'text-primary': '#E6ECF5',   // Headings (neutral-100)
        'text-secondary': '#B8C3D6', // Body (neutral-200)
        'text-muted': '#8A98B3',     // Subtle (neutral-300)
        'text-disabled': '#5A6680',  // Disabled (neutral-400)
        
        // Borders
        'border-subtle': '#1F2A3F',  // Dividers (tussenwaarde)
        'border-default': '#2B3650', // Default (neutral-600)
        'border-strong': '#3D4D6B',  // Strong (neutral-500)
        'border-focus': '#FCD34D',   // Focus ring (warning-300 glow)
        
        // Overlays
        'overlay-light': 'rgba(11, 16, 32, 0.5)',   // 50%
        'overlay-heavy': 'rgba(11, 16, 32, 0.85)',  // 85%
        'overlay-modal': 'rgba(11, 16, 32, 0.75)',  // Modal backdrop
        
        // ═══════════════════════════════════════════════
        // Aliassen voor backwards compatibility
        // ═══════════════════════════════════════════════
        gold: {
          500: '#FFB84D',
          600: '#F5A938',
          700: '#E69821',
        },
        dark: {
          50: '#E6ECF5',
          100: '#B8C3D6',
          200: '#8A98B3',
          300: '#5A6680',
          600: '#2B3650',
          700: '#222D42',
          800: '#1B2437',
          850: '#151D2E',
          900: '#121A2B',
          950: '#0B1020',
        },
        accent: {
          500: '#FFB84D',
          600: '#F5A938',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        // Cinematografische shadows (subtiel, modern)
        'subtle': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'strong': '0 10px 25px rgba(0, 0, 0, 0.6)',
        'gold': '0 4px 20px rgba(255, 184, 77, 0.3), 0 0 40px rgba(255, 184, 77, 0.12)',
        'gold-glow': '0 0 30px rgba(255, 184, 77, 0.25), 0 0 60px rgba(255, 184, 77, 0.12)',
        'inner-dark': 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
        'lifted': '0 8px 32px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        // Cinematografische gradients (koele blauw-grijs)
        'theatre-gradient': 'linear-gradient(135deg, #0B1020 0%, #121A2B 50%, #1B2437 100%)',
        'theatre-radial': 'radial-gradient(ellipse at top, #1B2437 0%, #121A2B 50%, #0B1020 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FFC85C 0%, #FFB84D 50%, #F5A938 100%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255, 184, 77, 0.3) 50%, transparent 100%)',
        'iris-gradient': 'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(27, 36, 55, 0.95) 0%, rgba(18, 26, 43, 0.98) 100%)',
        'overlay-gradient': 'linear-gradient(180deg, rgba(11, 16, 32, 0) 0%, rgba(11, 16, 32, 0.8) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 184, 53, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245, 184, 53, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};