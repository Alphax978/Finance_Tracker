import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// tailwindcss() compiles the Tailwind classes used across src/ into the CSS
// bundle. It pairs with the @import lines at the top of src/index.css.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
