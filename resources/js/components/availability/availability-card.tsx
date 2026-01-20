import { AVAILABILITY_OPTIONS } from '@/lib/date-helpers';
import { cn, getCardBackgroundColor } from '@/lib/calendar-utils';
import { AvailabilityOptionComponent } from './availability-option';
import type { AvailabilitySelections } from '@/types/availability';

interface AvailabilityCardProps {
    date: string;
    dayNumber: string;
    isWeekend: boolean;
    isDisabled: boolean;
    isCurrentMonth: boolean;
    selectedOption: string | null;
    onOptionChange: (date: string, optionId: string | null) => void;
}

export function AvailabilityCard({
    date,
    dayNumber,
    isWeekend,
    isDisabled,
    isCurrentMonth,
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

    return (
        <div
            className={cn(
                'rounded-lg border p-4 min-h-[180px] transition-colors',
                bgColor,
                isDisabled && 'opacity-60 cursor-not-allowed',
                !isDisabled && 'hover:shadow-sm'
            )}
        >
            <div className="mb-3 text-lg font-semibold text-foreground">
                {dayNumber}
            </div>

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
        </div>
    );
}