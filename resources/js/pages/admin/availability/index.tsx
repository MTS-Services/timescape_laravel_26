import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { generateCalendarDays, formatMonthYear, addMonths } from '@/lib/date-helpers';
import { AvailabilityHeader } from '@/components/availability/availability-header';
import { CalendarGrid } from '@/components/availability/calendar-grid';
import { RequirementsBanner } from '@/components/availability/requirements-banner';
import { UserSelectionPanel } from '@/components/admin/user-selection-panel';
import axios from 'axios';
import type {
    AvailabilitySelections,
    User
} from '@/types/availability';
import AdminLayout from '@/layouts/admin-layout';

// Import the statistics panel component at the top of the file
import { StatisticsPanel } from '@/components/admin/statistics-panel';

interface AdminAvailabilityPageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            is_admin: boolean;
        }
    };
    flash: { success?: string; error?: string };
    initialSelections: AvailabilitySelections;
    requirements: any;
    currentYear?: number;
    currentMonth?: number;
    [key: string]: any;
}

export default function AvailabilityScheduler() {
    const { auth, initialSelections, requirements, currentYear, currentMonth, flash } =
        usePage<AdminAvailabilityPageProps>().props;

    const [currentDate, setCurrentDate] = useState(() => {
        if (currentYear && currentMonth) {
            return new Date(currentYear, currentMonth - 1, 1);
        }
        return new Date();
    });

    const [selections, setSelections] = useState<AvailabilitySelections>(
        initialSelections || {}
    );

    // New state for user selection panel
    const [selectedUserId, setSelectedUserId] = useState<number | undefined>(auth.user.id);
    const [selectedUserName, setSelectedUserName] = useState<string>(auth.user.name);
    const [statistics, setStatistics] = useState<any>({
        total_duty_days: 0,
        leave_taken: 0,
        upcoming_leave: 0,
        filter_type: 'month',
        date_range: {
            start: '',
            end: ''
        }
    });
    const [calendarDays, setCalendarDays] = useState<Date[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const days = generateCalendarDays(currentDate);
        setCalendarDays(days);
    }, [currentDate]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

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

    // Fetch month data for current user (or selected user if admin)
    const fetchMonthData = async (date: Date, userId?: number) => {
        const targetUserId = userId || selectedUserId || auth.user.id;

        if (auth.user.is_admin && targetUserId !== auth.user.id) {
            // If admin is viewing another user's data
            try {
                const response = await axios.get(`/admin/users/${targetUserId}/availability`, {
                    params: {
                        year: date.getFullYear(),
                        month: date.getMonth() + 1,
                    }
                });

                setSelections(response.data.availabilities || {});
                setStatistics(response.data.statistics || {
                    total_duty_days: 0,
                    leave_taken: 0,
                    upcoming_leave: 0,
                    filter_type: 'month',
                    date_range: {
                        start: '',
                        end: ''
                    }
                });
                setSelectedUserName(response.data.userName);

                toast.success(`Loaded availability for ${response.data.userName}`);
            } catch (error) {
                console.error('Error fetching user data:', error);
                toast.error('Failed to load user availability data');
            }
        } else {
            // Admin viewing own data or non-admin user
            router.get(
                '/availability/month',
                {
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['initialSelections', 'requirements'],
                    onSuccess: (page: any) => {
                        setSelections(page.props.availabilities || {});
                    },
                }
            );
        }
    };

    // Handle user selection from the panel
    const handleUserSelect = (userId: number) => {
        if (userId === selectedUserId) return;

        setSelectedUserId(userId);
        fetchMonthData(currentDate, userId);
    };

    // Handle statistics filter change
    const handleStatisticsFilterChange = async (filterType: string, startDate?: string, endDate?: string) => {
        if (!selectedUserId) return;

        try {
            const params: any = {
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1,
                filter_type: filterType,
            };

            if (filterType === 'custom' && startDate && endDate) {
                params.start_date = startDate;
                params.end_date = endDate;
            }

            const response = await axios.get(`/admin/users/${selectedUserId}/statistics`, { params });
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            toast.error('Failed to update statistics');
        }
    };

    const handleSelectionChange = (dateKey: string, optionId: string | null) => {
        // Update local state
        setSelections((prev) => ({
            ...prev,
            [dateKey]: optionId,
        }));

        // Save immediately to server
        setIsSaving(true);
        router.post(
            '/availability',
            {
                selections: { [dateKey]: optionId },
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1,
                single_update: true, // Flag to indicate a single update
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                },
                onError: () => {
                    setIsSaving(false);
                    toast.error('Failed to save your change');
                },
            }
        );
    };

    const handleSave = () => {
        setIsSaving(true);
        router.post(
            '/availability',
            {
                selections,
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                },
                onError: () => {
                    setIsSaving(false);
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

    // Handle month/year selection
    const handleMonthYearChange = (month: number, year: number) => {
        const newDate = new Date(year, month - 1, 1);
        setCurrentDate(newDate);
        fetchMonthData(newDate);
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
                        <div className="md:col-span-3">
                            <CalendarGrid
                                calendarDays={calendarDays}
                                currentMonth={currentDate}
                                selections={selections}
                                onSelectionChange={handleSelectionChange}
                            />
                        </div>

                        {/* User Selection Panel (admin only) */}
                        <div className="md:col-span-1">
                            {auth.user.is_admin && (
                                <UserSelectionPanel
                                    onUserSelect={handleUserSelect}
                                    selectedUserId={selectedUserId}
                                />
                            )}
                        </div>
                    </div>

                    {/* Statistics Panel (admin only) */}
                    {auth.user.is_admin && statistics && (
                        <StatisticsPanel
                            statistics={statistics}
                            onFilterChange={handleStatisticsFilterChange}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}