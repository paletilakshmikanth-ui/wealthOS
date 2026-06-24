'use client';

import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('WealthOS ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-2xl w-full glass-strong rounded-xl p-6 border border-rose-500/30">
            <h2 className="text-xl font-bold text-rose-400 mb-2">Component Error</h2>
            <p className="text-sm text-muted-foreground mb-4">An error occurred while rendering this view.</p>
            <pre className="text-xs text-rose-300 bg-black/40 p-3 rounded-md overflow-auto max-h-96 scroll-thin font-mono">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-3 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
