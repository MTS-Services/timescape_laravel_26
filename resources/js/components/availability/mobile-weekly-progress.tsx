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

interface MobileWeeklyProgressProps {
    weekRequirement: WeekRequirement;
}

export function MobileWeeklyProgress({ weekRequirement }: MobileWeeklyProgressProps) {
    const { weekday, weekend, is_complete } = weekRequirement;

    const weekdayProgress = Math.min((weekday.total_blocks / weekday.required) * 100, 100);
    const weekendProgress = Math.min((weekend.total_blocks / weekend.required) * 100, 100);

    return (
        <div className="bg-muted/30 rounded pl-1 border border-border">
            <div className="flex flex-row items-center gap-2">

                {/* Weekdays Section */}
                <div className="flex flex-1 items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">WD</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-300",
                                weekday.is_met ? "bg-green-500" : "bg-red-400"
                            )}
                            style={{ width: `${weekdayProgress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {weekday.total_blocks}/{weekday.required}
                    </span>
                </div>

                {/* Weekend Section */}
                <div className="flex flex-1 items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">WE</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-300",
                                weekend.is_met ? "bg-green-500" : "bg-red-400"
                            )}
                            style={{ width: `${weekendProgress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {weekend.total_blocks}/{weekend.required}
                    </span>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                    {is_complete ? (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span className="text-[9px] font-bold uppercase text-green-700 dark:text-green-400">Complete</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900 rounded">
                            <AlertCircle className="w-3 h-3 text-yellow-600" />
                            <span className="text-[8px] font-bold uppercase text-yellow-700 dark:text-yellow-400">
                                {!weekday.is_met && `${weekday.required - weekday.total_blocks} Weekdays`}
                                {!weekday.is_met && !weekend.is_met && '+'}
                                {!weekend.is_met && `${weekend.required - weekend.total_blocks} Weekends`}
                            </span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}