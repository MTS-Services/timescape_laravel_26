import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn, getOptionColorClasses } from '@/lib/calendar-utils';
import type { AvailabilityOption } from '@/types/availability';

interface AvailabilityOptionProps {
    option: AvailabilityOption;
    isSelected: boolean;
    isDisabled: boolean;
    onChange: (optionId: string, checked: boolean) => void;
}

export function AvailabilityOptionComponent({
    option,
    isSelected,
    isDisabled,
    onChange,
}: AvailabilityOptionProps) {
    const colors = getOptionColorClasses(option.color, isSelected);

    return (
        <div className={cn('flex items-center space-x-2', colors.container)}>
            <Checkbox
                id={`${option.id}-${Math.random()}`}
                checked={isSelected}
                disabled={isDisabled}
                onCheckedChange={(checked) => onChange(option.id, Boolean(checked))}
                className={cn(colors.checkbox, 'h-4 w-4')}
            />
            <Label
                htmlFor={`${option.id}-${Math.random()}`}
                className={cn(
                    'text-xs cursor-pointer select-none',
                    colors.label,
                    isDisabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                {option.label}
            </Label>
        </div>
    );
}