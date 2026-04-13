import { type ClassValue, clsx } from 'clsx';

/** Shared surface for days marked as holiday (leave) across grid and mobile list cards */
export const HOLIDAY_CARD_SURFACE_CLASSES =
    'bg-orange-50 dark:bg-orange-950/25 border-orange-200 dark:border-orange-800/40';

export function getCardBackgroundColor(
    isWeekend: boolean,
    isDisabled: boolean,
    isCurrentMonth: boolean,
    isComplete: boolean = false,
    canViewRequirements: boolean = false,
    selectedOption: string | null = null
): string {
    // Weekend cards are always red, regardless of disabled state
    // if (isWeekend) {
    //     return 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30';
    // }

    // if (selectedOption === 'holiday') {
    //     return HOLIDAY_CARD_SURFACE_CLASSES;
    // }

    // Complete
    // if (isComplete && !isDisabled && canViewRequirements) {
    //     return 'bg-transparent border-muted/50';
    // }
    // if (isComplete && !isDisabled) {
    //     return 'bg-transparent border-muted/50';
    // }

    // Not in current month
    if (!isCurrentMonth) {
        return 'bg-muted/30 border-muted';
    }

    // Disabled (past dates)
    if (isDisabled) {
        return 'bg-muted/50 border-muted';
    }

    // Normal weekday
    return 'bg-card shadow md:shadow-xs border-border';
}

export function getOptionColorClasses(
    colorName: 'teal' | 'gray',
    isSelected: boolean
): {
    container: string;
    checkbox: string;
    label: string;
} {
    return {
        container: 'group',
        checkbox: '',
        label: isSelected ? 'text-text-primary' : 'text-text-primary',
    };
}