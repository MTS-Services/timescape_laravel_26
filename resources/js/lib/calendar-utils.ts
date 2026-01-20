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
    if (!isCurrentMonth) return 'bg-muted/30';
    if (isDisabled) return 'bg-muted/50';
    if (isWeekend) return 'bg-red-50 dark:bg-red-950/20';
    return 'bg-background';
}

export function getOptionColorClasses(
    colorName: 'teal' | 'gray',
    isSelected: boolean
): {
    container: string;
    checkbox: string;
    label: string;
} {
    if (colorName === 'teal') {
        return {
            container: 'group',
            checkbox: isSelected
                ? 'border-teal-500 bg-teal-500 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500'
                : 'border-teal-500',
            label: isSelected ? 'text-teal-700 font-medium' : 'text-teal-700',
        };
    }

    return {
        container: 'group',
        checkbox: isSelected
            ? 'border-gray-400 bg-gray-400 data-[state=checked]:bg-gray-400 data-[state=checked]:border-gray-400'
            : 'border-gray-400',
        label: isSelected ? 'text-gray-700 font-medium' : 'text-gray-600',
    };
}