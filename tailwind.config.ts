import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0c1410",
        nature: {
          base: "#0c1410",
          surface: "#14201a",
          card: "#1b2a23",
          subtle: "#283c32",
          highlight: "#3d584a",
          primary: "#ecf3ee",
          secondary: "#9cb5a6",
          muted: "#647d70",
          sage: "#81a890",
          eucalyptus: "#588e73",
          clay: "#c48b71",
          amber: "#d4a373",
          bubbleUser: "#22382c",
          bubbleAi: "#17241d",
        },
        surface: {
          50: "#22382c",
          100: "#1b2a23",
          200: "#14201a",
          300: "#0c1410",
        },
        sattva: {
          light: "#81a890",
          DEFAULT: "#588e73",
          dark: "#283c32",
        },
        rajas: {
          light: "#d4a373",
          DEFAULT: "#c48b71",
          dark: "#8c563d",
        },
        tamas: {
          light: "#9cb5a6",
          DEFAULT: "#647d70",
          dark: "#283c32",
        },
        vata: {
          light: "#a8c5b5",
          DEFAULT: "#81a890",
          dark: "#3d584a",
        },
        pitta: {
          light: "#e2b88b",
          DEFAULT: "#d4a373",
          dark: "#a67347",
        },
        kapha: {
          light: "#81a890",
          DEFAULT: "#588e73",
          dark: "#1b2a23",
        },
        ojas: {
          glow: "#ecf3ee",
          gold: "#d4a373",
        },
        crisis: {
          bg: "#381818",
          border: "#b94a48",
          text: "#f0c4c4",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "organicBreath 4s ease-in-out infinite",
        "organic-breath": "organicBreath 4s ease-in-out infinite",
        "wave-glow": "waveGlow 3s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
        "breath-cycle": "breathCycle 16s ease-in-out infinite",
      },
      keyframes: {
        organicBreath: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.03)", opacity: "1" },
        },
        waveGlow: {
          "0%": { opacity: "0.35", filter: "blur(20px)" },
          "100%": { opacity: "0.7", filter: "blur(32px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        breathCycle: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "25%": { transform: "scale(1.3)", opacity: "0.95" },
          "50%": { transform: "scale(1.3)", opacity: "0.95" },
          "75%": { transform: "scale(1)", opacity: "0.6" },
        }
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(12, 20, 16, 0.5)",
        glow: "0 0 25px -5px rgba(129, 168, 144, 0.35)",
        "glow-warm": "0 0 30px -5px rgba(212, 163, 115, 0.25)",
        "glow-sage": "0 0 25px -5px rgba(129, 168, 144, 0.4)",
        "glow-eucalyptus": "0 0 25px -5px rgba(88, 142, 115, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
