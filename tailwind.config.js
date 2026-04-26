module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      spacing: {
        '2/3': '66.666667%',
      },
      // Japanese colour palette
      // pink  → sakura (cherry blossom) tones
      // indigo → ai (Japanese indigo) tones
      colors: {
        pink: {
          100: '#fce8ef',
          200: '#f7c6d5',
          300: '#f0a0b8',
          400: '#e57898',
          500: '#d4688a', // sakura deep — icon accents
          600: '#b5476b', // beni-crimson — buttons & primary CTAs
          700: '#923053',
          800: '#6e1e3c',
          900: '#4b0f26',
        },
        indigo: {
          100: '#e8edf5',
          200: '#c5d0e6',
          300: '#9aadd1',
          400: '#6e88b8',
          500: '#4a659e',
          600: '#334e82',
          700: '#243a66',
          800: '#1a2c50',
          900: '#111e38', // ai-indigo deep — hover states
        },
      },
      fontFamily: {
        sans: ['"Noto Serif JP"', 'Georgia', 'serif'],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],

};
