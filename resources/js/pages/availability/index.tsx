import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { toast } from 'sonner';

import { AvailabilityHeader } from '@/components/availability/availability-header';
import { CalendarGrid } from '@/components/availability/calendar-grid';
import { MobileAvailabilityCard } from '@/components/availability/mobile-availability-card';
import { MobileAvailabilityHeader } from '@/components/availability/mobile-availability-header';
import { MobileCalendarGrid } from '@/components/availability/mobile-calendar-grid';
import { MobileStatisticsPanel } from '@/components/availability/mobile-statistics-panel';
import { PastDateModal } from '@/components/availability/past-date-modal';
import { StaffListModal, StaffListModalRef } from '@/components/availability/staff-list-modal';
import { StatisticsPanel } from '@/components/availability/statistics-panel';
import { UserSelectionPanel } from '@/components/availability/user-selection-panel';
import SchedulerHeader from '@/components/scheduler-header';
import { useResponsiveMode } from '@/hooks/use-responsive-mode';
import AdminLayout from '@/layouts/admin-layout';
import { generateCalendarDays, formatMonthYear, addMonths, isDateInPast, formatDateKey, isDateDisabled, isSameMonth } from '@/lib/date-helpers';
import type { User } from '@/types';
import type {
    AvailabilitySelections,
    AvailabilityRequirements,
} from '@/types/availability';

interface SaveResult {
    date: string;
    time_slot?: string;
    action?: string;
    reason?: string;
}

interface SaveResults {
    success: SaveResult[];
    failed: SaveResult[];
    skipped: SaveResult[];
    has_errors: boolean;
    error_message: string | null;
}

interface UserSyncResult {
    message: string;
    created?: number;
    updated?: number;
    failed?: number;
    details?: string[];
}

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
        save_results?: SaveResults;
    };
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
    canEditToday?: boolean;
    userSyncSuccess?: UserSyncResult;
    userSyncError?: UserSyncResult;
    [key: string]: unknown;
}

const debugLog = (action: string, data: unknown) => {
    if (import.meta.env.DEV) {
        console.log(`[Availability Debug] ${action}:`, data);
    }
};

export default function AvailabilityScheduler() {
    const page = usePage<PageProps>();
    const { auth, initialSelections, currentYear, currentMonth, users, statistics, selectedUserId, canEditToday = false, userSyncSuccess, userSyncError } = page.props;
    const flash = (page as unknown as { flash?: PageProps['flash'] }).flash ?? page.props.flash;

    const [currentDate, setCurrentDate] = useState(() => {
        if (currentYear && currentMonth) {
            return new Date(currentYear, currentMonth - 1, 1);
        }
        return new Date();
    });

    const [selections, setSelections] = useState<AvailabilitySelections>({});
    const isMobile = useResponsiveMode({ isAdmin: auth.user.can_manage_users });

    // Refs for layout measurement
    const calendarContainerRef = useRef<HTMLDivElement | null>(null);
    const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
    const [calendarHeight, setCalendarHeight] = useState<number | null>(null);

    // Mobile-specific state
    const [selectedMobileDate, setSelectedMobileDate] = useState<string | null>(null);
    const [isPastDateModalOpen, setIsPastDateModalOpen] = useState(false);
    const [pastDateForModal, setPastDateForModal] = useState<string | null>(null);
    const staffListModalRef = useRef<StaffListModalRef>(null);

    /**
     * DYNAMIC HEIGHT FIX: 
     * Measures the sticky header height and sets it as global scroll-padding.
     * This ensures card scroll targets are never hidden behind the sticky header.
     */
    useLayoutEffect(() => {
        if (!isMobile) return;

        const updateScrollPadding = () => {
            if (stickyHeaderRef.current) {
                const height = stickyHeaderRef.current.offsetHeight;
                // height + 10px buffer for a clean look
                document.documentElement.style.scrollPaddingTop = `${height - 5}px`;
            }
        };

        // Initialize ResizeObserver to catch height changes if text wraps
        const resizeObserver = new ResizeObserver(() => updateScrollPadding());
        if (stickyHeaderRef.current) resizeObserver.observe(stickyHeaderRef.current);

        updateScrollPadding();
        window.addEventListener('resize', updateScrollPadding);

        return () => {
            window.removeEventListener('resize', updateScrollPadding);
            resizeObserver.disconnect();
        };
    }, [isMobile, currentDate]);

    const calendarDays = useMemo(() =>
        generateCalendarDays(currentDate),
        [currentDate.getFullYear(), currentDate.getMonth()]
    );

    const selectedUser = useMemo(() => {
        if (!users || !selectedUserId) return null;
        return users.find((user) => user.id === selectedUserId) ?? null;
    }, [users, selectedUserId]);

    // Initial Selections Sync
    useEffect(() => {
        if (initialSelections && Object.keys(selections).length === 0) {
            setSelections(initialSelections);
        }
    }, [initialSelections]);

    // Admin User Switch Sync
    useEffect(() => {
        if (initialSelections) {
            setSelections(initialSelections);
        }
    }, [selectedUserId, initialSelections]);

    // Desktop Layout Height Sync
    useEffect(() => {
        if (!auth.user.can_manage_users || isMobile) {
            setCalendarHeight(null);
            return;
        }

        const container = calendarContainerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') return;

        const updateHeight = () => setCalendarHeight(container.getBoundingClientRect().height);
        updateHeight();

        const observer = new ResizeObserver(() => updateHeight());
        observer.observe(container);

        return () => observer.disconnect();
    }, [auth.user.can_manage_users, isMobile, calendarDays]);

    // Flash/Sync Notifications logic
    const shownFlashRef = useRef<string | null>(null);
    const shownUserSyncRef = useRef<string | null>(null);

    useEffect(() => {
        const flashKey = flash ? JSON.stringify({ s: flash.success, e: flash.error }) : null;
        if (flashKey === shownFlashRef.current) return;

        if (flash?.success) {
            debugLog('SAVE_SUCCESS', { message: flash.success });
            shownFlashRef.current = flashKey;
        }
        if (flash?.error) {
            toast.error(flash.error, { duration: 6000 });
            shownFlashRef.current = flashKey;
        }
    }, [flash]);

    useEffect(() => {
        if (!userSyncSuccess && !userSyncError) return;
        const syncKey = JSON.stringify({ s: userSyncSuccess?.message, e: userSyncError?.message });
        if (syncKey === shownUserSyncRef.current) return;

        if (userSyncSuccess) toast.success(userSyncSuccess.message);
        if (userSyncError) toast.error(userSyncError.message);

        shownUserSyncRef.current = syncKey;
    }, [userSyncSuccess, userSyncError]);

    const fetchMonthData = useCallback((date: Date) => {
        router.get(
            route('availability.index'),
            { year: date.getFullYear(), month: date.getMonth() + 1, user_id: selectedUserId },
            { preserveState: true, preserveScroll: true, only: ['initialSelections', 'requirements', 'users', 'statistics'] }
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
        const previousValue = selections[dateKey];
        setSelections((prev) => ({ ...prev, [dateKey]: optionId }));

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
                onSuccess: (page) => {
                    const pageFlash = (page as unknown as { flash?: PageProps['flash'] }).flash;
                    if (pageFlash?.success) toast.success(pageFlash.success);
                },
                onError: () => {
                    setSelections((prev) => ({ ...prev, [dateKey]: previousValue }));
                    toast.error('Failed to save selection');
                },
            }
        );
    }, [currentDate, selectedUserId, selections]);

    const handleMobileDateSelect = useCallback((dateKey: string) => {
        const dateObj = calendarDays.find((d) => formatDateKey(d) === dateKey);
        if (!dateObj) return;

        const isPast = isDateInPast(dateObj, canEditToday);
        const isInCurrentMonth = isSameMonth(dateObj, currentDate);

        if (!isInCurrentMonth) return;

        // if (isPast) {
        //     setPastDateForModal(dateKey);
        //     setIsPastDateModalOpen(true);
        //     setSelectedMobileDate(null);
        // } else {
        //     setSelectedMobileDate((prev) => (prev === dateKey ? null : dateKey));

        //     // Trigger smooth scroll to the specific card
        //     setTimeout(() => {
        //         const element = document.getElementById(`card-${dateKey}`);
        //         if (element) {
        //             element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        //         }
        //     }, 50);
        // }

        setSelectedMobileDate((prev) => (prev === dateKey ? null : dateKey));

        // Trigger smooth scroll to the specific card
        requestAnimationFrame(() => {
            const element = document.getElementById(`card-${dateKey}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

    }, [calendarDays, currentDate, canEditToday]);

    const handleOpenStaffListModal = useCallback(() => staffListModalRef.current?.open(), []);
    const handleClosePastDateModal = useCallback(() => {
        setIsPastDateModalOpen(false);
        setPastDateForModal(null);
    }, []);

    const mobileExpandedDates = useMemo(() => {
        if (!isMobile) return [];
        return calendarDays
            .filter((date) => !isDateDisabled(date, currentDate, canEditToday, true))
            .map((date) => formatDateKey(date));
    }, [calendarDays, currentDate, isMobile, canEditToday]);

    // useEffect(() => {
    //     if (!isMobile) return;
    //     setSelectedMobileDate(null);
    // }, [isMobile, currentDate]);

    // useEffect(() => {
    //     if (!isMobile || selectedMobileDate) return;

    //     const today = new Date();
    //     const isCurrentMonth = isSameMonth(today, currentDate);

    //     if (isCurrentMonth) {
    //         // If viewing current month, select today
    //         const todayKey = formatDateKey(today);
    //         handleMobileDateSelect(todayKey);
    //     } else {
    //         // If viewing a different month, select the 1st day of that month
    //         const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    //         const firstDayKey = formatDateKey(firstDayOfMonth);
    //         handleMobileDateSelect(firstDayKey);
    //     }
    // }, [isMobile, currentDate, selectedMobileDate]);

    return (
        <AdminLayout>
            <Head title="Availability Scheduler" />

            <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 mt-0.5 mb-6">
                {isMobile ? (
                    <div className="flex flex-col">
                        <div className='relative'>
                            {/* Sticky Header Wrapper */}
                            <div
                                ref={stickyHeaderRef}
                                className="bg-background pb-2 sticky top-0 z-40"
                            >
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
                                    selectedUserName={selectedUser?.name ?? auth.user.name}
                                />

                                <MobileCalendarGrid
                                    calendarDays={calendarDays}
                                    currentMonth={currentDate}
                                    selections={selections}
                                    selectedDate={selectedMobileDate}
                                    onDateSelect={handleMobileDateSelect}
                                    canEditToday={canEditToday}
                                />
                            </div>

                            {/* Availability Cards */}
                            <div className="pt-4 pb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {mobileExpandedDates.map((dateKey) => {
                                        const dateObj = calendarDays.find((d) => formatDateKey(d) === dateKey);
                                        const isDisabled = dateObj ? isDateDisabled(dateObj, currentDate, canEditToday) : true;
                                        const isPastDate = dateObj ? isDateInPast(dateObj, canEditToday) : false;

                                        return (
                                            <div id={`card-${dateKey}`} key={dateKey} className="scroll-mt-4">
                                                <MobileAvailabilityCard
                                                    dateKey={dateKey}
                                                    selectedOption={selections[dateKey] || null}
                                                    isDisabled={isDisabled}
                                                    isPastDate={isPastDate}
                                                    onOptionChange={handleSelectionChange}
                                                    allowCollapse={true}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {auth.user.can_manage_users && statistics && selectedUserId && (
                            <div className="pt-4 pb-8 border-t border-border mt-4">
                                <MobileStatisticsPanel
                                    statistics={statistics}
                                    selectedUserId={selectedUserId}
                                    currentYear={currentDate.getFullYear()}
                                    currentMonth={currentDate.getMonth() + 1}
                                    selectedUserName={selectedUser?.name ?? auth.user.name}
                                />
                            </div>
                        )}

                        <PastDateModal
                            isOpen={isPastDateModalOpen}
                            onClose={handleClosePastDateModal}
                            dateKey={pastDateForModal}
                            selectedOption={pastDateForModal ? selections[pastDateForModal] || null : null}
                        />

                        {auth.user.can_manage_users && users && (
                            <StaffListModal
                                ref={staffListModalRef}
                                users={users}
                                selectedUserId={selectedUserId}
                                currentYear={currentDate.getFullYear()}
                                currentMonth={currentDate.getMonth() + 1}
                            />
                        )}
                    </div>
                ) : (
                    /* Desktop Layout */
                    <>
                        <AvailabilityHeader
                            currentMonth={formatMonthYear(currentDate)}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                            onToday={handleToday}
                            onMonthYearChange={handleMonthYearChange}
                            currentMonthNum={currentDate.getMonth() + 1}
                            currentYearNum={currentDate.getFullYear()}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 items-start">
                            <div
                                className={`${auth.user.can_manage_users ? 'lg:col-span-4' : 'lg:col-span-5'}`}
                                id="calendar-grid-container"
                                ref={calendarContainerRef}
                            >
                                <CalendarGrid
                                    calendarDays={calendarDays}
                                    currentMonth={currentDate}
                                    selections={selections}
                                    onSelectionChange={handleSelectionChange}
                                    canEditToday={canEditToday}
                                />
                            </div>

                            {auth.user.can_manage_users && users && (
                                <div className="lg:col-span-1 h-full min-h-[400px]">
                                    <UserSelectionPanel
                                        users={users}
                                        selectedUserId={selectedUserId}
                                        currentYear={currentDate.getFullYear()}
                                        currentMonth={currentDate.getMonth() + 1}
                                        maxHeight={calendarHeight ?? undefined}
                                    />
                                </div>
                            )}
                        </div>

                        {auth.user.can_manage_users && statistics && selectedUserId && (
                            <StatisticsPanel
                                statistics={statistics}
                                selectedUserId={selectedUserId}
                                currentYear={currentDate.getFullYear()}
                                currentMonth={currentDate.getMonth() + 1}
                                selectedUserName={selectedUser?.name ?? auth.user.name}
                            />
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}