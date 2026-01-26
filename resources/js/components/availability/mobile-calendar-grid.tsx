import {
    formatDayNumber,
    formatDateKey,
    isSameMonth,
    isWeekendDay,
    isDateInPast,
    isToday,
} from '@/lib/date-helpers';
import { cn } from '@/lib/utils';
import type { AvailabilitySelections } from '@/types/availability';

interface MobileCalendarGridProps {
    calendarDays: Date[];
    currentMonth: Date;
    selections: AvailabilitySelections;
    selectedDate: string | null;
    onDateSelect: (dateKey: string) => void;
}

export function MobileCalendarGrid({
    calendarDays,
    currentMonth,
    selections,
    selectedDate,
    onDateSelect,
}: MobileCalendarGridProps) {
    const weekdays = ['Mon', 'Tu', 'Wed', 'Th', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="w-full">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                    const dateKey = formatDateKey(date);
                    const isCurrentMonthDay = isSameMonth(date, currentMonth);
                    const isPastDate = isDateInPast(date);
                    const isTodayDate = isToday(date);
                    const isWeekend = isWeekendDay(date);
                    const hasData = !!selections[dateKey];
                    const isSelected = selectedDate === dateKey;

                    // Indicator logic:
                    // 🟢 Green: has data (any date)
                    // 🔴 Red: past date with no data
                    // No indicator: current/future with no data
                    const showGreenIndicator = hasData;
                    const showRedIndicator = isPastDate && !hasData && isCurrentMonthDay;

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onDateSelect(dateKey)}
                            disabled={!isCurrentMonthDay}
                            className={cn(
                                'relative flex flex-col items-center justify-center p-2 rounded-lg transition-all min-h-[48px]',
                                isCurrentMonthDay ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                                isWeekend && isCurrentMonthDay && 'bg-red-50 dark:bg-red-950/20',
                                !isWeekend && isCurrentMonthDay && 'bg-background',
                                isSelected && 'ring-2 ring-primary ring-offset-1',
                                isTodayDate && 'border-2 border-primary',
                                !isCurrentMonthDay && 'bg-muted/30'
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
                            {isCurrentMonthDay && (
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
    );
}
