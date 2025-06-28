import './App.css'

function App() {
  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span>Terminal</span>
        <button 
          className="close-button"
          onClick={() => logseq.hideMainUI({ restoreEditingCursor: true })}
        >
          ×
        </button>
      </div>
      <div className="terminal-content">
        <p>Terminal panel - ready for implementation</p>
      </div>
    </div>
  )
}

export default App