export interface SystemCommand {
  type: 'search' | 'media' | 'research' | 'app';
  action: string;
  query?: string;
}

class SystemService {
  private listeners: ((command: SystemCommand) => void)[] = [];

  public subscribe(callback: (command: SystemCommand) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(command: SystemCommand) {
    this.listeners.forEach(l => l(command));
  }

  public executeCommand(command: string): string | null {
    const cmd = command.toLowerCase();
    
    // 1. Research / Search
    if (cmd.includes('research') || cmd.includes('search for') || cmd.includes('look up')) {
      const query = cmd.replace(/research|search for|look up/g, '').trim();
      if (query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        return `Initiating research on: ${query}. Opening browser tab.`;
      }
    }

    // 2. Media - Music
    if (cmd.includes('play song') || cmd.includes('play music') || cmd.includes('listen to')) {
      const query = cmd.replace(/play song|play music|listen to/g, '').trim();
      window.open(`https://music.youtube.com/search?q=${encodeURIComponent(query || 'lofi')}`, '_blank');
      return `Accessing audio manifold. Playing ${query || 'recommended music'}.`;
    }

    // 3. Media - Video
    if (cmd.includes('play video') || cmd.includes('watch')) {
      const query = cmd.replace(/play video|watch/g, '').trim();
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
      return `Opening visual stream for: ${query}.`;
    }

    // 4. Browser / Apps
    if (cmd.includes('open browser') || cmd.includes('new tab')) {
      window.open('https://www.google.com', '_blank');
      return "Opening a new browser interface.";
    }

    return null;
  }
}

export const systemService = new SystemService();
