import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getCardBackgroundColor(
    isWeekend: boolean,
    isDisabled: boolean,
    isCurrentMonth: boolean
): string {
    // Weekend cards are always red, regardless of disabled state
    // if (isWeekend) {
    //     return 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30';
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
    return 'bg-card border-border';
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