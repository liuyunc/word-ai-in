import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'office-js';

Office.onReady(() => {
  const container = document.getElementById('container');

  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
});
