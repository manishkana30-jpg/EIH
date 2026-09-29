'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Eye, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface HardwareErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRecover?: () => void;
  componentName?: string;
}

interface HardwareErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorType: 'permission' | 'device_not_found' | 'in_use' | 'generic';
}

export class HardwareErrorBoundary extends Component<
  HardwareErrorBoundaryProps,
  HardwareErrorBoundaryState
> {
  constructor(props: HardwareErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'generic',
    };
  }

  public static getDerivedStateFromError(error: Error): HardwareErrorBoundaryState {
    const msg = (error.message || '').toLowerCase();
    const name = error.name || '';

    let errorType: 'permission' | 'device_not_found' | 'in_use' | 'generic' = 'generic';

    if (name === 'NotAllowedError' || msg.includes('permission denied')) {
      errorType = 'permission';
    } else if (name === 'NotFoundError' || msg.includes('device not found')) {
      errorType = 'device_not_found';
    } else if (name === 'NotReadableError' || msg.includes('in use') || msg.includes('hardware error')) {
      errorType = 'in_use';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn(
      `[HardwareErrorBoundary] Caught hardware exception in ${this.props.componentName || 'Component'}:`,
      error,
      errorInfo
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorType: 'generic' });
    this.props.onRecover?.();
  };

  public render() {
    if (this.state.hasError) {
      const { fallbackTitle, fallbackMessage } = this.props;

      return (
        <div
          data-testid="hardware-error-fallback"
          className="relative w-full p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center shadow-lg backdrop-blur-md flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            {this.state.errorType === 'permission' ? (
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            ) : (
              <Eye className="w-6 h-6 text-cyan-400" />
            )}
          </div>

          <div className="space-y-1 max-w-md">
            <h4 className="text-sm sm:text-base font-semibold text-slate-100">
              {fallbackTitle || 'Tranquility Mode Activated'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {fallbackMessage ||
                (this.state.errorType === 'permission'
                  ? 'Sensor permissions were declined. Sanctuary has seamlessly switched to Pure Focus Text Mode.'
                  : this.state.errorType === 'in_use'
                  ? 'Hardware sensor is active in another program. Continuing smoothly in Offline Focus mode.'
                  : 'Hardware sensor resting. Seamlessly switched to Text-Only Tranquility mode.')}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={this.handleRetry}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Sensor</span>
            </button>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 text-xs">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Text-First Safe</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
