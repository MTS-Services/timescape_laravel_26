import { CheckSquare, Minus } from 'lucide-react';

import { cn, getCardBackgroundColor } from '@/lib/calendar-utils';
import { AVAILABILITY_OPTIONS, getPastDateDisplay } from '@/lib/date-helpers';

import { AvailabilityOptionComponent } from './availability-option';

/**
 * Get the display text and icon type for read-only past dates
 * Based on requirements:
 * - holiday → "Unavailable All Day" with minus icon
 * - all-day → "Preferred All Day" with checkbox icon
 * - time slots → Show the time slot label with checkbox icon
 * - no data → "Unavailable All Day" with minus icon
 */

interface AvailabilityCardProps {
    date: string;
    dayNumber: string;
    isWeekend: boolean;
    isDisabled: boolean;
    isCurrentMonth: boolean;
    isPastDate: boolean;
    isToday: boolean;
    selectedOption: string | null;
    onOptionChange: (date: string, optionId: string | null) => void;
}

export function AvailabilityCard({
    date,
    dayNumber,
    isWeekend,
    isDisabled,
    isCurrentMonth,
    isPastDate,
    isToday,
    selectedOption,
    onOptionChange,
}: AvailabilityCardProps) {
    const bgColor = getCardBackgroundColor(isWeekend, isDisabled, isCurrentMonth);

    const handleOptionChange = (optionId: string, checked: boolean) => {
        if (isDisabled) return;

        if (checked) {
            onOptionChange(date, optionId);
        } else {
            onOptionChange(date, null);
        }
    };

    // For past/disabled dates, get the appropriate display
    const pastDateDisplay = isPastDate ? getPastDateDisplay(selectedOption) : null;

    return (
        <div
            className={cn(
                'rounded-lg border p-2 sm:p-3 lg:p-4 transition-colors aspect-square flex flex-col',
                bgColor,
                isDisabled && 'cursor-not-allowed',
                !isDisabled && 'hover:shadow-sm',
                isToday && 'border-destructive/20'
            )}
        >
            <div className={cn(
                "mb-2 sm:mb-2.5 lg:mb-3 text-sm sm:text-base lg:text-lg font-semibold shrink-0",
                isDisabled ? "text-muted-foreground" : "text-foreground"
            )}>
                {dayNumber}
            </div>

            <div className="flex-1 h-auto flex items-center justify-center">
                {isPastDate && pastDateDisplay ? (
                    /* Show read-only preview for past dates */
                    <div className='flex flex-col items-center justify-center'>
                        <div className="flex items-center justify-center gap-1">
                            {pastDateDisplay.iconType === 'minus' ? (
                                <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-destructive/80">
                                    <Minus className="h-2.5 w-2.5 text-background" />
                                </div>
                            ) : (
                                <CheckSquare className="h-3.5 w-3.5 text-secondary" />
                            )}
                            <span className={cn(
                                "text-xs",
                                pastDateDisplay.iconType === 'minus'
                                    ? "text-muted-foreground"
                                    : "text-muted-foreground"
                            )}>
                                {pastDateDisplay.label}
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Show all options for editable dates (today when editable, and future) */
                    <div className="space-y-1.5">
                        {AVAILABILITY_OPTIONS.map((option) => (
                            <AvailabilityOptionComponent
                                key={option.id}
                                date={date}
                                option={option}
                                isSelected={selectedOption === option.id}
                                isDisabled={isDisabled}
                                onChange={handleOptionChange}
                                isPastDate={false}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}