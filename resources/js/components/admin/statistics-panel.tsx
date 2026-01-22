import { Calendar, ClipboardList, CalendarOff } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleDateInput } from '@/components/ui/simple-date-input';

interface StatisticsPanelProps {
    statistics: {
        total_duty_days: number;
        leave_taken: number;
        upcoming_leave: number;
        filter_type: string;
        date_range: {
            start: string;
            end: string;
        };
    };
    onFilterChange: (filterType: string, startDate?: string, endDate?: string) => void;
}

export function StatisticsPanel({ statistics, onFilterChange }: StatisticsPanelProps) {
    const [filterType, setFilterType] = useState<string>(statistics.filter_type || 'month');
    const [startDate, setStartDate] = useState<Date | undefined>(
        statistics.date_range?.start ? new Date(statistics.date_range.start) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        statistics.date_range?.end ? new Date(statistics.date_range.end) : undefined
    );
    const [isCustomRange, setIsCustomRange] = useState<boolean>(filterType === 'custom');

    const handleFilterChange = (newFilter: string) => {
        setFilterType(newFilter);
        setIsCustomRange(newFilter === 'custom');

        if (newFilter !== 'custom') {
            onFilterChange(newFilter);
        }
    };

    const handleApplyCustomRange = () => {
        if (startDate && endDate) {
            const formattedStart = startDate.toISOString().split('T')[0];
            const formattedEnd = endDate.toISOString().split('T')[0];
            onFilterChange('custom', formattedStart, formattedEnd);
        }
    };

    return (
        <div className="mt-8 rounded-lg border bg-card shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-4">Staff Duty History</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-3">
                    <div className="grid grid-cols-3 gap-4">
                        {/* Total Duty Days */}
                        <div className="rounded-lg border bg-background p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-muted-foreground font-medium">Total Duty Days</h4>
                                    <p className="text-3xl font-bold text-primary">{statistics.total_duty_days}</p>
                                </div>
                                <ClipboardList className="text-primary h-6 w-6" />
                            </div>
                        </div>

                        {/* Leave Taken */}
                        <div className="rounded-lg border bg-background p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-muted-foreground font-medium">Leave Taken</h4>
                                    <p className="text-3xl font-bold text-destructive">{statistics.leave_taken}</p>
                                </div>
                                <CalendarOff className="text-destructive h-6 w-6" />
                            </div>
                        </div>

                        {/* Upcoming Leave */}
                        <div className="rounded-lg border bg-background p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-muted-foreground font-medium">Upcoming Leave</h4>
                                    <p className="text-3xl font-bold text-amber-500">{statistics.upcoming_leave}</p>
                                </div>
                                <Calendar className="text-amber-500 h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-1">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Filter Options</h4>

                        <Select value={filterType} onValueChange={handleFilterChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="month">Current Month</SelectItem>
                                <SelectItem value="year">Current Year</SelectItem>
                                <SelectItem value="custom">Custom Date Range</SelectItem>
                            </SelectContent>
                        </Select>

                        {isCustomRange && (
                            <div className="space-y-2">
                                <div className="grid gap-2">
                                    <label className="text-xs">Start Date</label>
                                    <SimpleDateInput
                                        date={startDate}
                                        setDate={setStartDate}
                                        placeholder="Select start date"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs">End Date</label>
                                    <SimpleDateInput
                                        date={endDate}
                                        setDate={setEndDate}
                                        placeholder="Select end date"
                                    />
                                </div>
                                <Button
                                    onClick={handleApplyCustomRange}
                                    disabled={!startDate || !endDate}
                                    size="sm"
                                    className="w-full"
                                >
                                    Apply Range
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
