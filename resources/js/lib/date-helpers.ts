export const WEEKDAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const;

export const AVAILABILITY_OPTIONS: Array<{
    id: string;
    label: string;
    color: 'teal' | 'gray';
}> = [
        { id: '9:30-4:30', label: '9:30 AM - 4:30 PM', color: 'teal' },
        { id: '3:30-10:30', label: '3:30 PM - 10:30 PM', color: 'gray' },
        { id: 'all-day', label: 'All Day', color: 'gray' },
        { id: 'holyday', label: 'Holyday', color: 'gray' },
    ];

export function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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

    const calendarStart = new Date(monthStart);
    calendarStart.setDate(monthStart.getDate() - daysToSubtract);

    const calendarEnd = new Date(monthEnd);
    const endDay = monthEnd.getDay();
    const daysToAdd = endDay === 0 ? 0 : 7 - endDay;
    calendarEnd.setDate(monthEnd.getDate() + daysToAdd);

    const days: Date[] = [];
    const current = new Date(calendarStart);
    while (current <= calendarEnd) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return days;
}

/**
 * Check if a date is in the past (before today)
 * This is ABSOLUTE - doesn't care about which month is being viewed
 */
export function isDateInPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    return dateToCheck < today;
}

/**
 * Check if a date should be disabled for editing
 * A date is disabled if it's in the past OR not in the viewing month
 */
export function isDateDisabled(date: Date, viewingMonth: Date): boolean {
    const isPast = isDateInPast(date);
    const notInViewingMonth = !isSameMonth(date, viewingMonth);

    return isPast || notInViewingMonth;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekendDay(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

export function formatMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatDayNumber(date: Date): string {
    return date.getDate().toString().padStart(2, '0');
}

export function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}