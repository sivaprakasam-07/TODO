import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center p-6 bg-[#0A0A0A] text-[#F5F5F5]">
          <div className="max-w-sm w-full p-5 bg-[#121212] border border-[#242424] rounded-xl text-center space-y-3 shadow-xl">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Something went wrong</h3>
            <p className="text-xs text-[#8A8A8A]">An unexpected rendering error occurred.</p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F5] hover:bg-white text-black text-xs font-semibold rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
