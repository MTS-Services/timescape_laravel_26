import { getCardBackgroundColor } from '@/lib/calendar-utils';
import { weekdays } from '@/lib/date-helpers';
import {
    formatDayNumber,
    formatDateKey,
    isDateDisabled,
    isSameMonth,
    isWeekendDay,
    isDateInPast,
    isToday,
} from '@/lib/date-helpers';
import { cn } from '@/lib/utils';
import type { AvailabilitySelections } from '@/types/availability';

import { MobileWeeklyProgress } from './mobile-weekly-progress';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

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

interface MobileCalendarGridProps {
    calendarDays: Date[];
    currentMonth: Date;
    selections: AvailabilitySelections;
    selectedDate: string | null;
    onDateSelect: (dateKey: string) => void;
    canEditToday?: boolean;
    weeklyRequirements?: WeekRequirement[];
}

export function MobileCalendarGrid({
    calendarDays,
    currentMonth,
    selections,
    selectedDate,
    onDateSelect,
    canEditToday = false,
    weeklyRequirements = [],
}: MobileCalendarGridProps) {
    // Group calendar days into weeks (7 days each)
    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    const { auth } = usePage<SharedData>().props;

    return (
        <div className="w-full space-y-1">
            {weeks.map((weekDays, weekIndex) => {
                const weekRequirement = weeklyRequirements[weekIndex];

                return (
                    <div className='space-y-2'>
                        {weekIndex === 0 && (
                            <div className="grid grid-cols-7 gap-2 px-2">
                                {weekdays.map((day) => (
                                    <div
                                        key={day}
                                        className="text-center text-xs font-normal text-text-primary"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div key={weekIndex} className="space-y-1">
                            {/* Weekly Progress Bar */}
                            {/* {auth.user.can_view_requirements && weekRequirement && ( */}
                            <MobileWeeklyProgress weekRequirement={weekRequirement} />
                            {/* )} */}

                            {/* Week Days Grid */}
                            <div className={cn('grid grid-cols-7 gap-1 relative',
                                weekRequirement?.is_complete && 'bg-green-500/20 rounded-md'
                                // weekRequirement?.is_complete && auth.user.can_view_requirements && 'bg-green-500/20 rounded-md'
                            )}>

                                {weekDays.map((date, dayIndex) => {
                                    const dateKey = formatDateKey(date);
                                    const isCurrentMonthDay = isSameMonth(date, currentMonth);
                                    const isPastDate = isDateInPast(date, canEditToday);
                                    const isTodayDate = isToday(date);
                                    const isWeekend = isWeekendDay(date);
                                    const hasData = !!selections[dateKey];
                                    const isSelected = selectedDate === dateKey;
                                    const isDisabled = isDateDisabled(date, currentMonth, canEditToday);

                                    // Indicator logic:
                                    // 🟢 Green: has data (any date)
                                    // 🔴 Red: past date with no data
                                    // ⚪️ Gray: current/past with no data
                                    // No indicator: current/future with no data
                                    const showGreenIndicator = hasData;
                                    const showRedIndicator = isPastDate && !hasData && isCurrentMonthDay;
                                    const showGrayIndicator = isPastDate && !isCurrentMonthDay && !hasData;

                                    const bgColor = getCardBackgroundColor(isWeekend, isDisabled, isCurrentMonthDay, weekRequirement?.is_complete || false, auth.user.can_view_requirements || false);

                                    const handleDateClick = () => {
                                        onDateSelect(dateKey);

                                        if (!isPastDate) {
                                            const element = document.getElementById(
                                                `date-card-${dateKey}`,
                                            );
                                            if (element) {
                                                element.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'start',
                                                });
                                            }
                                        }
                                    };

                                    return (
                                        <button
                                            key={`${weekIndex}-${dayIndex}`}
                                            type="button"
                                            onClick={handleDateClick}
                                            disabled={!isCurrentMonthDay}
                                            className={cn(
                                                'flex flex-col items-center justify-center p-1 rounded-lg transition-all min-h-10',
                                                bgColor,
                                                isDisabled && 'cursor-not-allowed',
                                                isCurrentMonthDay ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
                                                isSelected && 'ring-2 ring-primary/50 ring-offset-1',
                                                isTodayDate && 'border border-destructive/20',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'text-sm font-medium',
                                                    !isCurrentMonthDay && 'text-muted-foreground',
                                                    isTodayDate && 'text-primary font-bold',
                                                    isPastDate && isCurrentMonthDay && !isTodayDate && 'text-muted-foreground'
                                                )}
                                            >
                                                {formatDayNumber(date)}
                                            </span>

                                            {/* Indicator dot */}
                                            {(showGreenIndicator || showRedIndicator || showGrayIndicator) && (
                                                <div className="mt-1 h-1.5 w-1.5 rounded-full">
                                                    {showGreenIndicator && (
                                                        <div className="h-full w-full rounded-full bg-teal-500" />
                                                    )}
                                                    {showRedIndicator && (
                                                        <div className="h-full w-full rounded-full bg-destructive" />
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                );
            })}
        </div>
    );
}