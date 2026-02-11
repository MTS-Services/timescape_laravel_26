import { WEEKDAYS } from '@/lib/date-helpers';
import {
    formatDayNumber,
    formatDateKey,
    isDateDisabled,
    isSameMonth,
    isWeekendDay,
    isDateInPast,
    isToday,
    getWeekNumber,
} from '@/lib/date-helpers';
import type { AvailabilitySelections } from '@/types/availability';

import { AvailabilityCard } from './availability-card';
import { WeeklyProgress } from './weekly-progress';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

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

interface CalendarGridProps {
    calendarDays: Date[];
    currentMonth: Date;
    selections: AvailabilitySelections;
    onSelectionChange: (date: string, optionId: string | null) => void;
    canEditToday?: boolean;
    weeklyRequirements?: WeekRequirement[];
}

export function CalendarGrid({
    calendarDays,
    currentMonth,
    selections,
    onSelectionChange,
    canEditToday = false,
    weeklyRequirements = [],
}: CalendarGridProps) {
    const { auth } = usePage<SharedData>().props;
    // Group calendar days into weeks (7 days each)
    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
        <div>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 pt-3 pb-6 ">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-sm sm:text-base font-normal text-text-primary"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Weeks */}
            <div className="space-y-4">
                {weeks.map((weekDays, weekIndex) => {
                    const weekRequirement = weeklyRequirements[weekIndex];
                    return (
                        <div key={weekIndex}>
                            {/* Weekly Progress Bar */}
                            {auth.user.can_view_requirements && weekRequirement && (
                                <WeeklyProgress weekRequirement={weekRequirement} />
                            )}

                            {/* Week Days Grid */}
                            <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 relative">
                                {weekRequirement?.is_complete && (
                                    <span className="absolute top-0 left-0 h-full w-full bg-green-500/20 rounded-md"></span>
                                )}
                                {weekDays.map((date, dayIndex) => {
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
                                            key={`${weekIndex}-${dayIndex}`}
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
                })}
            </div>
        </div>
    );
}