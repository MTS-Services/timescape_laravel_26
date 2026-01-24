/**
 * Enhanced Error Boundary
 * React Error Boundary that integrates with the error observability system
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

import type { ErrorContextValue } from '@/lib/errors/types';
import { ErrorSource } from '@/lib/errors/types';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    captureError?: ErrorContextValue['captureError'];
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Enhanced Error Boundary that captures errors and sends them to the observability system
 * 
 * Usage:
 * <EnhancedErrorBoundary fallback={<ErrorUI />}>
 *   <YourComponent />
 * </EnhancedErrorBoundary>
 */
export class EnhancedErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        if (this.props.captureError) {
            this.props.captureError(error, {
                source: ErrorSource.ErrorBoundary,
                componentStack: errorInfo.componentStack || undefined,
            });
        }

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] items-center justify-center p-8">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-destructive">
                            Component Error
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            This component encountered an error and could not be displayed.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
