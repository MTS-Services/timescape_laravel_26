import { MinusCircle } from 'lucide-react';

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
                'rounded-lg border p-4 min-h-[180px] transition-colors',
                bgColor,
                isDisabled && 'cursor-not-allowed',
                !isDisabled && 'hover:shadow-sm'
            )}
        >
            <div className={cn(
                "mb-3 text-lg font-semibold",
                isDisabled ? "text-muted-foreground" : "text-foreground"
            )}>
                {dayNumber}
                {isToday && (
                    <span className="ml-2 text-xs font-normal text-primary">
                        (Today)
                    </span>
                )}
            </div>

            {showUnavailable ? (
                /* Show "Unavailable All Day" for past dates with no data */
                <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30">
                        <MinusCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                    </div>
                    <span className="text-xs text-muted-foreground text-center">
                        Unavailable All Day
                    </span>
                </div>
            ) : shouldShowReadOnlyOption ? (
                /* Show ONLY the selected option for past dates (read-only) */
                <div className="space-y-2">
                    {AVAILABILITY_OPTIONS.filter(opt => opt.id === selectedOption).map((option) => (
                        <AvailabilityOptionComponent
                            key={option.id}
                            date={date}
                            option={option}
                            isSelected={true}
                            isDisabled={true}
                            onChange={handleOptionChange}
                        />
                    ))}
                </div>
            ) : (
                /* Show all options for editable dates (today and future) */
                <div className="space-y-2">
                    {AVAILABILITY_OPTIONS.map((option) => (
                        <AvailabilityOptionComponent
                            key={option.id}
                            date={date}
                            option={option}
                            isSelected={selectedOption === option.id}
                            isDisabled={isDisabled}
                            onChange={handleOptionChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}