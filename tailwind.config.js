module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "quiz-blue": {
          DEFAULT: "#246F9A",
          50: "#90C6E5",
          100: "#80BEE1",
          200: "#5FADDA",
          300: "#3E9CD2",
          400: "#2C87BB",
          500: "#246F9A",
          600: "#1B5475",
          700: "#133950",
          800: "#0A1F2A",
          900: "#010405",
        },
        "quiz-orange": {
          DEFAULT: "#E5863E",
          50: "#FBEBE0",
          100: "#F8E0CE",
          200: "#F4CAAA",
          300: "#EFB386",
          400: "#EA9D62",
          500: "#E5863E",
          600: "#CF691C",
          700: "#9E5015",
          800: "#6C370F",
          900: "#3B1E08",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
