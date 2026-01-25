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
        <div className="py-1 px-2 mb-6 rounded flex items-center justify-between bg-muted border-t-2 border-black/5 h-auto">
            <p className="text-base font-normal text-text-primary">
                Availability For {currentMonth}
            </p>

            <div className="h-full flex items-center gap-2">
                <Button
                    onClick={onPrevMonth}
                    variant="ghost"
                    size="icon"
                    aria-label="Previous month"
                    className="cursor-pointer"
                >
                    <ChevronLeft className="h-5 w-5" />
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
                    className='cursor-pointer'
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>

                <Button onClick={onToday} variant="outline" size="sm" className="h-full px-2.5 py-3 rounded-md border border-black/15 bg-transparent font-montserrat font-semibold cursor-pointer">
                    TODAY
                </Button>
            </div>
        </div>
    );
}