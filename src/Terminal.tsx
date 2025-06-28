import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'

interface TerminalComponentProps {
  onClose: () => void;
}

export default function TerminalComponent({ onClose }: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#ffffff40',
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      cursorBlink: true,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();
    
    // Focus the terminal to capture key events
    term.focus();

    setTerminal(term);

    // Start ttyd and connect
    connectToTtyd(term);

    return () => {
      term.dispose();
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  const connectToTtyd = async (term: Terminal) => {
    try {
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();
      
      // ttydのWebSocketプロトコル ['tty'] を使用
      const ws = new WebSocket('ws://127.0.0.1:7681/ws', ['tty']);
      ws.binaryType = 'arraybuffer';
      
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        
        // 認証メッセージを送信（公式と同じ形式）
        const authMsg = JSON.stringify({ 
          AuthToken: '', 
          columns: term.cols, 
          rows: term.rows 
        });
        ws.send(textEncoder.encode(authMsg));
        
        term.focus();
      };

      ws.onmessage = (event) => {
        const rawData = event.data as ArrayBuffer;
        const cmd = String.fromCharCode(new Uint8Array(rawData)[0]);
        const data = rawData.slice(1);
        
        switch (cmd) {
          case '0': // OUTPUT
            term.write(new Uint8Array(data));
            break;
          case '1': // SET_WINDOW_TITLE
            const title = textDecoder.decode(data);
            document.title = title;
            break;
          default:
            console.warn(`[ttyd] unknown command: ${cmd}`);
            break;
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        term.writeln('\r\n\x1b[1;31mConnection closed\x1b[0m');
      };

      ws.onerror = () => {
        setError('Connection error');
        term.writeln('\r\n\x1b[1;31mConnection error\x1b[0m');
      };

      // 入力データの送信（公式と同じバイナリ形式）
      term.onData(data => {
        if (ws.readyState === WebSocket.OPEN) {
          const payload = new Uint8Array(data.length * 3 + 1);
          payload[0] = '0'.charCodeAt(0); // Command.INPUT
          const stats = textEncoder.encodeInto(data, payload.subarray(1));
          ws.send(payload.subarray(0, (stats.written as number) + 1));
        }
      });

      // リサイズ処理
      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          const msg = JSON.stringify({ columns: cols, rows: rows });
          const resizePayload = textEncoder.encode('1' + msg); // Command.RESIZE_TERMINAL
          ws.send(resizePayload);
        }
      });

      setWebsocket(ws);
    } catch (error) {
      setError('Failed to connect to terminal');
      term.writeln('\x1b[31mFailed to connect to terminal\x1b[0m');
    }
  };

  const handleReconnect = () => {
    if (terminal && !isConnected) {
      connectToTtyd(terminal);
    }
  };

  const handleTestInput = () => {
    if (terminal && websocket && websocket.readyState === WebSocket.OPEN) {
      // ttydバイナリプロトコル
      const textEncoder = new TextEncoder();
      const data = 'ls\r';
      const payload = new Uint8Array(data.length * 3 + 1);
      payload[0] = '0'.charCodeAt(0); // Command.INPUT
      const stats = textEncoder.encodeInto(data, payload.subarray(1));
      websocket.send(payload.subarray(0, (stats.written as number) + 1));
    }
  };

  const handleContainerClick = () => {
    // Focus terminal when clicking anywhere in the container
    if (terminal) {
      terminal.focus();
    }
  };

  return (
    <div className="terminal-container" onClick={handleContainerClick}>
      <div className="terminal-header">
        <span>Terminal {isConnected ? '(Connected)' : '(Disconnected)'}</span>
        <div className="terminal-controls">
          {isConnected && (
            <button className="reconnect-button" onClick={handleTestInput}>
              Test Input
            </button>
          )}
          {!isConnected && (
            <button className="reconnect-button" onClick={handleReconnect}>
              Reconnect
            </button>
          )}
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
      <div className="terminal-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <div 
          ref={terminalRef} 
          className="xterm-container"
          onClick={handleContainerClick}
        />
      </div>
    </div>
  );
}