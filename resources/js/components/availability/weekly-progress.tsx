import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface WeekRequirement {
    start_date: string;
    end_date: string;
    weekday: {
        total_blocks: number;
        required: number;
        is_met: boolean;
    };
    weekend: {
        total_blocks: number;
        required: number;
        is_met: boolean;
    };
    is_complete: boolean;
}

interface WeeklyProgressProps {
    weekRequirement: WeekRequirement;
}

export function WeeklyProgress({ weekRequirement }: WeeklyProgressProps) {
    const { weekday, weekend, is_complete } = weekRequirement;

    const weekdayProgress = Math.min((weekday.total_blocks / weekday.required) * 100, 100);
    const weekendProgress = Math.min((weekend.total_blocks / weekend.required) * 100, 100);

    return (
        <div className="w-full py-2">
            <div className='bg-muted/30 rounded-lg border border-border flex flex-row items-center gap-6 px-4 py-2.5'>

                {/* Weekdays Progress */}
                <div className="flex flex-1 items-center gap-3 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Weekdays</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-300",
                                weekday.is_met ? "bg-green-500" : "bg-red-400"
                            )}
                            style={{ width: `${weekdayProgress}%` }}
                        />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                        {weekday.total_blocks}/{weekday.required}
                    </span>
                </div>

                {/* Weekends Progress */}
                <div className="flex flex-1 items-center gap-3 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Weekends</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-300",
                                weekend.is_met ? "bg-green-500" : "bg-red-400"
                            )}
                            style={{ width: `${weekendProgress}%` }}
                        />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                        {weekend.total_blocks}/{weekend.required}
                    </span>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center shrink-0">
                    {is_complete ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 whitespace-nowrap">
                                Week Complete
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-md">
                            <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-400 whitespace-nowrap">
                                Needs: {!weekday.is_met && `${weekday.required - weekday.total_blocks} weekday`}
                                {!weekday.is_met && !weekend.is_met && ' + '}
                                {!weekend.is_met && `${weekend.required - weekend.total_blocks} weekend`}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}