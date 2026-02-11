import { ChevronLeft, ChevronRight, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { MonthYearSelector } from './month-year-selector';
import { useResponsiveMode } from '@/hooks/use-responsive-mode';

interface MobileAvailabilityHeaderProps {
    currentMonth: string;
    onToday: () => void;
    onMonthYearChange?: (month: number, year: number) => void;
    currentMonthNum?: number;
    currentYearNum?: number;
    showStaffButton?: boolean;
    onStaffListClick?: () => void;
    selectedUserName?: string;
}

export function MobileAvailabilityHeader({
    currentMonth,
    onToday,
    onMonthYearChange,
    currentMonthNum,
    currentYearNum,
    showStaffButton = false,
    onStaffListClick,
    selectedUserName = 'Staff List',
}: MobileAvailabilityHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-2">
            {showStaffButton ? (
                <Button
                    variant="outline"
                    onClick={onStaffListClick}
                    size="sm"
                    className="flex items-center gap-2 cursor-pointer w-full max-w-40 md:max-w-64 py"
                >
                    <Users className="h-4 w-4" />
                    <span className='truncate text-sm'>{selectedUserName}</span>
                </Button>
            ) : (
                <div className="px-4 py-2 rounded-md border border-input bg-background text-xs font-medium">
                    Availability For {currentMonth}
                </div>
            )}

            <div className="flex items-center gap-2">
                {onMonthYearChange && currentMonthNum && currentYearNum && (
                    <MonthYearSelector
                        currentMonth={currentMonthNum}
                        currentYear={currentYearNum}
                        onMonthYearChange={onMonthYearChange}
                        isMobile={true}
                    />
                )}

                <Button
                    onClick={onToday}
                    variant="outline"
                    size='sm'
                    className="px-3 ml-2 rounded-md border border-black/15 bg-transparent font-montserrat font-semibold cursor-pointer text-xs"
                >
                    TODAY
                </Button>
            </div>
        </div>
    );
}

