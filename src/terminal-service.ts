class TerminalService {
  private ttydProcess: any = null;
  private isRunning = false;

  async startTtyd(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }

    try {
      // Check if ttyd is already running on port 7681
      const response = await fetch('http://127.0.0.1:7681', { 
        method: 'HEAD',
        mode: 'no-cors'
      }).catch(() => null);
      
      if (response || this.isPortOpen()) {
        this.isRunning = true;
        return true;
      }

      // Start ttyd process using logseq.App.invokeExternalCommand if available
      // Since Logseq plugins run in browser context, we'll assume ttyd is manually started
      console.log('Please start ttyd manually with: ttyd --writable -p 7681 -i 127.0.0.1 "C:\\Program Files\\Git\\git-bash.exe"');
      
      // Wait for ttyd to start
      return this.waitForTtyd();
    } catch (error) {
      console.error('Failed to start ttyd:', error);
      return false;
    }
  }

  private async waitForTtyd(maxAttempts = 10): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const ws = new WebSocket('ws://127.0.0.1:7681/ws');
        await new Promise((resolve, reject) => {
          ws.onopen = resolve;
          ws.onerror = reject;
          setTimeout(reject, 1000);
        });
        ws.close();
        this.isRunning = true;
        return true;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  }

  private isPortOpen(): boolean {
    // This is a simplified check - in browser context we can't directly check ports
    // We'll rely on WebSocket connection attempts
    return false;
  }

  stopTtyd(): void {
    if (this.ttydProcess) {
      // In browser context, we can't directly kill processes
      // User will need to manually stop ttyd
      console.log('Please manually stop the ttyd process');
      this.ttydProcess = null;
    }
    this.isRunning = false;
  }

  isConnected(): boolean {
    return this.isRunning;
  }
}

export const terminalService = new TerminalService();