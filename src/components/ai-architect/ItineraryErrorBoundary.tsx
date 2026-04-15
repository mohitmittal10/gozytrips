// Catches rendering errors for individual tabs to prevent nuking the whole view
import React, { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset: () => void;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ItineraryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 border border-red-500/20 rounded-xl">
          <div className="p-3 bg-red-500/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Wait, something went wrong here.</h2>
          <p className="text-sm text-zinc-400 max-w-md mb-6">
            {this.props.fallbackMessage || this.state.error?.message || "There was an error rendering this tab's content."}
          </p>
          <Button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
            variant="outline"
            className="border-red-500/30 hover:bg-red-500/10"
          >
            Reset Tab
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
