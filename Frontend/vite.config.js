import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('C:/Users/User/Documents/Cryptalytix/Cryptalytix-B/Cryptalytix_auth/Cryptalytix_auth/localhost-key.pem'),
      cert: fs.readFileSync('C:/Users/User/Documents/Cryptalytix/Cryptalytix-B/Cryptalytix_auth/Cryptalytix_auth/localhost-cert.pem'),
    },
    host: 'localhost',
    port: 5173,
  },
});
