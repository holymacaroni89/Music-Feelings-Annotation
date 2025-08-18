/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        screens: {
            'xs': '390px',    // iPhone 12+
            'sm': '768px',    // Tablets
            'md': '1024px',   // Tablets Querformat
            'lg': '1280px',   // Kleinere Desktops
            'xl': '1920px',   // Standard-Desktop
        },
        colors: {
            // Modern Dark Theme
            'gray': {
                950: '#0a0a0a',
                900: '#111111',
                800: '#1a1a1a',
                700: '#262626',
                600: '#404040',
                500: '#737373',
                400: '#a3a3a3',
                300: '#d4d4d4',
                200: '#e5e5e5',
                100: '#f5f5f5',
                50: '#fafafa',
            },
            // Primary Brand Colors
            'primary': {
                950: '#0c0a09',
                900: '#1c1917',
                800: '#292524',
                700: '#44403c',
                600: '#78716c',
                500: '#a8a29e',
                400: '#d6d3d1',
                300: '#e7e5e4',
                200: '#f2f2f2',
                100: '#fafaf9',
                50: '#fefefe',
            },
            // Accent Colors
            'accent': {
                950: '#1e1b4b',
                900: '#312e81',
                800: '#3730a3',
                700: '#4338ca',
                600: '#6366f1',
                500: '#8b5cf6',
                400: '#a78bfa',
                300: '#c4b5fd',
                200: '#ddd6fe',
                100: '#ede9fe',
                50: '#f5f3ff',
            },
            // Success Colors
            'success': {
                950: '#052e16',
                900: '#14532d',
                800: '#166534',
                700: '#15803d',
                600: '#16a34a',
                500: '#22c55e',
                400: '#4ade80',
                300: '#86efac',
                200: '#bbf7d0',
                100: '#dcfce7',
                50: '#f0fdf4',
            },
            // Warning Colors
            'warning': {
                950: '#451a03',
                900: '#78350f',
                800: '#92400e',
                700: '#b45309',
                600: '#d97706',
                500: '#f59e0b',
                400: '#fbbf24',
                300: '#fcd34d',
                200: '#fde68a',
                100: '#fef3c7',
                50: '#fffbeb',
            },
            // Error Colors
            'error': {
                950: '#450a0a',
                900: '#7f1d1d',
                800: '#991b1b',
                700: '#b91c1c',
                600: '#dc2626',
                500: '#ef4444',
                400: '#f87171',
                300: '#fca5a5',
                200: '#fecaca',
                100: '#fee2e2',
                50: '#fef2f2',
            },
            // Info Colors
            'info': {
                950: '#0c4a6e',
                900: '#0e3a5f',
                800: '#075985',
                700: '#0369a1',
                600: '#0284c7',
                500: '#0ea5e9',
                400: '#38bdf8',
                300: '#7dd3fc',
                200: '#bae6fd',
                100: '#e0f2fe',
                50: '#f0f9ff',
            },
            // Legacy Colors (für Kompatibilität)
            'blue': {
              500: '#3b82f6',
              400: '#60a5fa',
            },
            'red': {
              600: '#dc2626',
              700: '#b91c1c',
            },
            'green': {
              500: '#22c55e',
              600: '#16a34a',
            },
            'yellow': {
                300: '#fbbf24',
                700: '#b45309',
                900: '#78350f'
            }
        }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}
