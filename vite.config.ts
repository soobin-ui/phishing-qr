import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages 어느 경로에 올려도 열리도록 상대경로 빌드
  base: './',
  plugins: [react(), tailwindcss()],
  // host: true → 같은 와이파이의 실제 휴대폰에서 접속해 테스트할 수 있습니다
  server: { host: true, port: 5174 },
})
