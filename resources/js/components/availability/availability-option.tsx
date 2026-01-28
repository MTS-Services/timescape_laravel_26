import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn, getOptionColorClasses } from '@/lib/calendar-utils';
import type { AvailabilityOption } from '@/types/availability';

interface AvailabilityOptionProps {
    date: string;
    option: AvailabilityOption;
    isSelected: boolean;
    isDisabled: boolean;
    onChange: (optionId: string, checked: boolean) => void;
    isPastDate?: boolean;
}

export function AvailabilityOptionComponent({
    date,
    option,
    isSelected,
    isDisabled,
    onChange,
    isPastDate = false,
}: AvailabilityOptionProps) {
    const colors = getOptionColorClasses(option.color, isSelected);
    const [isSaving, setIsSaving] = useState(false);

    // Generate a unique ID per date AND option to prevent ID collision across date cards
    const checkboxId = `option-${date}-${option.id}`;

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

    const handleContainerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className={cn('flex items-center gap-1.5 shrink-0', isPastDate && 'flex-1 h-full justify-center', colors.container, isSaving && 'opacity-70')}
            onClick={handleContainerClick}
        >
            <Checkbox
                id={checkboxId}
                checked={isSelected}
                disabled={isDisabled || isSaving}
                onCheckedChange={handleChange}
                className={cn(colors.checkbox, 'h-3.5 w-3.5 shrink-0',
                    isPastDate && 'h-3.5! w-3.5!'
                )}
            />
            <Label
                htmlFor={checkboxId}
                className={cn(
                    'text-xs cursor-pointer select-none leading-tight',
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