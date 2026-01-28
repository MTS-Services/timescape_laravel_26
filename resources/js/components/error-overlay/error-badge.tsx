/**
 * Error Badge - Floating indicator for error count
 */

import { Bug } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useErrorObservability } from '@/lib/errors/error-context';
import { getEnvironment } from '@/lib/errors/utils';

export function ErrorBadge() {
    const { errors, setOverlayOpen } = useErrorObservability();
    const environment = getEnvironment();

    if (environment === 'production' || errors.length === 0) {
        return null;
    }

    const totalCount = errors.reduce((sum, error) => sum + error.count, 0);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Button
                onClick={() => setOverlayOpen(true)}
                className="relative h-14 w-14 rounded-full bg-red-600 shadow-lg hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                title="View frontend errors"
            >
                <Bug className="h-6 w-6 text-white" />
                {totalCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-800 text-xs font-bold text-white ring-2 ring-white dark:ring-gray-900">
                        {totalCount > 99 ? '99+' : totalCount}
                    </span>
                )}
            </Button>
        </div>
    );
}
