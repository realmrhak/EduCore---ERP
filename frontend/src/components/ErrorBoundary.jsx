import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-lg">
            <AlertTriangle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-[#0F172A] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#475569] mb-6">
              An unexpected error occurred. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d]"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
