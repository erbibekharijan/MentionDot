import { Component, type ErrorInfo, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  /** Content to render when no error is present. */
  children: ReactNode;
  /**
   * Optional custom fallback UI. Receives the caught error and a reset
   * callback that clears the error state and re-renders children.
   */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Top-level React Error Boundary for MISSED.
 *
 * Catches unhandled JavaScript errors thrown during rendering, lifecycle
 * methods, or constructor calls of any descendant component. Without this,
 * an unexpected runtime error would leave the user staring at a blank screen
 * with no recovery path.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={(err, reset) => <MyFallback error={err} onReset={reset} />}>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * Implementation notes:
 * - Must be a class component; React does not support hook-based error
 *   boundaries as of React 19.
 * - The default fallback is intentionally minimal and fully keyboard-operable.
 * - The error is logged to the console for developer inspection; no telemetry
 *   is sent to an external service.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log the full component stack for developer debugging.
    console.error('[MISSED. ErrorBoundary] Unhandled render error:', error);
    console.error('[MISSED. ErrorBoundary] Component stack:', info.componentStack);
  }

  handleReset(): void {
    this.setState({ hasError: false, error: null });
  }

  override render(): ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.handleReset);
    }

    // Default fallback — accessible, keyboard-operable, on-brand.
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#0a0a0b',
          color: '#e4e4e7',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <p
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '1.5rem',
            letterSpacing: '0.1em',
            color: '#f97316',
          }}
        >
          MISSED.
        </p>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#a1a1aa', maxWidth: '32rem', margin: 0 }}>
          An unexpected error prevented the interface from rendering. Your
          conversation data was not sent anywhere — analysis always happens
          locally in your browser.
        </p>
        {this.state.error.message && (
          <pre
            style={{
              fontSize: '0.75rem',
              color: '#71717a',
              background: '#18181b',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              maxWidth: '40rem',
              overflowX: 'auto',
              textAlign: 'left',
              margin: 0,
            }}
          >
            {this.state.error.message}
          </pre>
        )}
        <button
          type="button"
          onClick={this.handleReset}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
