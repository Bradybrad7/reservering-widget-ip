import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Log to error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });

    this.setState({
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-800 rounded-xl border-2 border-red-500/30 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    Oeps! Er ging iets mis
                  </h1>
                  <p className="text-red-100">
                    De applicatie heeft een onverwachte fout tegengekomen
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User-friendly message */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-300 leading-relaxed">
                  We hebben deze fout geregistreerd en werken aan een oplossing.
                  Probeer de pagina te verversen of ga terug naar de homepagina.
                </p>
              </div>

              {/* Error details (only in development) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="bg-slate-900/50 rounded-lg border border-slate-700">
                  <summary className="px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors text-slate-300 font-medium">
                    Technische Details (Development Mode)
                  </summary>
                  <div className="p-4 border-t border-slate-700 space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Error Message
                      </p>
                      <p className="text-red-400 font-mono text-sm break-all">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                          Stack Trace
                        </p>
                        <pre className="text-xs text-slate-300 font-mono bg-slate-950 rounded p-3 overflow-auto max-h-48">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                          Component Stack
                        </p>
                        <pre className="text-xs text-slate-300 font-mono bg-slate-950 rounded p-3 overflow-auto max-h-48">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Probeer Opnieuw
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Pagina Verversen
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Naar Home
                </button>
              </div>

              {/* Support info */}
              <div className="text-center text-sm text-slate-400">
                Blijft het probleem zich voordoen?{' '}
                <a
                  href="mailto:support@inspirationpoint.nl"
                  className="text-gold-400 hover:text-gold-300 underline"
                >
                  Neem contact op met support
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap any component with an error boundary
 * Usage: export default withErrorBoundary(MyComponent);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
