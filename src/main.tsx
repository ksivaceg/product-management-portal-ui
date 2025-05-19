// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// You might have a global CSS file for fonts or base styles, e.g., import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

