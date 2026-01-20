import { WEEKDAYS } from '@/lib/date-helpers';
import {
    formatDayNumber,
    formatDateKey,
    isDateDisabled,
    isSameMonth,
    isWeekendDay,
} from '@/lib/date-helpers';
import { AvailabilityCard } from './availability-card';
import type { AvailabilitySelections } from '@/types/availability';

interface CalendarGridProps {
    calendarDays: Date[];
    currentMonth: Date;
    selections: AvailabilitySelections;
    onSelectionChange: (date: string, optionId: string | null) => void;
}

export function CalendarGrid({
    calendarDays,
    currentMonth,
    selections,
    onSelectionChange,
}: CalendarGridProps) {
    return (
        <div className="rounded-lg border bg-card shadow-sm">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-4 border-b p-4">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-sm font-semibold text-muted-foreground"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-4 p-4">
                {calendarDays.map((date, index) => {
                    const dateKey = formatDateKey(date);
                    const isCurrentMonthDay = isSameMonth(date, currentMonth);
                    const isDisabled = isDateDisabled(date, currentMonth);
                    const isWeekend = isWeekendDay(date);

                    return (
                        <AvailabilityCard
                            key={index}
                            date={dateKey}
                            dayNumber={formatDayNumber(date)}
                            isWeekend={isWeekend}
                            isDisabled={isDisabled}
                            isCurrentMonth={isCurrentMonthDay}
                            selectedOption={selections[dateKey] || null}
                            onOptionChange={onSelectionChange}
                        />
                    );
                })}
            </div>
        </div>
    );
}