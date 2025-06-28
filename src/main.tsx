import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import '@logseq/libs'
import { SimpleCommandKeybinding } from '@logseq/libs/dist/LSPlugin'

const openTerminal = () => {
  logseq.showMainUI();
}

function main() {
  const command: {
    key: string;
    keybinding: SimpleCommandKeybinding
    label: string;
  } = {
    key: 'terminal:open',
    keybinding: {
      binding: 'mod+shift+t',
      mode: 'global',
    },
    label: 'Open Terminal',
  };
  logseq.App.registerCommandPalette(command, openTerminal);

  logseq.setMainUIInlineStyle({
    position: 'fixed',
    zIndex: 20,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '400px',
    backgroundColor: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '8px',
  })

  document.body.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.length === 0) {
      logseq.hideMainUI({ restoreEditingCursor: true });
    }
  });

  const appElement = document.getElementById('app')!;
  appElement.addEventListener('click', e => {
    e.stopPropagation();
  });

  // Prevent Logseq from capturing key events when terminal is focused
  appElement.addEventListener('keydown', e => {
    e.stopPropagation();
  });
  
  appElement.addEventListener('keyup', e => {
    e.stopPropagation();
  });
  
  appElement.addEventListener('keypress', e => {
    e.stopPropagation();
  });

  ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

logseq.ready({
  openTerminal
}, main).catch(console.error)