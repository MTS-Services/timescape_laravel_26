import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
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
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);

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

    const currentYearNum = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYearNum - 5 + i);

    const handleApply = () => {
        onMonthYearChange(selectedMonth, selectedYear);
        setIsOpen(false);
    };

    const toggleCalendar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative inline-block">
            <Button
                variant="outline"
                size="sm"
                onClick={toggleCalendar}
                className="flex items-center"
            >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Select Month & Year</span>
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-md border bg-card p-4 shadow-lg z-50">
                    <h4 className="font-medium mb-2">Select Month & Year</h4>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-medium">Month</label>
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
                            <label className="text-xs font-medium">Year</label>
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
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApply}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
