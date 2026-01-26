import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

import { AvailabilityHeader } from '@/components/availability/availability-header';
import { CalendarGrid } from '@/components/availability/calendar-grid';
import { MobileAvailabilityCard } from '@/components/availability/mobile-availability-card';
import { MobileAvailabilityHeader } from '@/components/availability/mobile-availability-header';
import { MobileCalendarGrid } from '@/components/availability/mobile-calendar-grid';
import { MobileStatisticsPanel } from '@/components/availability/mobile-statistics-panel';
import { PastDateModal } from '@/components/availability/past-date-modal';
import { StaffListModal } from '@/components/availability/staff-list-modal';
import { StatisticsPanel } from '@/components/availability/statistics-panel';
import { UserSelectionPanel } from '@/components/availability/user-selection-panel';
import SchedulerHeader from '@/components/scheduler-header';
import { useIsMobile } from '@/hooks/use-mobile';
import AdminLayout from '@/layouts/admin-layout';
import { generateCalendarDays, formatMonthYear, addMonths, isDateInPast, formatDateKey, isDateDisabled, isSameMonth } from '@/lib/date-helpers';
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
    const { auth, initialSelections, currentYear, currentMonth, flash, users, statistics, selectedUserId } =
        usePage<PageProps>().props;

    const [currentDate, setCurrentDate] = useState(() => {
        if (currentYear && currentMonth) {
            return new Date(currentYear, currentMonth - 1, 1);
        }
        return new Date();
    });

    const [selections, setSelections] = useState<AvailabilitySelections>({});
    const isMobile = useIsMobile();

    // Mobile-specific state
    const [selectedMobileDate, setSelectedMobileDate] = useState<string | null>(null);
    const [isPastDateModalOpen, setIsPastDateModalOpen] = useState(false);
    const [pastDateForModal, setPastDateForModal] = useState<string | null>(null);
    const [isStaffListModalOpen, setIsStaffListModalOpen] = useState(false);

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

    // Update selections when selectedUserId changes (admin switches users)
    useEffect(() => {
        if (initialSelections) {
            console.log('User changed, updating selections:', { selectedUserId, initialSelections });
            setSelections(initialSelections);
        }
    }, [selectedUserId, initialSelections]);

    // Show success/error messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const fetchMonthData = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        console.log('Fetching month data:', { year, month, selectedUserId });

        router.get(
            route('availability.index'),
            {
                year,
                month,
                user_id: selectedUserId,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['initialSelections', 'requirements', 'currentYear', 'currentMonth', 'users', 'statistics', 'selectedUserId'],
                onSuccess: () => {
                    console.log('Month data fetched successfully');
                },
                onError: (errors) => {
                    console.error('Failed to fetch month data:', errors);
                    toast.error('Failed to load calendar data');
                },
            }
        );
    }, [selectedUserId]);

    const handlePrevMonth = useCallback(() => {
        const newDate = addMonths(currentDate, -1);
        setCurrentDate(newDate);
        fetchMonthData(newDate);
    }, [currentDate, fetchMonthData]);

    const handleNextMonth = useCallback(() => {
        const newDate = addMonths(currentDate, 1);
        setCurrentDate(newDate);
        fetchMonthData(newDate);
    }, [currentDate, fetchMonthData]);

    const handleToday = useCallback(() => {
        const today = new Date();
        setCurrentDate(today);
        fetchMonthData(today);
    }, [fetchMonthData]);

    const handleMonthYearChange = useCallback((month: number, year: number) => {
        const newDate = new Date(year, month - 1, 1);
        setCurrentDate(newDate);
        fetchMonthData(newDate);
    }, [fetchMonthData]);

    const handleSelectionChange = useCallback((dateKey: string, optionId: string | null) => {
        console.log('Selection changed:', { dateKey, optionId, selectedUserId });

        setSelections((prev) => ({
            ...prev,
            [dateKey]: optionId,
        }));

        router.post(
            route('availability.store'),
            {
                selections: { [dateKey]: optionId },
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1,
                user_id: selectedUserId,
                single_update: true,
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
    }, [currentDate, selectedUserId]);

    const handleMobileDateSelect = useCallback((dateKey: string) => {
        const dateObj = calendarDays.find((d) => formatDateKey(d) === dateKey);
        if (!dateObj) return;

        const isPast = isDateInPast(dateObj);
        const isInCurrentMonth = isSameMonth(dateObj, currentDate);

        if (!isInCurrentMonth) return;

        if (isPast) {
            setPastDateForModal(dateKey);
            setIsPastDateModalOpen(true);
            setSelectedMobileDate(null);
        } else {
            setSelectedMobileDate((prev) => (prev === dateKey ? null : dateKey));
            setPastDateForModal(null);
            setIsPastDateModalOpen(false);
        }
    }, [calendarDays, currentDate]);

    const handleOpenStaffListModal = useCallback(() => {
        setIsStaffListModalOpen(true);
    }, []);

    const handleCloseStaffListModal = useCallback(() => {
        setIsStaffListModalOpen(false);
    }, []);

    const handleClosePastDateModal = useCallback(() => {
        setIsPastDateModalOpen(false);
        setPastDateForModal(null);
    }, []);

    // Get dates to show as expanded cards on mobile (today + future dates in current month)
    const mobileExpandedDates = useMemo(() => {
        if (!isMobile) return [];

        return calendarDays
            .filter((date) => {
                const isPast = isDateInPast(date);
                const isDisabled = isDateDisabled(date, currentDate);
                // Show today and future dates that are in the current month
                return !isPast && !isDisabled;
            })
            .map((date) => formatDateKey(date));
    }, [calendarDays, currentDate, isMobile]);
    return (
        <AdminLayout>
            <Head title="Availability Scheduler" />
            <SchedulerHeader />

            <div className="container mx-auto px-4 mt-0.5">
                {/* Mobile Layout */}
                {isMobile ? (
                    <>
                        {/* Mobile Header */}
                        <MobileAvailabilityHeader
                            currentMonth={formatMonthYear(currentDate)}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                            onToday={handleToday}
                            onMonthYearChange={handleMonthYearChange}
                            currentMonthNum={currentDate.getMonth() + 1}
                            currentYearNum={currentDate.getFullYear()}
                            showStaffButton={auth.user.can_manage_users && !!users}
                            onStaffListClick={handleOpenStaffListModal}
                        />

                        {/* Mobile Calendar Grid */}
                        <div className="rounded-lg border bg-card p-3 mb-4">
                            <MobileCalendarGrid
                                calendarDays={calendarDays}
                                currentMonth={currentDate}
                                selections={selections}
                                selectedDate={selectedMobileDate}
                                onDateSelect={handleMobileDateSelect}
                            />
                        </div>

                        {/* Mobile Expanded Availability Cards */}
                        <div className="space-y-3">
                            {mobileExpandedDates.map((dateKey) => {
                                const dateObj = calendarDays.find(
                                    (d) => formatDateKey(d) === dateKey
                                );
                                const isDisabled = dateObj
                                    ? isDateDisabled(dateObj, currentDate)
                                    : true;

                                return (
                                    <MobileAvailabilityCard
                                        key={dateKey}
                                        dateKey={dateKey}
                                        selectedOption={selections[dateKey] || null}
                                        isDisabled={isDisabled}
                                        onOptionChange={handleSelectionChange}
                                        allowCollapse={true}
                                    />
                                );
                            })}
                        </div>

                        {/* Past Date Modal */}
                        <PastDateModal
                            isOpen={isPastDateModalOpen}
                            onClose={handleClosePastDateModal}
                            dateKey={pastDateForModal}
                            selectedOption={
                                pastDateForModal ? selections[pastDateForModal] || null : null
                            }
                        />

                        {/* Staff List Modal (Admin Only) */}
                        {auth.user.can_manage_users && users && (
                            <StaffListModal
                                isOpen={isStaffListModalOpen}
                                onClose={handleCloseStaffListModal}
                                users={users}
                                selectedUserId={selectedUserId}
                                currentYear={currentDate.getFullYear()}
                                currentMonth={currentDate.getMonth() + 1}
                            />
                        )}

                        {/* Mobile Statistics Panel */}
                        {auth.user.can_manage_users && statistics && selectedUserId && (
                            <MobileStatisticsPanel
                                statistics={statistics}
                                selectedUserId={selectedUserId}
                                currentYear={currentDate.getFullYear()}
                                currentMonth={currentDate.getMonth() + 1}
                            />
                        )}
                    </>
                ) : (
                    /* Desktop Layout */
                    <>
                        {/* Desktop Header */}
                        <AvailabilityHeader
                            currentMonth={formatMonthYear(currentDate)}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                            onToday={handleToday}
                            onMonthYearChange={handleMonthYearChange}
                            currentMonthNum={currentDate.getMonth() + 1}
                            currentYearNum={currentDate.getFullYear()}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            {/* Calendar Grid */}
                            <div
                                className={`${auth.user.can_manage_users ? 'md:col-span-4' : 'md:col-span-5'
                                    }`}
                            >
                                <CalendarGrid
                                    calendarDays={calendarDays}
                                    currentMonth={currentDate}
                                    selections={selections}
                                    onSelectionChange={handleSelectionChange}
                                />
                            </div>

                            {/* User Management Panel */}
                            {auth.user.can_manage_users && users && (
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

                        {/* Statistics Panel */}
                        {auth.user.can_manage_users && statistics && selectedUserId && (
                            <StatisticsPanel
                                statistics={statistics}
                                selectedUserId={selectedUserId}
                                currentYear={currentDate.getFullYear()}
                                currentMonth={currentDate.getMonth() + 1}
                            />
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}