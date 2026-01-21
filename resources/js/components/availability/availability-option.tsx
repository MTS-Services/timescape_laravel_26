import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn, getOptionColorClasses } from '@/lib/calendar-utils';
import type { AvailabilityOption } from '@/types/availability';
import { useState } from 'react';

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
    const [isSaving, setIsSaving] = useState(false);

    // Generate a stable ID using option.id
    const checkboxId = `option-${option.id}`;

    const handleChange = (checked: boolean) => {
        if (isDisabled) return;

        // Set temporary saving state
        setIsSaving(true);

        // Call the parent's onChange handler
        onChange(option.id, Boolean(checked));

        // Reset saving state after a brief delay to show feedback
        setTimeout(() => {
            setIsSaving(false);
        }, 500);
    };

    return (
        <div className={cn('flex items-center space-x-2', colors.container,
            isSaving && 'opacity-70')}>
            <Checkbox
                id={checkboxId}
                checked={isSelected}
                disabled={isDisabled || isSaving}
                onCheckedChange={handleChange}
                className={cn(colors.checkbox, 'h-4 w-4')}
            />
            <Label
                htmlFor={checkboxId}
                className={cn(
                    'text-xs cursor-pointer select-none',
                    colors.label,
                    (isDisabled || isSaving) && 'opacity-50 cursor-not-allowed'
                )}
            >
                {option.label}
                {isSaving && <span className="ml-1 text-xs text-muted-foreground">(saving...)</span>}
            </Label>
        </div>
    );
}