/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        colors: {
            'gray': {
                900: '#1a1d21',
                800: '#23272d',
                700: '#30363d',
                600: '#484f58',
                500: '#6e7681',
                400: '#909dab',
                300: '#cdd5e0',
                200: '#f0f6fc',
                100: '#ffffff',
            },
            'blue': {
              500: '#2f81f7',
              400: '#388bfd',
            },
            'red': {
              600: '#d83c3e',
              700: '#b22527',
            },
            'green': {
              500: '#2a9d3c',
              600: '#238636',
            },
             'yellow': {
                300: '#d29922',
                700: '#6e5513',
                900: '#34290f'
            }
        }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}
