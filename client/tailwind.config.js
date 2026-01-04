/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Devzip Command Stack 전용 테마 (Dark Terminal)
        terminal: {
          bg: '#1e1e1e',      // 배경: VSCode Dark
          text: '#d4d4d4',    // 텍스트: Light Gray
          green: '#22c55e',   // 강조/실행중
          cyan: '#38bdf8',    // Task 강조
          red: '#ef4444',     // 에러/취소
          border: '#404040',  // 경계선
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
