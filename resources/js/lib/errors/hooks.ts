/**
 * Error Observability Hooks
 */

import { useCallback } from 'react';

import { useErrorObservability } from './error-context';
import type { CaptureOptions } from './types';
import { ErrorSource } from './types';

/**
 * Hook to manually capture errors in async code or event handlers
 */
export function useErrorHandler() {
    const { captureError } = useErrorObservability();

    return useCallback(
        (error: Error, options?: CaptureOptions) => {
            captureError(error, {
                source: ErrorSource.Manual,
                ...options,
            });
        },
        [captureError],
    );
}

/**
 * Hook to wrap async functions with error handling
 */
export function useAsyncErrorHandler<T extends (...args: unknown[]) => Promise<unknown>>(
    asyncFn: T,
    options?: CaptureOptions,
): T {
    const handleError = useErrorHandler();

    return useCallback(
        async (...args: Parameters<T>) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                handleError(error instanceof Error ? error : new Error(String(error)), options);
                throw error;
            }
        },
        [asyncFn, handleError, options],
    ) as T;
}

/**
 * Hook for accessing error stats
 */
export function useErrorStats() {
    const { stats } = useErrorObservability();
    return stats;
}

/**
 * Hook to toggle error overlay
 */
export function useErrorOverlay() {
    const { isOverlayOpen, setOverlayOpen } = useErrorObservability();
    return { isOpen: isOverlayOpen, setOpen: setOverlayOpen };
}
