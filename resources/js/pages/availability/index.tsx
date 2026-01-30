import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
    canEditToday?: boolean;
    // User sync notifications (from SyncWhenIWorkUsersJob)
    userSyncSuccess?: UserSyncResult;
    userSyncError?: UserSyncResult;
    [key: string]: unknown;
}

// Debug logging helper - only logs in development
const debugLog = (action: string, data: unknown) => {
    if (import.meta.env.DEV) {
        console.log(`[Availability Debug] ${action}:`, data);
    }
};

export default function AvailabilityScheduler() {
    const page = usePage<PageProps>();
    const { auth, initialSelections, currentYear, currentMonth, users, statistics, selectedUserId, canEditToday = false, userSyncSuccess, userSyncError } = page.props;
    // Inertia v2.3.3+: flash data is at page.flash, not page.props.flash
    const flash = (page as unknown as { flash?: PageProps['flash'] }).flash ?? page.props.flash;

    const [currentDate, setCurrentDate] = useState(() => {
        if (currentYear && currentMonth) {
            return new Date(currentYear, currentMonth - 1, 1);
        }
        return new Date();
    });

    const [selections, setSelections] = useState<AvailabilitySelections>({});
    const isMobile = useResponsiveMode({ isAdmin: auth.user.can_manage_users });
    const calendarContainerRef = useRef<HTMLDivElement | null>(null);
    const [calendarHeight, setCalendarHeight] = useState<number | null>(null);

    // Mobile-specific state
    const [selectedMobileDate, setSelectedMobileDate] = useState<string | null>(null);
    const [isPastDateModalOpen, setIsPastDateModalOpen] = useState(false);
    const [pastDateForModal, setPastDateForModal] = useState<string | null>(null);
    const staffListModalRef = useRef<StaffListModalRef>(null);

    // Use useMemo for derived state instead of useEffect
    const calendarDays = useMemo(() => {
        const days = generateCalendarDays(currentDate);
        // console.log('Generated calendar days:', days);
        return days;
    }, [currentDate]);

    const selectedUser = useMemo(() => {
        if (!users || !selectedUserId) {
            return null;
        }

        return users.find((user) => user.id === selectedUserId) ?? null;
    }, [users, selectedUserId]);

    // Initialize selections from props once on mount
    useEffect(() => {
        if (initialSelections && Object.keys(selections).length === 0) {
            // console.log('Initializing selections from props:', initialSelections);
            setSelections(initialSelections);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update selections when selectedUserId changes (admin switches users)
    useEffect(() => {
        if (initialSelections) {
            // console.log('User changed, updating selections:', { selectedUserId, initialSelections });
            setSelections(initialSelections);
        }
    }, [selectedUserId, initialSelections]);

    useEffect(() => {
        if (!auth.user.can_manage_users || isMobile) {
            setCalendarHeight(null);
            return;
        }

        const container = calendarContainerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') {
            return;
        }

        const updateHeight = () => {
            setCalendarHeight(container.getBoundingClientRect().height);
        };

        updateHeight();

        const observer = new ResizeObserver(() => {
            updateHeight();
        });

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, [auth.user.can_manage_users, isMobile, calendarDays]);

    // Show success/error messages with detailed debug info
    // Using refs to track which messages we've already shown
    const shownFlashRef = useRef<string | null>(null);
    const shownUserSyncRef = useRef<string | null>(null);

    useEffect(() => {
        // Create a unique key for current flash to avoid duplicate toasts
        const flashKey = flash ? JSON.stringify({ s: flash.success, e: flash.error }) : null;

        // Skip if we've already shown this flash message
        if (flashKey === shownFlashRef.current) {
            return;
        }

        if (flash?.success) {
            // toast.success(flash.success);
            debugLog('SAVE_SUCCESS', { message: flash.success });
            shownFlashRef.current = flashKey;
        }
        if (flash?.error) {
            toast.error(flash.error, {
                duration: 6000, // Show error longer
                description: 'Please try again or contact support if the issue persists.',
            });
            debugLog('SAVE_ERROR', {
                message: flash.error,
                results: flash.save_results,
            });

            // Log detailed failure info in development
            if (flash.save_results?.failed && flash.save_results.failed.length > 0) {
                console.error('[Availability] Failed operations:', flash.save_results.failed);
            }
            shownFlashRef.current = flashKey;
        }
    }, [flash]);

    // Show user sync notifications (from SyncWhenIWorkUsersJob on login)
    useEffect(() => {
        if (!userSyncSuccess && !userSyncError) return;

        const syncKey = JSON.stringify({ s: userSyncSuccess?.message, e: userSyncError?.message });
        if (syncKey === shownUserSyncRef.current) return;

        if (userSyncSuccess) {
            const description = userSyncSuccess.created || userSyncSuccess.updated
                ? `Created: ${userSyncSuccess.created ?? 0}, Updated: ${userSyncSuccess.updated ?? 0}`
                : undefined;
            toast.success(userSyncSuccess.message, { description });
            debugLog('USER_SYNC_SUCCESS', userSyncSuccess);
        }

        if (userSyncError) {
            toast.error(userSyncError.message, {
                duration: 8000,
                description: userSyncError.details?.length
                    ? `${userSyncError.details.length} error(s) occurred`
                    : 'Please try logging in again or contact support.',
            });
            debugLog('USER_SYNC_ERROR', userSyncError);

            if (import.meta.env.DEV && userSyncError.details) {
                console.error('[User Sync] Errors:', userSyncError.details);
            }
        }

        shownUserSyncRef.current = syncKey;
    }, [userSyncSuccess, userSyncError]);

    const fetchMonthData = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        // console.log('Fetching month data:', { year, month, selectedUserId });

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
                    // console.log('Month data fetched successfully');
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
        const previousValue = selections[dateKey];

        debugLog('SELECTION_CHANGE_START', {
            dateKey,
            optionId,
            previousValue,
            selectedUserId,
        });

        // Optimistically update UI
        setSelections((prev) => ({
            ...prev,
            [dateKey]: optionId,
        }));

        const requestPayload = {
            selections: { [dateKey]: optionId },
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
            user_id: selectedUserId,
            single_update: true,
        };

        debugLog('API_REQUEST', requestPayload);

        router.post(
            route('availability.store'),
            requestPayload,
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    // Inertia v2.3.3+: flash is at page.flash, not page.props.flash
                    const pageFlash = (page as unknown as { flash?: PageProps['flash'] }).flash;
                    debugLog('API_SUCCESS', {
                        dateKey,
                        optionId,
                        flash: pageFlash,
                    });

                    // Show toast immediately from the response flash data
                    if (pageFlash?.success) {
                        toast.success(pageFlash.success);
                        debugLog('TOAST_SHOWN', { type: 'success', message: pageFlash.success });
                    }
                    if (pageFlash?.error) {
                        toast.error(pageFlash.error, {
                            duration: 6000,
                            description: 'Please try again.',
                        });
                        debugLog('TOAST_SHOWN', { type: 'error', message: pageFlash.error });
                    }
                },
                onError: (errors) => {
                    console.error('[Availability] Save failed:', errors);
                    debugLog('API_ERROR', { dateKey, optionId, errors });

                    // Revert optimistic update on error
                    setSelections((prev) => ({
                        ...prev,
                        [dateKey]: previousValue,
                    }));

                    // Show detailed error toast
                    const errorMessage = typeof errors === 'object'
                        ? Object.values(errors).flat().join(', ')
                        : 'Failed to save your change';

                    toast.error(errorMessage, {
                        duration: 5000,
                        description: `Failed to update ${dateKey}`,
                    });
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

        if (isPast) {
            setPastDateForModal(dateKey);
            setIsPastDateModalOpen(true);
            setSelectedMobileDate(null);
        } else {
            setSelectedMobileDate((prev) => (prev === dateKey ? null : dateKey));
            setPastDateForModal(null);
            setIsPastDateModalOpen(false);
        }
    }, [calendarDays, currentDate, canEditToday]);

    const handleOpenStaffListModal = useCallback(() => {
        staffListModalRef.current?.open();
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
                const isDisabled = isDateDisabled(date, currentDate, canEditToday);
                // Show editable dates in the current month
                return !isDisabled;
            })
            .map((date) => formatDateKey(date));
    }, [calendarDays, currentDate, isMobile, canEditToday]);

    return (
        <AdminLayout>
            <Head title="Availability Scheduler" />
            <SchedulerHeader />

            <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 mt-0.5 mb-6">
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
                        <div className="mb-4">
                            <MobileCalendarGrid
                                calendarDays={calendarDays}
                                currentMonth={currentDate}
                                selections={selections}
                                selectedDate={selectedMobileDate}
                                onDateSelect={handleMobileDateSelect}
                                canEditToday={canEditToday}
                            />
                        </div>

                        {/* Mobile Expanded Availability Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mobileExpandedDates.map((dateKey) => {
                                const dateObj = calendarDays.find(
                                    (d) => formatDateKey(d) === dateKey
                                );
                                const isDisabled = dateObj
                                    ? isDateDisabled(dateObj, currentDate, canEditToday)
                                    : true;
                                const isPastDate = dateObj
                                    ? isDateInPast(dateObj, canEditToday)
                                    : false;

                                return (
                                    <MobileAvailabilityCard
                                        key={dateKey}
                                        dateKey={dateKey}
                                        selectedOption={selections[dateKey] || null}
                                        isDisabled={isDisabled}
                                        isPastDate={isPastDate}
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
                                ref={staffListModalRef}
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
                                selectedUserName={selectedUser?.name ?? auth.user.name}
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

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 items-start">
                            {/* Calendar Grid */}
                            <div
                                className={`${auth.user.can_manage_users ? 'lg:col-span-4' : 'lg:col-span-5'
                                    }`}
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

                            {/* User Management Panel */}
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

                        {/* Statistics Panel */}
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