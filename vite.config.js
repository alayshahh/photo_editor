import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';


export default defineConfig({
  plugins: [react(), wasm(),],
  // Define the base path for production hosting if needed (e.g., if hosted at /editor)
  // base: '/editor/', 
  
  server: {
    // 🚀 CRITICAL: Enables Cross-Origin Isolation for Wasm Threads
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    port: 3000, // You can choose your preferred port
  },
   preview: { // Also add to the preview server if you use it
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  
  // Necessary if you need to access environment variables like process.env.NODE_ENV
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});