'use client';

import React, { useState, useEffect } from 'react';
import { errorLogger } from '@/lib/errorLogger';

export function ErrorLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    errorLogger.loadPersistedLogs();
    setLogs(errorLogger.getLogs());
  }, []);

  const refreshLogs = () => {
    setLogs(errorLogger.getLogs());
  };

  const clearLogs = () => {
    errorLogger.clearLogs();
    setLogs([]);
  };

  const downloadLogs = () => {
    const dataStr = errorLogger.exportLogs();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors z-50"
        title="View Error Logs"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {logs.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-yellow-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {logs.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Error Logs ({logs.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={refreshLogs}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={downloadLogs}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Download
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No errors logged yet</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{log.timestamp}</span>
                    {log.component && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {log.component}
                      </span>
                    )}
                  </div>
                  <div className="text-red-600 font-medium mb-2">{log.error}</div>
                  {log.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                  {log.url && (
                    <div className="text-xs text-gray-500 mt-2">URL: {log.url}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}