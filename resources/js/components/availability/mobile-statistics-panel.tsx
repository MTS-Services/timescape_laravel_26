import { router } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatDateKey, formatMonthYear } from '@/lib/date-helpers';
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
    selectedUserName?: string;
}

export function MobileStatisticsPanel({
    statistics,
    selectedUserId,
    currentYear,
    currentMonth,
    selectedUserName
}: MobileStatisticsPanelProps) {
    const [filterType, setFilterType] = useState<string>(statistics.filter_type || 'month');
    const [startDate, setStartDate] = useState<string>(statistics.date_range?.start || '');
    const [endDate, setEndDate] = useState<string>(statistics.date_range?.end || '');
    const filterOpenRef = useRef(false);

    // Sync local state when statistics prop changes from server
    // This is a valid pattern for controlled components that need local state
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        setFilterType(statistics.filter_type || 'month');
        setStartDate(statistics.date_range?.start || '');
        setEndDate(statistics.date_range?.end || '');
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [statistics]);

    const displayMonthYear = useMemo(() => {
        const currentDate = new Date(currentYear, currentMonth - 1, 1);
        return formatMonthYear(currentDate);
    }, [currentYear, currentMonth]);
    const showMonthYearLabel = filterType === 'month';

    const presetRanges = useMemo(() => {
        const monthStart = new Date(currentYear, currentMonth - 1, 1);
        const monthEnd = new Date(currentYear, currentMonth, 0);
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31);

        return {
            month: {
                start: formatDateKey(monthStart),
                end: formatDateKey(monthEnd),
            },
            year: {
                start: formatDateKey(yearStart),
                end: formatDateKey(yearEnd),
            },
        } as const;
    }, [currentYear, currentMonth]);

    const applyPresetRange = (newFilter: 'month' | 'year') => {
        const range = presetRanges[newFilter];
        setStartDate(range.start);
        setEndDate(range.end);
    };

    const handleFilterChange = (newFilter: string) => {
        setFilterType(newFilter);

        if (newFilter === 'month' || newFilter === 'year') {
            applyPresetRange(newFilter);
        }

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
            setFilterType('custom');
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
        <div className="mt-6">
            <div className="space-y-2 mb-12">
                <h3 className="text-2xl md:text-[32px] font-montserrat font-semibold">Staff Duty History</h3>
                <p>
                    {selectedUserName ? selectedUserName : 'Selected user'}
                    {showMonthYearLabel && ` - ${displayMonthYear}`}
                </p>
            </div>

            {/* Calendar Filter - Collapsible dropdown matching design */}
            <Collapsible
                onOpenChange={(nextOpen) => {
                    filterOpenRef.current = nextOpen;
                }}
            >
                <div className="rounded-md border border-border bg-[#E9F0FC] overflow-hidden">
                    <CollapsibleTrigger asChild>
                        <Button
                            type="button"
                            className="flex items-center justify-between w-full px-4 py-3 cursor-pointer bg-transparent hover:bg-transparent transition-colors group border-none shadow-none"
                        >
                            <span className="font-semibold text-foreground">Calendar Filter</span>
                            <div className="flex items-center justify-center bg-white h-10 w-10 rounded-md">
                                <ChevronDown
                                    className=
                                    'h-10 w-10 text-text-primary transition-transform duration-200 group-data-[state=open]:rotate-180'
                                />
                            </div>
                        </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-2">
                        <div className="p-4 space-y-2">
                            {/* Current Month Button */}
                            <button
                                type="button"
                                onClick={() => handleFilterChange('month')}
                                className={cn(
                                    'w-full px-4 py-2 text-sm font-medium rounded-md border transition-colors cursor-pointer text-left',
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
                                    'w-full px-4 py-2 text-sm font-medium rounded-md border transition-colors cursor-pointer text-left',
                                    filterType === 'year'
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-background border-input hover:bg-muted/50'
                                )}
                            >
                                Current Year
                            </button>

                            {/* Custom Date Range - inline inputs */}
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    placeholder="Start Date"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />

                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    placeholder="End Date"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
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
            <div className="space-y-3 mt-4 flex flex-col lg:flex-row gap-4">
                {/* Total Duty Days */}
                <div className="flex-1 rounded-3xl border border-[#e6e6e6] bg-[#F8FCFC] p-4 py-5">
                    <div className="flex justify-between items-center space-y-2">
                        <div className='space-y-2'>
                            <h4 className="text-muted-foreground text-base md:text-2xl font-semibold ">Total Duty Days</h4>
                            <p className="text-2xl lg:text-4xl font-bold text-[#0A6F66]">{statistics.total_duty_days}</p>
                        </div>
                        <div className='flex items-center justify-center bg-[#DBEFED] w-18 h-18 rounded-2xl p-2'>
                            <svg width="40" height="38" viewBox="0 0 40 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 38C2.9 38 1.95867 37.6087 1.176 36.826C0.393333 36.0433 0.00133333 35.1013 0 34V12C0 10.9 0.392 9.95867 1.176 9.176C1.96 8.39333 2.90133 8.00133 4 8H12V4C12 2.9 12.392 1.95867 13.176 1.176C13.96 0.393333 14.9013 0.00133333 16 0H24C25.1 0 26.042 0.392 26.826 1.176C27.61 1.96 28.0013 2.90133 28 4V8H36C37.1 8 38.042 8.392 38.826 9.176C39.61 9.96 40.0013 10.9013 40 12V34C40 35.1 39.6087 36.042 38.826 36.826C38.0433 37.61 37.1013 38.0013 36 38H4ZM4 34H36V12H4V34ZM16 8H24V4H16V8Z" fill="#0A6F66" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Leave Taken */}
                <div className="flex-1 rounded-3xl border border-[#e6e6e6] bg-[#FFF7F5] p-4 py-5">
                    <div className="flex justify-between items-center space-y-2">
                        <div className='space-y-2'>
                            <h4 className="text-muted-foreground text-base md:text-2xl font-semibold ">Leave Taken</h4>
                            <p className="text-2xl lg:text-4xl font-bold text-[#9C1D2A]">{statistics.leave_taken}</p>
                        </div>
                        <div className='flex items-center justify-center bg-[#F8DFE1] w-18 h-18 rounded-2xl p-2'>
                            <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 32V12L12 0L24 12V32H0ZM4 28H10V22H14V28H20V13.65L12 5.65L4 13.65V28ZM10 18V14H14V18H10ZM28 32V10.35L17.65 0H23.3L32 8.7V32H28ZM36 32V7.05L28.95 0H34.6L40 5.4V32H36Z" fill="#9C1D2A" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Upcoming Leave */}
                <div className="flex-1 rounded-3xl border border-[#e6e6e6] bg-[#FFFFF5] p-4 py-5">
                    <div className="flex justify-between items-center space-y-2">
                        <div className='space-y-2'>
                            <h4 className="text-muted-foreground text-base md:text-2xl font-semibold ">Upcoming Leave</h4>
                            <p className="text-2xl lg:text-4xl font-bold text-[#5D7E00]">{statistics.upcoming_leave}</p>
                        </div>
                        <div className='flex items-center justify-center bg-[#FFFB8F] w-18 h-18 rounded-2xl p-2'>
                            <svg width="40" height="44" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M28 40V36H36V16H8V24H4V8C4 6.9 4.392 5.95867 5.176 5.176C5.96 4.39333 6.90133 4.00133 8 4H10V0H14V4H30V0H34V4H36C37.1 4 38.042 4.392 38.826 5.176C39.61 5.96 40.0013 6.90133 40 8V36C40 37.1 39.6087 38.042 38.826 38.826C38.0433 39.61 37.1013 40.0013 36 40H28ZM14 44L11.2 41.2L16.35 36H0V32H16.35L11.2 26.8L14 24L24 34L14 44Z" fill="#3D3B00" />
                            </svg>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
