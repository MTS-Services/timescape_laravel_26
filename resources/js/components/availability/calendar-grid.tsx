import { WEEKDAYS } from '@/lib/date-helpers';
import {
    formatDayNumber,
    formatDateKey,
    isDateDisabled,
    isSameMonth,
    isWeekendDay,
    isDateInPast,
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
                    const isPastDate = isDateInPast(date);
                    const isWeekend = isWeekendDay(date);

                    // Disabled if: in the past OR not in current viewing month
                    const isDisabled = isDateDisabled(date, currentMonth);

                    const selectedOption = selections[dateKey] || null;
                    const hasNoData = !selectedOption;

                    // Show "Unavailable All Day" ONLY for past dates with no data
                    // It doesn't matter which month is being viewed - if date < today, show it
                    const showUnavailable = isPastDate && hasNoData;

                    return (
                        <AvailabilityCard
                            key={index}
                            date={dateKey}
                            dayNumber={formatDayNumber(date)}
                            isWeekend={isWeekend}
                            isDisabled={isDisabled}
                            isCurrentMonth={isCurrentMonthDay}
                            isPastDate={isPastDate}
                            selectedOption={selectedOption}
                            showUnavailable={showUnavailable}
                            onOptionChange={onSelectionChange}
                        />
                    );
                })}
            </div>
        </div>
    );
}