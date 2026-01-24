/**
 * Error Overlay - Main error observability panel
 */

import { AlertTriangle, Filter, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useErrorObservability } from '@/lib/errors/error-context';
import type { CapturedError } from '@/lib/errors/types';

import { ErrorDetails } from './error-details';
import { ErrorList } from './error-list';
import { ErrorStats as ErrorStatsComponent } from './error-stats';

export function ErrorOverlay() {
    const { errors, isOverlayOpen, setOverlayOpen, clearErrors, clearError } = useErrorObservability();
    const [selectedError, setSelectedError] = useState<CapturedError | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterSeverity, setFilterSeverity] = useState<string>('all');

    if (!isOverlayOpen) {
        return null;
    }

    const filteredErrors = errors.filter((error) => {
        if (filterType !== 'all' && error.type !== filterType) {
            return false;
        }
        if (filterSeverity !== 'all' && error.severity !== filterSeverity) {
            return false;
        }
        return true;
    });

    const handleDeleteError = () => {
        if (selectedError) {
            clearError(selectedError.id);
            setSelectedError(null);
        }
    };

    const handleClose = () => {
        setOverlayOpen(false);
        setSelectedError(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            <div
                className="flex-1 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="flex h-full w-full max-w-6xl flex-col bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Frontend Error Observatory</h2>
                            <p className="text-sm text-muted-foreground">
                                {errors.length} error{errors.length !== 1 ? 's' : ''} captured
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {errors.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearErrors}
                                className="gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear All
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={handleClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="border-b px-6 py-3">
                    <ErrorStatsComponent />
                </div>

                {errors.length > 0 && (
                    <div className="flex items-center gap-3 border-b px-6 py-3">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="react">React</SelectItem>
                                <SelectItem value="runtime">Runtime</SelectItem>
                                <SelectItem value="network">Network</SelectItem>
                                <SelectItem value="promise">Promise</SelectItem>
                                <SelectItem value="inertia">Inertia</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severities</SelectItem>
                                <SelectItem value="fatal">Fatal</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                            </SelectContent>
                        </Select>
                        {(filterType !== 'all' || filterSeverity !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFilterType('all');
                                    setFilterSeverity('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex min-h-0 flex-1">
                    <div className="flex w-96 flex-col border-r">
                        <ErrorList
                            errors={filteredErrors}
                            selectedError={selectedError}
                            onSelectError={setSelectedError}
                        />
                    </div>
                    <div className="flex-1">
                        {selectedError ? (
                            <ErrorDetails
                                error={selectedError}
                                onClose={() => setSelectedError(null)}
                                onDelete={handleDeleteError}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center p-8">
                                <div className="text-center text-muted-foreground">
                                    <AlertTriangle className="mx-auto h-12 w-12 opacity-50" />
                                    <p className="mt-4 text-sm">
                                        Select an error to view details
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
