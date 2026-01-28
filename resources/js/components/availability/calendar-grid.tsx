import { WEEKDAYS } from '@/lib/date-helpers';
import {
    formatDayNumber,
    formatDateKey,
    isDateDisabled,
    isSameMonth,
    isWeekendDay,
    isDateInPast,
    isToday,
} from '@/lib/date-helpers';
import type { AvailabilitySelections } from '@/types/availability';

import { AvailabilityCard } from './availability-card';

interface CalendarGridProps {
    calendarDays: Date[];
    currentMonth: Date;
    selections: AvailabilitySelections;
    onSelectionChange: (date: string, optionId: string | null) => void;
    canEditToday?: boolean;
}

export function CalendarGrid({
    calendarDays,
    currentMonth,
    selections,
    onSelectionChange,
    canEditToday = false,
}: CalendarGridProps) {
    // console.log('Rendering CalendarGrid with days:', calendarDays);
    // console.log('Current month:', currentMonth);
    // console.log('Selections:', selections);
    // console.log('onSelectionChange:', onSelectionChange);
    return (
        <div>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 px-2 sm:px-3 lg:px-4 pt-3 pb-6 sm:pt-4 sm:pb-8 lg:pt-5 lg:pb-10">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-sm sm:text-base font-normal text-text-primary"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 px-2 sm:px-3 lg:px-4">
                {calendarDays.map((date, index) => {
                    const dateKey = formatDateKey(date);
                    const isCurrentMonthDay = isSameMonth(date, currentMonth);
                    const isPastDate = isDateInPast(date, canEditToday);
                    const isTodayDate = isToday(date);
                    const isWeekend = isWeekendDay(date);

                    // Disabled if: in the past OR today (when canEditToday is false) OR not in current viewing month
                    const isDisabled = isDateDisabled(date, currentMonth, canEditToday);

                    const selectedOption = selections[dateKey] || null;

                    return (
                        <AvailabilityCard
                            key={index}
                            date={dateKey}
                            dayNumber={formatDayNumber(date)}
                            isWeekend={isWeekend}
                            isDisabled={isDisabled}
                            isCurrentMonth={isCurrentMonthDay}
                            isPastDate={isPastDate}
                            isToday={isTodayDate}
                            selectedOption={selectedOption}
                            onOptionChange={onSelectionChange}
                        />
                    );
                })}
            </div>
        </div>
    );
}