export const WEEKDAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const;

export const weekdays = [
    'Mon', 'Tu', 'Wed', 'Th', 'Fri', 'Sat', 'Sun'
] as const;

export type AvailabilityOptionItem = {
    id: string;
    label: string;
    color: 'teal' | 'gray';
};

export const STANDARD_AVAILABILITY_OPTIONS: AvailabilityOptionItem[] = [
    { id: '9:30-4:30', label: '9:30 AM - 4:30 PM', color: 'teal' },
    { id: '3:30-10:30', label: '3:30 PM - 10:30 PM', color: 'gray' },
    { id: 'all-day', label: 'All Day', color: 'gray' },
    { id: 'holiday', label: 'Holiday', color: 'gray' },
];

/** Priority 1 users (from When I Work notes): extended shift windows */
export const PRIORITY_ONE_AVAILABILITY_OPTIONS: AvailabilityOptionItem[] = [
    { id: '9:30-5:30', label: '9:30 AM - 5:30 PM', color: 'teal' },
    { id: '2:00-10:00', label: '2:00 PM - 10:00 PM', color: 'gray' },
    { id: 'all-day', label: 'All Day', color: 'gray' },
    { id: 'holiday', label: 'Holiday', color: 'gray' },
];

/** Default options for non-priority-1 users (backward compatibility) */
export const AVAILABILITY_OPTIONS = STANDARD_AVAILABILITY_OPTIONS;

export function getAvailabilityOptionsForPriority(
    priority: number | null | undefined
): AvailabilityOptionItem[] {
    return priority === 1 ? PRIORITY_ONE_AVAILABILITY_OPTIONS : STANDARD_AVAILABILITY_OPTIONS;
}

const AVAILABILITY_SLOT_LABELS: Record<string, string> = {
    '9:30-4:30': '9:30 AM - 4:30 PM',
    '3:30-10:30': '3:30 PM - 10:30 PM',
    '9:30-5:30': '9:30 AM - 5:30 PM',
    '2:00-10:00': '2:00 PM - 10:00 PM',
    'all-day': 'All Day',
    holiday: 'Holiday',
};

/**
 * Get indicator states for a calendar day based on the selected availability option.
 * Returns active color classes for each of the 3 indicator dots.
 */
export function getIndicatorColors(selectedOption: string | null): [string, string, string] {
    const muted = 'bg-muted-foreground';
    const teal  = 'bg-teal-500';
    const red   = 'bg-destructive';

    switch (selectedOption) {
        case '9:30-4:30':
        case '9:30-5:30':  return [teal,  muted, muted];
        case '3:30-10:30':
        case '2:00-10:00': return [muted, teal,  muted];
        case 'all-day':    return [teal,  teal,  muted];
        case 'holiday':    return [muted, muted, red  ];
        default:           return [muted, muted, muted];
    }
}

/**
 * Create a date in local timezone without time component
 */
function createLocalDate(year: number, month: number, day: number): Date {
    return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Parse a date string (YYYY-MM-DD) as local date
 */
export function parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return createLocalDate(year, month - 1, day);
}

/**
 * Get today's date at midnight in local timezone
 */
export function getToday(): Date {
    const now = new Date();
    return createLocalDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function startOfMonth(date: Date): Date {
    return createLocalDate(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
    return createLocalDate(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isSameMonth(date1: Date, date2: Date): boolean {
    return (
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
}

export function generateCalendarDays(currentDate: Date): Date[] {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const startDay = monthStart.getDay();
    const daysToSubtract = startDay === 0 ? 6 : startDay - 1;

    const calendarStart = createLocalDate(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        monthStart.getDate() - daysToSubtract
    );

    const endDay = monthEnd.getDay();
    const daysToAdd = endDay === 0 ? 0 : 7 - endDay;

    const calendarEnd = createLocalDate(
        monthEnd.getFullYear(),
        monthEnd.getMonth(),
        monthEnd.getDate() + daysToAdd
    );

    const days: Date[] = [];
    const current = new Date(calendarStart);

    while (current <= calendarEnd) {
        days.push(createLocalDate(
            current.getFullYear(),
            current.getMonth(),
            current.getDate()
        ));
        current.setDate(current.getDate() + 1);
    }

    return days;
}

/**
 * Check if a date is in the past (BEFORE today, not including today)
 */
export function isDateInPast(date: Date, canEditToday: boolean = false): boolean {
    const today = getToday();
    const dateToCheck = createLocalDate(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
    if (!canEditToday) {
        return dateToCheck.getTime() <= today.getTime();
    }
    return dateToCheck.getTime() < today.getTime();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
    const today = getToday();
    const dateToCheck = createLocalDate(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    return dateToCheck.getTime() === today.getTime();
}

/**
 * Check if a date should be disabled for editing
 * @param date - The date to check
 * @param viewingMonth - The currently viewed month
 * @param canEditToday - Whether editing today is allowed (from backend config)
 */
export function isDateDisabled(date: Date, viewingMonth: Date, canEditToday: boolean = false, isMobileOption: boolean = false): boolean {
    const isPast = isDateInPast(date, canEditToday);
    const notInViewingMonth = !isSameMonth(date, viewingMonth);

    if (notInViewingMonth) {
        return true;
    }

    if (isPast && !isMobileOption) {
        return true;
    }

    return false;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekendDay(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
}

export function formatMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatDayNumber(date: Date): string {
    return date.getDate().toString().padStart(2, '0');
}

/**
 * Format date as YYYY-MM-DD in local timezone (critical for matching DB keys)
 */
export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function addMonths(date: Date, months: number): Date {
    return createLocalDate(
        date.getFullYear(),
        date.getMonth() + months,
        date.getDate()
    );
}

/**
 * Get the display text and icon type for read-only past dates
 */
export function getPastDateDisplay(selectedOption: string | null): {
    label: string;
    iconType: 'minus' | 'checkbox' | null;
} {
    if (!selectedOption) {
        return { label: '', iconType: null };
    }

    if (selectedOption === 'holiday') {
        return { label: AVAILABILITY_SLOT_LABELS.holiday, iconType: 'minus' };
    }

    if (selectedOption === 'all-day') {
        return { label: AVAILABILITY_SLOT_LABELS['all-day'], iconType: 'checkbox' };
    }

    return {
        label: AVAILABILITY_SLOT_LABELS[selectedOption] ?? selectedOption,
        iconType: 'checkbox',
    };
}

/**
 * Get week number for a given date (used to match with weekly requirements)
 * Returns the index of the week within the calendar view
 */
export function getWeekNumber(date: Date, calendarStart: Date): number {
    const diffTime = date.getTime() - calendarStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}