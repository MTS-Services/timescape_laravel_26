import { AlertCircle } from 'lucide-react';

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

    // Calculate percentages for progress bars
    const weekdayProgress = Math.min((weekday.total_blocks / weekday.required) * 100, 100);
    const weekendProgress = Math.min((weekend.total_blocks / weekend.required) * 100, 100);

    return (
        <div className="py-2 px-2 sm:px-3 lg:px-4">
            <div className='bg-muted/30 rounded-lg border border-border flex items-center gap-3 px-3 py-2'>
                {/* Week Progress Label */}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap min-w-[90px] sm:min-w-[110px]">
                    Week Progress
                </div>

                {/* Weekdays Progress */}
                <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Weekdays</span>
                            <span className="text-xs font-medium">
                                {weekday.total_blocks}/{weekday.required}
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300 rounded-full",
                                    weekday.is_met ? "bg-green-500" : "bg-red-400"
                                )}
                                style={{ width: `${weekdayProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Weekends Progress */}
                <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Weekends</span>
                            <span className="text-xs font-medium">
                                {weekend.total_blocks}/{weekend.required}
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300 rounded-full",
                                    weekend.is_met ? "bg-green-500" : "bg-red-400"
                                )}
                                style={{ width: `${weekendProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-center min-w-[100px] sm:min-w-[140px]">
                    {is_complete ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 rounded-md">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500">
                                <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                                Week Complete
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                                Needs {!weekday.is_met && `${3 - weekday.total_blocks} weekday`} {!weekday.is_met && !weekend.is_met && ' + '}{!weekend.is_met && `${2 - weekend.total_blocks} weekend`}

                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}