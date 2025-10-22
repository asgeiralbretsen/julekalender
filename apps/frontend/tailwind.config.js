/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'christmas': '0 10px 30px -5px rgba(127, 29, 29, 0.3)',
        'christmas-lg': '0 20px 40px -10px rgba(127, 29, 29, 0.4)',
      },
    },
  },
  plugins: [],
}
