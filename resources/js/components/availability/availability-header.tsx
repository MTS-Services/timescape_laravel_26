import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { MonthYearSelector } from './month-year-selector';

interface AvailabilityHeaderProps {
    currentMonth: string;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    onMonthYearChange?: (month: number, year: number) => void;
    currentMonthNum?: number;
    currentYearNum?: number;
}

export function AvailabilityHeader({
    currentMonth,
    onPrevMonth,
    onNextMonth,
    onToday,
    onMonthYearChange,
    currentMonthNum,
    currentYearNum,
}: AvailabilityHeaderProps) {
    return (
        <div className="py-2 px-2 sm:px-3 lg:px-4 mb-4 sm:mb-5 lg:mb-6 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted border-t-2 border-black/5 gap-3 sm:gap-0">
            <p className="text-sm sm:text-base font-normal text-text-primary">
                Availability For {currentMonth}
            </p>

            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <Button
                    onClick={onPrevMonth}
                    variant="ghost"
                    size="icon"
                    aria-label="Previous month"
                    className="cursor-pointer h-9 w-9 sm:h-10 sm:w-10"
                >
                    <ChevronLeft className="h-4 w-4 sm:h-8! sm:w-8!" />
                </Button>

                {/* Month/Year selector */}
                {onMonthYearChange && currentMonthNum && currentYearNum && (
                    <MonthYearSelector
                        currentMonth={currentMonthNum}
                        currentYear={currentYearNum}
                        onMonthYearChange={onMonthYearChange}
                    />
                )}

                <Button
                    onClick={onNextMonth}
                    variant="ghost"
                    size="icon"
                    aria-label="Next month"
                    className='cursor-pointer h-9 w-9 sm:h-10 sm:w-10'
                >
                    <ChevronRight className="h-4 w-4 sm:h-8! sm:w-8!" />
                </Button>

                <Button onClick={onToday} variant="outline" className="px-2 sm:px-2.5 py-2 sm:py-3 rounded-md border border-black/15 bg-transparent font-montserrat font-semibold cursor-pointer text-xs sm:text-sm">
                    TODAY
                </Button>
            </div>
        </div>
    );
}