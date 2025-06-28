interface ErrorLog {
  timestamp: string;
  error: string;
  stack?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  props?: any;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  log(error: Error | string, context?: { component?: string; props?: any; url?: string }) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: context?.url || (typeof window !== 'undefined' ? window.location.href : undefined),
      component: context?.component,
      props: context?.props
    };

    this.logs.unshift(errorLog);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('errorLogs', JSON.stringify(this.logs));
      } catch (e) {
        console.warn('Could not save error logs to localStorage:', e);
      }
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('errorLogs');
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Load logs from localStorage on initialization
  loadPersistedLogs() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('errorLogs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Could not load error logs from localStorage:', e);
      }
    }
  }
}

export const errorLogger = new ErrorLogger();

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorLogger.log(event.error || event.message, {
      component: 'Global Error Handler',
      url: window.location.href
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.log(event.reason, {
      component: 'Unhandled Promise Rejection',
      url: window.location.href
    });
  });
}