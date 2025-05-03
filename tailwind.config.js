/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6ee7b7',    // Emerald 300
        secondary: '#10b981',  // Emerald 500
        background: '#f0fdf4', // Green 50
        surface: '#ffffff',     // White
        'surface-alt': '#f9fafb', // Gray 50
        'text-primary': '#1f2937', // Gray 800
        'text-secondary': '#6b7280', // Gray 500
        accent: '#f59e0b',    // Amber 500
        success: '#22c55e',    // Green 500
        error: '#ef4444',      // Red 500
      },
    },
  },
  plugins: [
    ('@tailwindcss/line-clamp')
  ],
}
