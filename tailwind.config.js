/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purpleCustom: "#A020F0",
        coral: "#FF7F50",
        // Add a darker shade of Coral if you need it for hover states or contrast
        "coral-dark": "#E57370",
      },
    },
  },
  plugins: [],
};
