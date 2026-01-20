import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { generateCalendarDays, formatMonthYear, addMonths } from '@/lib/date-helpers';
import { AvailabilityHeader } from '@/components/availability/availability-header';
import { CalendarGrid } from '@/components/availability/calendar-grid';
import { RequirementsBanner } from '@/components/availability/requirements-banner';
import type {
    AvailabilityPageProps,
    AvailabilitySelections,
} from '@/types/availability';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user-layout';

export default function AvailabilityScheduler() {
    const { props } = usePage<{
        auth: { user: { name: string; email: string } };
        flash: { success?: string; error?: string };
        initialSelections: AvailabilitySelections;
        requirements: any;
        currentYear?: number;
        currentMonth?: number;
    }>();

    const [currentDate, setCurrentDate] = useState(() => {
        if (props.currentYear && props.currentMonth) {
            return new Date(props.currentYear, props.currentMonth - 1, 1);
        }
        return new Date();
    });

    const [selections, setSelections] = useState<AvailabilitySelections>(
        props.initialSelections || {}
    );
    const [calendarDays, setCalendarDays] = useState<Date[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const days = generateCalendarDays(currentDate);
        setCalendarDays(days);
    }, [currentDate]);

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
        if (props.flash?.error) {
            toast.error(props.flash.error);
        }
    }, [props.flash]);

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

    const fetchMonthData = (date: Date) => {
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
        console.log('Fetched data for', date);
    };

    const handleSelectionChange = (dateKey: string, optionId: string | null) => {
        setSelections((prev) => ({
            ...prev,
            [dateKey]: optionId,
        }));
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
    return (
        <UserLayout>
            <Head title="Availability Scheduler" />
            <div className="min-h-screen bg-background py-8">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
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
                                    {props.auth.user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">Staff</p>
                            </div>
                            <Avatar>
                                <AvatarFallback>
                                    {getUserInitials(props.auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>

                    {/* Requirements Banner */}
                    {props.requirements && (
                        <RequirementsBanner requirements={props.requirements} />
                    )}

                    {/* Calendar */}
                    <AvailabilityHeader
                        currentMonth={formatMonthYear(currentDate)}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                        onToday={handleToday}
                    />

                    <CalendarGrid
                        calendarDays={calendarDays}
                        currentMonth={currentDate}
                        selections={selections}
                        onSelectionChange={handleSelectionChange}
                    />
                </div>
            </div>
        </UserLayout>
    );
}