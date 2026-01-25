/**
 * Error Context
 * React Context for error observability system
 */

import { router } from '@inertiajs/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ErrorStore } from './error-store';
import {
    extractComponentFromStack,
    generateStackHash,
    parseStackTrace,
    sanitizeStackTrace,
} from './stack-parser';
import type { CapturedError, CaptureOptions, ErrorContextValue } from './types';
import { ErrorSeverity, ErrorSource, ErrorType } from './types';
import {
    classifyError,
    classifySeverity,
    generateErrorId,
    getEnvironment,
    getErrorMetadata,
    shouldCaptureError,
} from './utils';

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function useErrorObservability(): ErrorContextValue {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useErrorObservability must be used within ErrorObservabilityProvider');
    }
    return context;
}

interface ErrorObservabilityProviderProps {
    children: React.ReactNode;
}

export function ErrorObservabilityProvider({ children }: ErrorObservabilityProviderProps) {
    const store = useMemo(() => new ErrorStore(), []);
    const [errors, setErrors] = useState<CapturedError[]>([]);
    const [stats, setStats] = useState(() => store.getStats());
    const [isOverlayOpen, setOverlayOpen] = useState(false);
    const environment = getEnvironment();

    const captureError = useCallback(
        (
            error: Error | ErrorEvent | PromiseRejectionEvent,
            options: CaptureOptions = {},
        ): void => {
            const actualError = error instanceof Error ? error : new Error('Unknown error');

            if (!shouldCaptureError(actualError)) {
                return;
            }

            const type = options.type || classifyError(actualError);
            const severity = options.severity || classifySeverity(actualError);
            const source = options.source || ErrorSource.Manual;
            const metadata = { ...getErrorMetadata(), ...options.metadata };
            const parsedStack = parseStackTrace(actualError.stack);
            const component = extractComponentFromStack(actualError.stack);
            const hash = generateStackHash(actualError.stack);

            const capturedError: CapturedError = {
                id: generateErrorId(),
                type,
                severity,
                source,
                name: actualError.name,
                message: actualError.message,
                stack: sanitizeStackTrace(actualError.stack, environment),
                parsedStack,
                componentStack: options.componentStack,
                metadata: {
                    ...metadata,
                    component: component || metadata.component,
                },
                networkDetails: options.networkDetails,
                inertiaDetails: options.inertiaDetails,
                count: 1,
                firstOccurrence: new Date().toISOString(),
                lastOccurrence: new Date().toISOString(),
                hash,
            };

            const wasAdded = store.addError(capturedError);

            if (wasAdded && environment !== 'production') {
                const severityConfig = {
                    [ErrorSeverity.Fatal]: { icon: '💥', duration: Infinity },
                    [ErrorSeverity.Error]: { icon: '❌', duration: 5000 },
                    [ErrorSeverity.Warning]: { icon: '⚠️', duration: 4000 },
                    [ErrorSeverity.Info]: { icon: 'ℹ️', duration: 3000 },
                };

                const config = severityConfig[severity];

                toast.error(`${config.icon} ${type.toUpperCase()}: ${actualError.message}`, {
                    description: `Click to view details in error overlay`,
                    duration: config.duration,
                    action: {
                        label: 'View Details',
                        onClick: () => setOverlayOpen(true),
                    },
                });
            }
        },
        [environment, setOverlayOpen, store],
    );

    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            setErrors(store.getErrors());
            setStats(store.getStats());
        });

        return unsubscribe;
    }, [store]);

    useEffect(() => {
        const handleWindowError = (event: ErrorEvent): void => {
            event.preventDefault();
            if (shouldCaptureError(event.error)) {
                captureError(event.error, {
                    source: ErrorSource.WindowError,
                });
            }
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
            event.preventDefault();
            const error =
                event.reason instanceof Error
                    ? event.reason
                    : new Error(String(event.reason) || 'Unhandled Promise Rejection');

            if (shouldCaptureError(error)) {
                captureError(error, {
                    type: ErrorType.Promise,
                    source: ErrorSource.UnhandledRejection,
                });
            }
        };

        window.addEventListener('error', handleWindowError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleWindowError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [captureError]);

    useEffect(() => {
        const removeInertiaListener = router.on('error', (event) => {
            const detail = event.detail as { message?: string; page?: { component?: string; url?: string } };
            const error = new Error(detail?.message || 'Inertia navigation failed');
            captureError(error, {
                type: ErrorType.Inertia,
                source: ErrorSource.InertiaListener,
                inertiaDetails: {
                    page: detail?.page?.component,
                    url: detail?.page?.url,
                },
            });
        });

        return () => {
            removeInertiaListener();
        };
    }, [captureError]);

    const clearErrors = useCallback((): void => {
        store.clearAll();
    }, [store]);

    const clearError = useCallback((id: string): void => {
        store.clearError(id);
    }, [store]);

    const ignoreError = useCallback((hash: string): void => {
        store.ignoreError(hash);
        toast.success('Error ignored', {
            description: 'This error will no longer be captured',
        });
    }, [store]);

    const value: ErrorContextValue = useMemo(
        () => ({
            errors,
            stats,
            captureError,
            clearErrors,
            clearError,
            ignoreError,
            isOverlayOpen,
            setOverlayOpen,
        }),
        [errors, stats, captureError, clearErrors, clearError, ignoreError, isOverlayOpen],
    );

    return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}
