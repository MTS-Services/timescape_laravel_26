import { ChevronLeft, ChevronRight, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { MonthYearSelector } from './month-year-selector';

interface MobileAvailabilityHeaderProps {
    currentMonth: string;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    onMonthYearChange?: (month: number, year: number) => void;
    currentMonthNum?: number;
    currentYearNum?: number;
    showStaffButton?: boolean;
    onStaffListClick?: () => void;
}

export function MobileAvailabilityHeader({
    currentMonth,
    onPrevMonth,
    onNextMonth,
    onToday,
    onMonthYearChange,
    currentMonthNum,
    currentYearNum,
    showStaffButton = false,
    onStaffListClick,
}: MobileAvailabilityHeaderProps) {
    const monthName = currentMonth.split(' ')[0];
    const year = currentMonth.split(' ')[1];

    return (
        <div className="space-y-3 mb-4">
            {/* Top row: Staff list button (admin only) + date picker + today */}
            <div className="flex items-center justify-between gap-2">
                {showStaffButton ? (
                    <Button
                        variant="outline"
                        onClick={onStaffListClick}
                        className="flex items-center gap-2 cursor-pointer w-full max-w-40 md:max-w-64 py"
                    >
                        <Users className="h-4 w-4" />
                        <span>Staff List</span>
                    </Button>
                ) : (
                    <div className="px-4 py-2 rounded-md border border-input bg-background text-sm font-medium">
                        Availability For {currentMonth}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {onMonthYearChange && currentMonthNum && currentYearNum && (
                        <MonthYearSelector
                            currentMonth={currentMonthNum}
                            currentYear={currentYearNum}
                            onMonthYearChange={onMonthYearChange}
                        />
                    )}

                    <Button
                        onClick={onToday}
                        variant="outline"
                        className="px-3 ml-2 rounded-md border border-black/15 bg-transparent font-montserrat font-semibold cursor-pointer"
                    >
                        TODAY
                    </Button>
                </div>
            </div>

            {/* Bottom row: Month navigation */}
            <div className="flex items-center justify-between px-2 py-1">
                <Button
                    onClick={onPrevMonth}
                    variant="ghost"
                    size="icon"
                    aria-label="Previous month"
                    className="cursor-pointer"
                >
                    <ChevronLeft className="h-10! w-10!" />
                </Button>

                <span className="text-sm font-medium text-foreground">
                    {monthName} – {year}
                </span>

                <Button
                    onClick={onNextMonth}
                    variant="ghost"
                    size="icon"
                    aria-label="Next month"
                    className="cursor-pointer"
                >
                    <ChevronRight className="h-10! w-10!" />
                </Button>
            </div>
        </div>
    );
}

