import { CheckSquare, Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { AVAILABILITY_OPTIONS, parseLocalDate } from '@/lib/date-helpers';
import { cn } from '@/lib/utils';

/**
 * Get the display text and icon type for read-only past dates
 */
function getPastDateDisplay(selectedOption: string | null): {
    label: string;
    iconType: 'minus' | 'checkbox';
} {
    if (!selectedOption) {
        return { label: 'Unavailable All Day', iconType: 'minus' };
    }

    if (selectedOption === 'holiday') {
        return { label: 'Unavailable All Day', iconType: 'minus' };
    }

    if (selectedOption === 'all-day') {
        return { label: 'Preferred All Day', iconType: 'checkbox' };
    }

    const option = AVAILABILITY_OPTIONS.find(opt => opt.id === selectedOption);
    return {
        label: option?.label || selectedOption,
        iconType: 'checkbox'
    };
}

interface MobileAvailabilityCardProps {
    dateKey: string;
    selectedOption: string | null;
    isDisabled: boolean;
    isPastDate: boolean;
    onOptionChange: (dateKey: string, optionId: string | null) => void;
    allowCollapse?: boolean;
}

export function MobileAvailabilityCard({
    dateKey,
    selectedOption,
    isDisabled,
    isPastDate,
    onOptionChange,
    allowCollapse = true,
}: MobileAvailabilityCardProps) {
    const [isOpen, setIsOpen] = useState(true);
    const effectiveIsOpen = allowCollapse ? isOpen : true;
    const [savingOption, setSavingOption] = useState<string | null>(null);

    const date = parseLocalDate(dateKey);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const handleOptionChange = (optionId: string, checked: boolean) => {
        if (isDisabled) return;

        setSavingOption(optionId);

        if (checked) {
            onOptionChange(dateKey, optionId);
        } else {
            onOptionChange(dateKey, null);
        }

        setTimeout(() => {
            setSavingOption(null);
        }, 500);
    };

    return (
        <Collapsible open={effectiveIsOpen} onOpenChange={allowCollapse ? setIsOpen : undefined} className="w-full">
            <div className="rounded-lg border bg-card overflow-hidden">
                {allowCollapse ? (
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center justify-between w-full px-4 py-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        >
                            <span className="text-sm font-semibold text-secondary">
                                {formattedDate}
                            </span>
                            <span className="flex items-center justify-center w-6 h-6 rounded bg-secondary text-secondary-foreground">
                                {effectiveIsOpen ? (
                                    <Minus className="h-4 w-4" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </span>
                        </button>
                    </CollapsibleTrigger>
                ) : (
                    <div className="flex items-center justify-between w-full px-4 py-3 bg-muted/50">
                        <span className="text-sm font-semibold text-secondary">
                            {formattedDate}
                        </span>
                    </div>
                )}

                <CollapsibleContent>
                    <div className="p-4 space-y-3">
                        {isPastDate ? (
                            /* Show read-only preview for past dates */
                            (() => {
                                const pastDateDisplay = getPastDateDisplay(selectedOption);
                                return (
                                    <div className="flex items-center space-x-3 py-2">
                                        {pastDateDisplay.iconType === 'minus' ? (
                                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive/80">
                                                <Minus className="h-3 w-3 text-background" />
                                            </div>
                                        ) : (
                                            <CheckSquare className="h-5 w-5 text-teal-500" />
                                        )}
                                        <span className={cn(
                                            "text-sm font-medium",
                                            pastDateDisplay.iconType === 'minus'
                                                ? "text-destructive/70"
                                                : "text-teal-600"
                                        )}>
                                            {pastDateDisplay.label}
                                        </span>
                                    </div>
                                );
                            })()
                        ) : (
                            /* Show all options for editable dates */
                            AVAILABILITY_OPTIONS.map((option) => {
                                const isSelected = selectedOption === option.id;
                                const isSaving = savingOption === option.id;
                                const checkboxId = `mobile-option-${dateKey}-${option.id}`;

                                return (
                                    <div
                                        key={option.id}
                                        className={cn(
                                            'flex items-center space-x-3 py-1',
                                            isSaving && 'opacity-70'
                                        )}
                                    >
                                        <Checkbox
                                            id={checkboxId}
                                            checked={isSelected}
                                            disabled={isDisabled || isSaving}
                                            onCheckedChange={(checked) =>
                                                handleOptionChange(option.id, Boolean(checked))
                                            }
                                            className="h-5 w-5"
                                        />
                                        <Label
                                            htmlFor={checkboxId}
                                            className={cn(
                                                'text-sm cursor-pointer select-none',
                                                isSelected && 'text-secondary font-medium',
                                                (isDisabled || isSaving) && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            {option.label}
                                            {isSaving && (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    (saving...)
                                                </span>
                                            )}
                                        </Label>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
