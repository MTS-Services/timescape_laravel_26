/**
 * Frontend Error Observability System
 * Type Definitions and Interfaces
 */

export enum ErrorSeverity {
    Fatal = 'fatal',
    Error = 'error',
    Warning = 'warning',
    Info = 'info',
}

export enum ErrorType {
    React = 'react',
    Runtime = 'runtime',
    Network = 'network',
    Promise = 'promise',
    Inertia = 'inertia',
    Unknown = 'unknown',
}

export enum ErrorSource {
    ErrorBoundary = 'error-boundary',
    WindowError = 'window-error',
    UnhandledRejection = 'unhandled-rejection',
    NetworkInterceptor = 'network-interceptor',
    InertiaListener = 'inertia-listener',
    Manual = 'manual',
}

export interface StackFrame {
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
    functionName?: string;
    source?: string;
}

export interface ErrorMetadata {
    userId?: string | number;
    userName?: string;
    userEmail?: string;
    route?: string;
    routeName?: string;
    component?: string;
    url?: string;
    userAgent?: string;
    browserName?: string;
    browserVersion?: string;
    osName?: string;
    osVersion?: string;
    screenResolution?: string;
    viewport?: string;
    timestamp: string;
    environment: 'local' | 'staging' | 'production';
    [key: string]: unknown;
}

export interface NetworkErrorDetails {
    method?: string;
    url?: string;
    status?: number;
    statusText?: string;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    requestBody?: unknown;
    responseBody?: unknown;
    duration?: number;
}

export interface InertiaErrorDetails {
    page?: string;
    method?: string;
    url?: string;
    data?: unknown;
    preserveState?: boolean;
    preserveScroll?: boolean;
}

export interface CapturedError {
    id: string;
    type: ErrorType;
    severity: ErrorSeverity;
    source: ErrorSource;
    name: string;
    message: string;
    stack?: string;
    parsedStack?: StackFrame[];
    componentStack?: string;
    metadata: ErrorMetadata;
    networkDetails?: NetworkErrorDetails;
    inertiaDetails?: InertiaErrorDetails;
    count: number;
    firstOccurrence: string;
    lastOccurrence: string;
    hash: string;
}

export interface ErrorStats {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    byPage: Record<string, number>;
}

export interface ErrorContextValue {
    errors: CapturedError[];
    stats: ErrorStats;
    captureError: (error: Error | ErrorEvent | PromiseRejectionEvent, options?: CaptureOptions) => void;
    clearErrors: () => void;
    clearError: (id: string) => void;
    ignoreError: (hash: string) => void;
    isOverlayOpen: boolean;
    setOverlayOpen: (open: boolean) => void;
}

export interface CaptureOptions {
    type?: ErrorType;
    severity?: ErrorSeverity;
    source?: ErrorSource;
    metadata?: Partial<ErrorMetadata>;
    networkDetails?: NetworkErrorDetails;
    inertiaDetails?: InertiaErrorDetails;
    componentStack?: string;
}

export interface ErrorFilterOptions {
    type?: ErrorType[];
    severity?: ErrorSeverity[];
    page?: string[];
    search?: string;
    startDate?: Date;
    endDate?: Date;
}
