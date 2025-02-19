module.exports = {
  content: ['./src/*/.{svelte,js,ts}'],
  theme: { extend: {} },
  plugins: [require('daisyui'), require('@tailwindcss/typography')],
  };