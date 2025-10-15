// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node'; // ✅ Ajout de l’adapter Node

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }), // ✅ Configuration de l’adapter pour SSR
  vite: {
    plugins: [tailwindcss()],
  },
});