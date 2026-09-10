import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Essencial para que os caminhos das imagens e scripts sejam relativos
  build: {
    outDir: 'dist',
    rollupOptions: {
       input: './index.html',
  },
},
});
