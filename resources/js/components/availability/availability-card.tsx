import { Minus } from 'lucide-react';

import { cn, getCardBackgroundColor } from '@/lib/calendar-utils';
import { AVAILABILITY_OPTIONS } from '@/lib/date-helpers';

import { AvailabilityOptionComponent } from './availability-option';


interface AvailabilityCardProps {
    date: string;
    dayNumber: string;
    isWeekend: boolean;
    isDisabled: boolean;
    isCurrentMonth: boolean;
    isPastDate: boolean;
    isToday: boolean;
    selectedOption: string | null;
    showUnavailable: boolean;
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
    showUnavailable,
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

    // For past dates with data, show ONLY the selected option (read-only view)
    const shouldShowReadOnlyOption = isPastDate && selectedOption && !showUnavailable;

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
                {isToday && (
                    <span className="ml-2 text-xs font-normal text-primary">
                        (Today)
                    </span>
                )}
            </div>

            <div className="flex-1 h-auto flex items-center justify-center">
                {showUnavailable ? (
                    /* Show "Unavailable All Day" for past dates with no data */
                    <div className='flex flex-col items-center justify-center gap-2'>
                        <div className="flex items-center justify-start gap-1">
                            <div className="flex items-center justify-center w-3 h-3 rounded-full bg-destructive">
                                <Minus className="h-2 w-2 text-background" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                                Unavailable All Day
                            </span>
                        </div>
                    </div>
                ) : shouldShowReadOnlyOption ? (
                    /* Show ONLY the selected option for past dates (read-only) */
                    <div className="space-y-1.5">
                        {AVAILABILITY_OPTIONS.filter(opt => opt.id === selectedOption).map((option) => (
                            <AvailabilityOptionComponent
                                key={option.id}
                                date={date}
                                option={option}
                                isSelected={true}
                                isDisabled={true}
                                onChange={handleOptionChange}
                                isPastDate={true}
                            />
                        ))}
                    </div>
                ) : (
                    /* Show all options for editable dates (today and future) */
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