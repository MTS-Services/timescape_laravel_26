import { router } from '@inertiajs/react';
import { Calendar, ClipboardList, CalendarOff, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Statistics {
    total_duty_days: number;
    leave_taken: number;
    upcoming_leave: number;
    filter_type: string;
    date_range: {
        start: string;
        end: string;
    };
}

interface MobileStatisticsPanelProps {
    statistics: Statistics;
    selectedUserId: number;
    currentYear: number;
    currentMonth: number;
}

export function MobileStatisticsPanel({
    statistics,
    selectedUserId,
    currentYear,
    currentMonth,
}: MobileStatisticsPanelProps) {
    const [filterType, setFilterType] = useState<string>(statistics.filter_type || 'month');
    const [startDate, setStartDate] = useState<string>(statistics.date_range?.start || '');
    const [endDate, setEndDate] = useState<string>(statistics.date_range?.end || '');
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

    const handleFilterChange = (newFilter: string) => {
        setFilterType(newFilter);

        if (newFilter !== 'custom') {
            router.get(
                '/availability',
                {
                    user_id: selectedUserId,
                    year: currentYear,
                    month: currentMonth,
                    filter_type: newFilter,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['statistics'],
                }
            );
        }
    };

    const handleApplyCustomRange = () => {
        if (startDate && endDate) {
            router.get(
                '/availability',
                {
                    user_id: selectedUserId,
                    year: currentYear,
                    month: currentMonth,
                    filter_type: 'custom',
                    start_date: startDate,
                    end_date: endDate,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['statistics'],
                }
            );
        }
    };

    return (
        <div className="mt-6 rounded-lg border bg-card shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-4">Staff Duty History</h3>

            {/* Calendar Filter - Collapsible dropdown matching design */}
            <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="mb-4">
                <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center justify-between w-full px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <span className="font-semibold text-foreground">Calendar Filter</span>
                            <ChevronDown
                                className={cn(
                                    'h-5 w-5 text-muted-foreground transition-transform duration-200',
                                    isFilterOpen && 'rotate-180'
                                )}
                            />
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3">
                            {/* Current Month Button */}
                            <button
                                type="button"
                                onClick={() => handleFilterChange('month')}
                                className={cn(
                                    'w-full px-4 py-2.5 text-sm font-medium rounded-md border transition-colors cursor-pointer text-left',
                                    filterType === 'month'
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-background border-input hover:bg-muted/50'
                                )}
                            >
                                Current Month
                            </button>

                            {/* Current Year Button */}
                            <button
                                type="button"
                                onClick={() => handleFilterChange('year')}
                                className={cn(
                                    'w-full px-4 py-2.5 text-sm font-medium rounded-md border transition-colors cursor-pointer text-left',
                                    filterType === 'year'
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-background border-input hover:bg-muted/50'
                                )}
                            >
                                Current Year
                            </button>

                            {/* Custom Date Range - inline inputs */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                        Start Date:
                                    </span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 pt-5 pb-2 text-sm"
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                        End Date:
                                    </span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 pt-5 pb-2 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Submit Button for custom range */}
                            <Button
                                onClick={handleApplyCustomRange}
                                disabled={!startDate || !endDate}
                                size="sm"
                                className="w-full cursor-pointer"
                            >
                                Submit
                            </Button>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>

            {/* Stats cards - vertical on mobile */}
            <div className="space-y-3">
                {/* Total Duty Days */}
                <div className="rounded-lg border bg-background p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-sm text-muted-foreground font-medium">
                                Total Duty Days
                            </h4>
                            <p className="text-2xl font-bold text-primary">
                                {statistics.total_duty_days}
                            </p>
                        </div>
                        <ClipboardList className="text-primary h-6 w-6" />
                    </div>
                </div>

                {/* Leave Taken */}
                <div className="rounded-lg border bg-background p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-sm text-muted-foreground font-medium">
                                Leave Taken
                            </h4>
                            <p className="text-2xl font-bold text-destructive">
                                {statistics.leave_taken}
                            </p>
                        </div>
                        <CalendarOff className="text-destructive h-6 w-6" />
                    </div>
                </div>

                {/* Upcoming Leave */}
                <div className="rounded-lg border bg-background p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-sm text-muted-foreground font-medium">
                                Upcoming Leave
                            </h4>
                            <p className="text-2xl font-bold text-amber-500">
                                {statistics.upcoming_leave}
                            </p>
                        </div>
                        <Calendar className="text-amber-500 h-6 w-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}
