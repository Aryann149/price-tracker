import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --bg2: #111118;
    --bg3: #1a1a24;
    --border: #2a2a38;
    --border2: #3a3a50;
    --text: #f0f0f8;
    --text2: #a0a0b8;
    --text3: #606080;
    --accent: #6366f1;
    --accent2: #818cf8;
    --green: #10b981;
    --red: #ef4444;
    --yellow: #f59e0b;
    --card: #13131e;
    --radius: 14px;
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  h1, h2, h3, h4, h5 {
    font-family: var(--font-display);
    line-height: 1.2;
  }

  input, textarea, select {
    font-family: var(--font-body);
  }

  button {
    font-family: var(--font-body);
    cursor: pointer;
  }

  a { text-decoration: none; color: inherit; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg2); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .animate-in { animation: fadeIn 0.4s ease forwards; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
