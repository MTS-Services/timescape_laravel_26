/**
 * Error Store
 * Manages error collection, deduplication, and persistence
 */

import type { CapturedError, ErrorStats } from './types';
import { ErrorSeverity, ErrorType } from './types';

const MAX_ERRORS = 100;
const STORAGE_KEY = 'frontend_errors';

export class ErrorStore {
    private errors: Map<string, CapturedError> = new Map();
    private ignoredHashes: Set<string> = new Set();
    private listeners: Array<() => void> = [];

    constructor() {
        this.loadFromStorage();
    }

    public addError(error: CapturedError): boolean {
        if (this.ignoredHashes.has(error.hash)) {
            return false;
        }

        const existingError = this.errors.get(error.hash);

        if (existingError) {
            existingError.count += 1;
            existingError.lastOccurrence = error.lastOccurrence;
            this.errors.set(error.hash, existingError);
        } else {
            this.errors.set(error.hash, error);

            if (this.errors.size > MAX_ERRORS) {
                const oldestKey = Array.from(this.errors.keys())[0];
                this.errors.delete(oldestKey);
            }
        }

        this.saveToStorage();
        this.notifyListeners();
        return true;
    }

    public getErrors(): CapturedError[] {
        return Array.from(this.errors.values()).sort(
            (a, b) => new Date(b.lastOccurrence).getTime() - new Date(a.lastOccurrence).getTime(),
        );
    }

    public getError(id: string): CapturedError | undefined {
        return Array.from(this.errors.values()).find((error) => error.id === id);
    }

    public clearError(id: string): void {
        const error = Array.from(this.errors.values()).find((err) => err.id === id);
        if (error) {
            this.errors.delete(error.hash);
            this.saveToStorage();
            this.notifyListeners();
        }
    }

    public clearAll(): void {
        this.errors.clear();
        this.saveToStorage();
        this.notifyListeners();
    }

    public ignoreError(hash: string): void {
        this.ignoredHashes.add(hash);
        this.errors.delete(hash);
        this.saveToStorage();
        this.notifyListeners();
    }

    public getStats(): ErrorStats {
        const errors = this.getErrors();

        const stats: ErrorStats = {
            total: errors.length,
            byType: {
                [ErrorType.React]: 0,
                [ErrorType.Runtime]: 0,
                [ErrorType.Network]: 0,
                [ErrorType.Promise]: 0,
                [ErrorType.Inertia]: 0,
                [ErrorType.Unknown]: 0,
            },
            bySeverity: {
                [ErrorSeverity.Fatal]: 0,
                [ErrorSeverity.Error]: 0,
                [ErrorSeverity.Warning]: 0,
                [ErrorSeverity.Info]: 0,
            },
            byPage: {},
        };

        for (const error of errors) {
            stats.byType[error.type] += error.count;
            stats.bySeverity[error.severity] += error.count;

            const page = error.metadata.route || 'unknown';
            stats.byPage[page] = (stats.byPage[page] || 0) + error.count;
        }

        return stats;
    }

    public subscribe(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    private notifyListeners(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }

    private saveToStorage(): void {
        if (typeof window === 'undefined') {
            return;
        }

        const environment = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;
        if (environment === 'production') {
            return;
        }

        try {
            const data = {
                errors: Array.from(this.errors.entries()),
                ignoredHashes: Array.from(this.ignoredHashes),
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save errors to storage:', error);
        }
    }

    private loadFromStorage(): void {
        if (typeof window === 'undefined') {
            return;
        }

        const environment = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;
        if (environment === 'production') {
            return;
        }

        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.errors = new Map(data.errors || []);
                this.ignoredHashes = new Set(data.ignoredHashes || []);
            }
        } catch (error) {
            console.warn('Failed to load errors from storage:', error);
        }
    }
}
