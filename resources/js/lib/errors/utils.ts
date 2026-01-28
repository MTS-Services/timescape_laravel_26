/**
 * Error Utility Functions
 */

import type { ErrorMetadata, ErrorSeverity, ErrorType } from './types';
import { ErrorSeverity as ErrorSeverityEnum, ErrorType as ErrorTypeEnum } from './types';

export function generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getEnvironment(): 'local' | 'staging' | 'production' {
    const env = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;

    if (env === 'production') {
        return 'production';
    }
    if (env === 'staging') {
        return 'staging';
    }
    return 'local';
}

export function getBrowserInfo(): {
    browserName: string;
    browserVersion: string;
    osName: string;
    osVersion: string;
} {
    const ua = navigator.userAgent as string;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let osName = 'Unknown';
    let osVersion = 'Unknown';

    if (ua.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome') > -1) {
        browserName = 'Chrome';
        browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
        browserName = 'Safari';
        browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edge') > -1) {
        browserName = 'Edge';
        browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
    }

    if (ua.indexOf('Windows') > -1) {
        osName = 'Windows';
        osVersion = ua.match(/Windows NT ([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Mac') > -1) {
        osName = 'macOS';
        osVersion = ua.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || 'Unknown';
    } else if (ua.indexOf('Linux') > -1) {
        osName = 'Linux';
    } else if (ua.indexOf('Android') > -1) {
        osName = 'Android';
        osVersion = ua.match(/Android ([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('iOS') > -1) {
        osName = 'iOS';
        osVersion = ua.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || 'Unknown';
    }

    return { browserName, browserVersion, osName, osVersion };
}

export function getErrorMetadata(): ErrorMetadata {
    const browserInfo = getBrowserInfo();
    const environment = getEnvironment();

    const metadata: ErrorMetadata = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        browserName: browserInfo.browserName,
        browserVersion: browserInfo.browserVersion,
        osName: browserInfo.osName,
        osVersion: browserInfo.osVersion,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
        environment,
    };

    try {
        const page = (window as Window & { __inertia_page?: { url: string; component: string; props?: { auth?: { user?: { id: number; name: string; email: string } } } } }).__inertia_page;
        if (page) {
            metadata.route = page.url;
            metadata.component = page.component;

            if (page.props?.auth?.user) {
                metadata.userId = page.props.auth.user.id;
                metadata.userName = page.props.auth.user.name;
                metadata.userEmail = page.props.auth.user.email;
            }
        }
    } catch {
        // Ignore errors getting Inertia page data
    }

    return metadata;
}

export function classifyError(error: Error | ErrorEvent | PromiseRejectionEvent): ErrorType {
    if (error instanceof Error) {
        const errorName = error.name.toLowerCase();
        const errorMessage = error.message.toLowerCase();

        if (
            errorName.includes('typeerror') ||
            errorName.includes('referenceerror') ||
            errorName.includes('syntaxerror')
        ) {
            return ErrorTypeEnum.Runtime;
        }

        if (
            errorMessage.includes('network') ||
            errorMessage.includes('fetch') ||
            errorMessage.includes('axios') ||
            errorMessage.includes('http')
        ) {
            return ErrorTypeEnum.Network;
        }

        if (errorMessage.includes('inertia')) {
            return ErrorTypeEnum.Inertia;
        }

        if (
            error.stack?.includes('react') ||
            error.stack?.includes('React') ||
            errorName === 'invariant violation'
        ) {
            return ErrorTypeEnum.React;
        }

        return ErrorTypeEnum.Runtime;
    }

    if ('promise' in error) {
        return ErrorTypeEnum.Promise;
    }

    return ErrorTypeEnum.Unknown;
}

export function classifySeverity(error: Error | ErrorEvent | PromiseRejectionEvent): ErrorSeverity {
    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (
            errorMessage.includes('chunk') ||
            errorMessage.includes('loading') ||
            errorMessage.includes('timeout')
        ) {
            return ErrorSeverityEnum.Warning;
        }

        if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
            return ErrorSeverityEnum.Error;
        }

        const errorName = error.name.toLowerCase();
        if (errorName.includes('syntaxerror') || errorName.includes('referenceerror')) {
            return ErrorSeverityEnum.Fatal;
        }
    }

    return ErrorSeverityEnum.Error;
}

export function shouldCaptureError(error: Error | ErrorEvent | PromiseRejectionEvent): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('resizeobserver loop')) {
            return false;
        }

        if (message.includes('script error')) {
            return false;
        }

        if (message.includes('non-error promise rejection')) {
            return false;
        }
    }

    return true;
}

export function formatErrorForDisplay(error: Error): string {
    return `${error.name}: ${error.message}`;
}

export function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    return Promise.resolve();
}
