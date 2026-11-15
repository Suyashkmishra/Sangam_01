import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F6EDE0",
          50: "#FDFAF6",
          100: "#FAF4EC",
          200: "#F6EDE0",
          300: "#EFE0CD",
          400: "#E3CEB3",
        },
        espresso: {
          DEFAULT: "#2A1A12",
          50: "#F2EBE7",
          100: "#DFD2CA",
          200: "#BAA191",
          300: "#95725C",
          400: "#5D3E2A",
          500: "#2A1A12",
          600: "#22150E",
          700: "#1A100B",
          800: "#120B07",
          900: "#0A0604",
        },
        copper: {
          DEFAULT: "#B8622E",
          50: "#FAF1EC",
          100: "#F5DEC9",
          200: "#EAB996",
          300: "#DF9363",
          400: "#D3743C",
          500: "#B8622E",
          600: "#9C4F22",
          700: "#7C3E1B",
          800: "#5D2E14",
          900: "#3D1E0D",
        },
        antiqueGold: {
          DEFAULT: "#A8751F",
          light: "#C5933A",
          dark: "#875C14",
        },
        parchment: {
          DEFAULT: "#FAF5EE",
          card: "#FFFFFFD9",
          border: "#E9DAC9",
          hover: "#F3E7D7",
        },
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Outfit'", "system-ui", "sans-serif"],
        devanagari: ["'Noto Sans Devanagari'", "sans-serif"],
        kannada: ["'Noto Sans Kannada'", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.625rem",
        lg: "0.875rem",
        xl: "1.25rem",
        "2xl": "1.75rem",
      },
      boxShadow: {
        subtle: "0 2px 10px -2px rgba(42, 26, 18, 0.05), 0 1px 3px -1px rgba(42, 26, 18, 0.04)",
        card: "0 4px 20px -4px rgba(42, 26, 18, 0.08)",
        floating: "0 10px 30px -5px rgba(42, 26, 18, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
