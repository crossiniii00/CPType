/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#000000",
          charcoal: "#0A0A0A",
          gray: "#1A1A1A",
          red: {
            DEFAULT: "#0B3A78",
            hover: "#082E5F",
            glow: "rgba(11, 58, 120, 0.2)",
          },
          white: "#FFFFFF",
          "soft-white": "#F5F5F5",
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        segoe: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-red': 'pulseRed 2s infinite',
        'caret-blink': 'caretBlink 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(11, 58, 120, 0.4)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(11, 58, 120, 0)' },
        },
        caretBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
