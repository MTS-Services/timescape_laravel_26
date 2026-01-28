/**
 * Error Stats - Visual statistics dashboard
 */

import { AlertCircle, AlertTriangle, Bug, Info, Network } from 'lucide-react';

import { useErrorObservability } from '@/lib/errors/error-context';
import { ErrorSeverity, ErrorType } from '@/lib/errors/types';

export function ErrorStats() {
    const { stats } = useErrorObservability();

    const severityConfig = {
        [ErrorSeverity.Fatal]: {
            icon: AlertCircle,
            label: 'Fatal',
            color: 'text-red-600 dark:text-red-400',
        },
        [ErrorSeverity.Error]: {
            icon: AlertTriangle,
            label: 'Error',
            color: 'text-orange-600 dark:text-orange-400',
        },
        [ErrorSeverity.Warning]: {
            icon: AlertTriangle,
            label: 'Warning',
            color: 'text-yellow-600 dark:text-yellow-400',
        },
        [ErrorSeverity.Info]: {
            icon: Info,
            label: 'Info',
            color: 'text-blue-600 dark:text-blue-400',
        },
    };

    const typeConfig = {
        [ErrorType.React]: { label: 'React', icon: Bug },
        [ErrorType.Runtime]: { label: 'Runtime', icon: AlertCircle },
        [ErrorType.Network]: { label: 'Network', icon: Network },
        [ErrorType.Promise]: { label: 'Promise', icon: AlertCircle },
        [ErrorType.Inertia]: { label: 'Inertia', icon: Network },
        [ErrorType.Unknown]: { label: 'Unknown', icon: AlertCircle },
    };

    return (
        <div className="grid grid-cols-2 gap-6">
            <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    By Severity
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(severityConfig).map(([severity, config]) => {
                        const count = stats.bySeverity[severity as ErrorSeverity];
                        if (count === 0) {
                            return null;
                        }
                        const Icon = config.icon;
                        return (
                            <div
                                key={severity}
                                className="flex items-center gap-2 rounded-md bg-muted px-3 py-2"
                            >
                                <Icon className={`h-4 w-4 ${config.color}`} />
                                <span className="text-sm font-medium">{config.label}</span>
                                <span className="ml-auto text-sm font-semibold">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    By Type
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(typeConfig).map(([type, config]) => {
                        const count = stats.byType[type as ErrorType];
                        if (count === 0) {
                            return null;
                        }
                        const Icon = config.icon;
                        return (
                            <div
                                key={type}
                                className="flex items-center gap-2 rounded-md bg-muted px-3 py-2"
                            >
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{config.label}</span>
                                <span className="ml-auto text-sm font-semibold">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
