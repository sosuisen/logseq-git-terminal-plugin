import './App.css'
import TerminalComponent from './Terminal'

function App() {
  const handleClose = () => {
    logseq.hideMainUI({ restoreEditingCursor: true });
  };

  return (
    <TerminalComponent onClose={handleClose} />
  );
}

export default App