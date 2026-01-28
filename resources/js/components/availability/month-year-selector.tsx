import { CalendarDays, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonthYearSelectorProps {
    currentMonth: number; // 1-12
    currentYear: number;
    onMonthYearChange: (month: number, year: number) => void;
}

export function MonthYearSelector({
    currentMonth,
    currentYear,
    onMonthYearChange,
}: MonthYearSelectorProps) {
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const calendarRef = useRef<HTMLDivElement | null>(null);
    const isCalendarOpenRef = useRef(false);

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    const minYear = 2020;
    const maxYear = new Date().getFullYear() + 5;
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

    const setCalendarVisibility = (shouldShow: boolean) => {
        isCalendarOpenRef.current = shouldShow;
        if (calendarRef.current) {
            calendarRef.current.classList.toggle('hidden', !shouldShow);
        }
    };

    const handleApply = () => {
        onMonthYearChange(selectedMonth, selectedYear);
        setCalendarVisibility(false);
    };

    const toggleCalendar = () => {
        setCalendarVisibility(!isCalendarOpenRef.current);
    };

    return (
        <div className="relative inline-block">
            <Button
                variant="ghost"
                onClick={toggleCalendar}
                size="icon"
                className="flex items-center justify-center cursor-pointer"
            >
                <CalendarDays className="w-7! h-7!" />
            </Button>

            <div
                ref={calendarRef}
                className="absolute right-0 mt-2 w-64 rounded-md border bg-card p-4 shadow-lg z-50 hidden space-y-4"
            >
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-base font-montserrat">Calendar</h4>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleCalendar}
                        className="cursor-pointer rounded-full bg-transparent"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        {/* <label className="text-xs font-medium">Month</label> */}
                        <Select
                            value={selectedMonth.toString()}
                            onValueChange={(value) => setSelectedMonth(parseInt(value, 10))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((month) => (
                                    <SelectItem key={month.value} value={month.value.toString()}>
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        {/* <label className="text-xs font-medium">Year</label> */}
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCalendarVisibility(false)}
                            className='cursor-pointer'
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApply}
                            className='cursor-pointer'
                        >
                            Apply
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
