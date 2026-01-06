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
        // Government-grade color palette
        'gati': {
          primary: '#0A2463',      // Deep navy - Authority
          secondary: '#1E5AA8',    // Government blue
          accent: '#00B4D8',       // Cyan accent
          light: '#90E0EF',        // Light cyan
          glow: '#48CAE4',         // Glow effect
          white: '#FAFBFC',        // Bright white
          surface: '#FFFFFF',      // Pure white
          text: '#1A1A2E',         // Dark text
          muted: '#6B7280',        // Muted text
          success: '#10B981',      // Success green
          warning: '#F59E0B',      // Warning amber
          danger: '#EF4444',       // Danger red
          critical: '#DC2626',     // Critical
        },
        // Severity colors
        'severity': {
          low: '#10B981',
          medium: '#F59E0B', 
          high: '#EF4444',
          critical: '#7C3AED',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gati-gradient': 'linear-gradient(135deg, #0A2463 0%, #1E5AA8 50%, #00B4D8 100%)',
        'glow-gradient': 'radial-gradient(ellipse at center, rgba(72, 202, 228, 0.15) 0%, transparent 70%)',
        'mesh-gradient': 'linear-gradient(135deg, rgba(10, 36, 99, 0.03) 0%, rgba(0, 180, 216, 0.05) 100%)',
      },
      boxShadow: {
        'gati': '0 4px 20px rgba(0, 180, 216, 0.15)',
        'gati-lg': '0 8px 40px rgba(0, 180, 216, 0.2)',
        'glow': '0 0 30px rgba(72, 202, 228, 0.3)',
        'glow-intense': '0 0 50px rgba(72, 202, 228, 0.5)',
        'panel': '0 2px 15px rgba(10, 36, 99, 0.08)',
        'panel-hover': '0 8px 30px rgba(10, 36, 99, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'count-up': 'countUp 2s ease-out forwards',
        'grid-flow': 'gridFlow 20s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { opacity: 0.5, filter: 'brightness(1)' },
          '100%': { opacity: 1, filter: 'brightness(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        countUp: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        gridFlow: {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '100%': { transform: 'translateX(-50px) translateY(-50px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
