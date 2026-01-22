import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { AvailabilityHeader } from '@/components/availability/availability-header';
import { CalendarGrid } from '@/components/availability/calendar-grid';
import { RequirementsBanner } from '@/components/availability/requirements-banner';
import { StatisticsPanel } from '@/components/availability/statistics-panel';
import { UserSelectionPanel } from '@/components/availability/user-selection-panel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AdminLayout from '@/layouts/admin-layout';
import { generateCalendarDays, formatMonthYear, addMonths } from '@/lib/date-helpers';
import type { User } from '@/types';
import type {
    AvailabilitySelections,
    AvailabilityRequirements,
} from '@/types/availability';

interface PageProps {
    auth: {
        user: User;
    };
    initialSelections: AvailabilitySelections;
    requirements: AvailabilityRequirements;
    currentYear?: number;
    currentMonth?: number;
    flash?: {
        success?: string;
        error?: string;
    };
    // Admin-specific properties
    users?: User[];
    statistics?: {
        total_duty_days: number;
        leave_taken: number;
        upcoming_leave: number;
        filter_type: string;
        date_range: {
            start: string;
            end: string;
        };
    };
    selectedUserId?: number;
    [key: string]: unknown;
}

export default function AvailabilityScheduler() {
    const { auth, initialSelections, requirements, currentYear, currentMonth, flash, users, statistics, selectedUserId } =
        usePage<PageProps>().props;

    const [currentDate, setCurrentDate] = useState(() => {
        if (currentYear && currentMonth) {
            return new Date(currentYear, currentMonth - 1, 1);
        }
        return new Date();
    });

    const [selections, setSelections] = useState<AvailabilitySelections>({});

    // Use useMemo for derived state instead of useEffect
    const calendarDays = useMemo(() => {
        const days = generateCalendarDays(currentDate);
        console.log('Generated calendar days:', days);
        return days;
    }, [currentDate]);

    // Initialize selections from props once on mount
    useEffect(() => {
        if (initialSelections && Object.keys(selections).length === 0) {
            console.log('Initializing selections from props:', initialSelections);
            setSelections(initialSelections);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Show success/error messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const fetchMonthData = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        console.log('Fetching month data:', { year, month });

        // Use the main availability.index route with query parameters
        router.get(
            route('availability.index'),
            {
                year,
                month,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['initialSelections', 'requirements', 'currentYear', 'currentMonth'],
                onSuccess: () => {
                    console.log('Month data fetched successfully');
                },
                onError: (errors) => {
                    console.error('Failed to fetch month data:', errors);
                    toast.error('Failed to load calendar data');
                },
            }
        );
    };

    const handlePrevMonth = () => {
        const newDate = addMonths(currentDate, -1);
        setCurrentDate(newDate);
        fetchMonthData(newDate);
    };

    const handleNextMonth = () => {
        const newDate = addMonths(currentDate, 1);
        setCurrentDate(newDate);
        fetchMonthData(newDate);
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        fetchMonthData(today);
    };

    // Handler for month/year selector
    const handleMonthYearChange = (month: number, year: number) => {
        const newDate = new Date(year, month - 1, 1);
        setCurrentDate(newDate);
        fetchMonthData(newDate);
    };

    const handleSelectionChange = (dateKey: string, optionId: string | null) => {
        console.log('Selection changed:', { dateKey, optionId });

        // Update local state
        setSelections((prev) => ({
            ...prev,
            [dateKey]: optionId,
        }));

        // Save immediately to server
        router.post(
            route('availability.store'),
            {
                selections: { [dateKey]: optionId },
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1,
                single_update: true, // Flag to indicate a single update
            },
            {
                preserveState: true,
                preserveScroll: true,
                onError: (errors) => {
                    console.error('Save failed:', errors);
                    toast.error('Failed to save your change');
                },
            }
        );
    };


    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <AdminLayout>
            <Head title="Availability Scheduler" />

            <div className="min-h-screen bg-background py-8">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-destructive px-4 py-2 text-xl font-bold text-destructive-foreground">
                                TIMESCAPE
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    Availability Scheduler
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Calendar Dashboard
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-foreground">
                                    {auth.user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">Staff</p>
                            </div>
                            <Avatar>
                                <AvatarFallback>
                                    {getUserInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    {/* Requirements Banner */}
                    {requirements && (
                        <RequirementsBanner requirements={requirements} />
                    )}

                    {/* Calendar */}
                    <AvailabilityHeader
                        currentMonth={formatMonthYear(currentDate)}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                        onToday={handleToday}
                        onMonthYearChange={handleMonthYearChange}
                        currentMonthNum={currentDate.getMonth() + 1}
                        currentYearNum={currentDate.getFullYear()}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Calendar Grid */}
                        <div className={`md:col-span-${auth.user.is_admin ? '3' : '4'}`}>
                            <CalendarGrid
                                calendarDays={calendarDays}
                                currentMonth={currentDate}
                                selections={selections}
                                onSelectionChange={handleSelectionChange}
                            />
                        </div>

                        {/* Admin User Selection Panel */}
                        {auth.user.is_admin && users && (
                            <div className="md:col-span-1">
                                <UserSelectionPanel
                                    users={users}
                                    selectedUserId={selectedUserId}
                                    currentYear={currentDate.getFullYear()}
                                    currentMonth={currentDate.getMonth() + 1}
                                />
                            </div>
                        )}
                    </div>

                    {/* Admin Statistics Panel */}
                    {auth.user.is_admin && statistics && selectedUserId && (
                        <StatisticsPanel
                            statistics={statistics}
                            selectedUserId={selectedUserId}
                            currentYear={currentDate.getFullYear()}
                            currentMonth={currentDate.getMonth() + 1}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}