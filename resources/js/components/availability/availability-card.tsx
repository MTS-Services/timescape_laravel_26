import { AVAILABILITY_OPTIONS } from '@/lib/date-helpers';
import { cn, getCardBackgroundColor } from '@/lib/calendar-utils';
import { AvailabilityOptionComponent } from './availability-option';
import { MinusCircle } from 'lucide-react';

interface AvailabilityCardProps {
    date: string;
    dayNumber: string;
    isWeekend: boolean;
    isDisabled: boolean;
    isCurrentMonth: boolean;
    isPastDate: boolean;
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
            </div>

            {showUnavailable ? (
                /* Show "Unavailable All Day" for any past date with no data */
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <MinusCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                        Unavailable All Day
                    </span>
                </div>
            ) : (
                /* Show options for all other dates (disabled state handled by checkbox) */
                <div className="space-y-2">
                    {AVAILABILITY_OPTIONS.map((option) => (
                        <AvailabilityOptionComponent
                            key={option.id}
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