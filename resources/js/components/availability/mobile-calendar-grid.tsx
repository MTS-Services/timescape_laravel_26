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

interface MobileCalendarGridProps {
    calendarDays: Date[];
    currentMonth: Date;
    selections: AvailabilitySelections;
    selectedDate: string | null;
    onDateSelect: (dateKey: string) => void;
    canEditToday?: boolean;
}

export function MobileCalendarGrid({
    calendarDays,
    currentMonth,
    selections,
    selectedDate,
    onDateSelect,
    canEditToday = false,
}: MobileCalendarGridProps) {

    return (
        <div className="w-full">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 px-2 sm:px-3 lg:px-4 pt-3 pb-6 sm:pt-4 sm:pb-8 lg:pt-5 lg:pb-10">
                {weekdays.map((day) => (
                    <div
                        key={day}
                        className="text-center text-sm sm:text-base font-normal text-text-primary"
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
                    const isPastDate = isDateInPast(date, canEditToday);
                    const isTodayDate = isToday(date);
                    const isWeekend = isWeekendDay(date);
                    const hasData = !!selections[dateKey];
                    const isSelected = selectedDate === dateKey;
                    const isDisabled = isDateDisabled(date, currentMonth, canEditToday);

                    // Indicator logic:
                    // 🟢 Green: has data (any date)
                    // 🔴 Red: past date with no data
                    // No indicator: current/future with no data
                    const showGreenIndicator = hasData;
                    const showRedIndicator = isPastDate && !hasData && isCurrentMonthDay;

                    const bgColor = getCardBackgroundColor(isWeekend, isDisabled, isCurrentMonthDay);

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onDateSelect(dateKey)}
                            disabled={!isCurrentMonthDay}
                            className={cn(
                                'relative flex flex-col items-center justify-center p-2 rounded-lg transition-all min-h-[48px]',
                                bgColor,
                                isDisabled && 'cursor-not-allowed',
                                isCurrentMonthDay ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
                                isSelected && 'ring-2 ring-primary/50 ring-offset-1',
                                isTodayDate && 'border border-destructive/20',
                                // !isCurrentMonthDay && 'bg-muted/30',
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
                            {(showGreenIndicator || showRedIndicator) && (
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
