/**
 * Error List - Filterable and sortable error list
 */

import { AlertCircle, Bug, Network, PackageX, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CapturedError } from '@/lib/errors/types';
import { ErrorSeverity, ErrorType } from '@/lib/errors/types';

interface ErrorListProps {
    errors: CapturedError[];
    selectedError: CapturedError | null;
    onSelectError: (error: CapturedError) => void;
}

export function ErrorList({ errors, selectedError, onSelectError }: ErrorListProps) {
    if (errors.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <div className="text-center">
                    <Bug className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-sm font-semibold">No errors captured</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Frontend errors will appear here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1">
            <div className="divide-y">
                {errors.map((error) => (
                    <ErrorListItem
                        key={error.id}
                        error={error}
                        isSelected={selectedError?.id === error.id}
                        onClick={() => onSelectError(error)}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}

interface ErrorListItemProps {
    error: CapturedError;
    isSelected: boolean;
    onClick: () => void;
}

function ErrorListItem({ error, isSelected, onClick }: ErrorListItemProps) {
    const severityColors = {
        [ErrorSeverity.Fatal]: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
        [ErrorSeverity.Error]: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20',
        [ErrorSeverity.Warning]: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20',
        [ErrorSeverity.Info]: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
    };

    const typeIcons = {
        [ErrorType.React]: <Zap className="h-4 w-4" />,
        [ErrorType.Runtime]: <AlertCircle className="h-4 w-4" />,
        [ErrorType.Network]: <Network className="h-4 w-4" />,
        [ErrorType.Promise]: <PackageX className="h-4 w-4" />,
        [ErrorType.Inertia]: <Bug className="h-4 w-4" />,
        [ErrorType.Unknown]: <AlertCircle className="h-4 w-4" />,
    };

    return (
        <button
            onClick={onClick}
            className={`
                w-full border-l-4 px-4 py-3 text-left transition-colors
                ${severityColors[error.severity]}
                ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}
            `}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="mt-0.5 text-muted-foreground">
                        {typeIcons[error.type]}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">
                                {error.name}
                            </span>
                            {error.count > 1 && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                    {error.count}×
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {error.message}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {error.metadata.component && (
                                <span className="rounded-md bg-background px-2 py-0.5 font-mono">
                                    {error.metadata.component}
                                </span>
                            )}
                            <span className="rounded-md bg-background px-2 py-0.5">
                                {new Date(error.lastOccurrence).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}
