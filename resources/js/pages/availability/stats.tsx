import { Head, router, usePage } from '@inertiajs/react';
import { differenceInCalendarDays, format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SimpleDateInput } from '@/components/ui/simple-date-input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { AdminHeader } from '@/layouts/partials/admin/header';
import { cn } from '@/lib/utils';
import { stats } from '@/routes/admin';
import type { SharedData, User } from '@/types';

type FilterType = 'month' | 'year' | 'custom';

interface StatsRow {
    user_id: number;
    user_name: string;
    total_duty_days: number;
    leave_taken: number;
    upcoming_leave: number;
    meets_current_week_requirements: boolean;
    meets_next_week_requirements: boolean;
    date_range: { start: string; end: string };
}

interface PageProps {
    filter: {
        filter_type: FilterType;
        year: number;
        month: number;
        start_date: string;
        end_date: string;
        per_page: number;
    };
    users: Array<Pick<User, 'id' | 'name' | 'email' | 'priority'>>;
    rows: StatsRow[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    [key: string]: unknown;
}

const getCookie = (name: string) => {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const cookie of cookies) {
        const idx = cookie.indexOf('=');
        if (idx === -1) continue;
        const key = cookie.slice(0, idx);
        if (key === name) return decodeURIComponent(cookie.slice(idx + 1));
    }
    return null;
};

const toYmd = (d: Date) => format(d, 'yyyy-MM-dd');

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

function unAuthorized() {
    return (
        <AdminLayout>
            <Head title="Unauthorized" />
            <AdminHeader />
            <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <div className="flex h-screen items-center justify-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Unauthorized
                    </h1>
                </div>
            </div>
        </AdminLayout>
    );
}

export default function StatsPage() {
    const { filter, users, rows, pagination } = usePage<PageProps>().props;
    const { auth } = usePage<SharedData>().props;

    if (!auth.user.can_manage_users) {
        return unAuthorized();
    }

    const [filterType, setFilterType] = useState<FilterType>(
        filter.filter_type ?? 'month',
    );
    const [selectedYear, setSelectedYear] = useState<number>(filter.year);
    const [selectedMonth, setSelectedMonth] = useState<number>(filter.month);
    const [customStart, setCustomStart] = useState<Date | undefined>(() =>
        filter.start_date ? new Date(filter.start_date) : undefined,
    );
    const [customEnd, setCustomEnd] = useState<Date | undefined>(() =>
        filter.end_date ? new Date(filter.end_date) : undefined,
    );

    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
        () => new Set(),
    );
    const [isLoading, setIsLoading] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [perPage, setPerPage] = useState<number>(filter.per_page ?? 10);

    const rowsByUserId = useMemo(() => {
        const map = new Map<number, StatsRow>();
        for (const r of rows ?? []) map.set(r.user_id, r);
        return map;
    }, [rows]);

    const toggleUser = useCallback((userId: number, checked: boolean) => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(userId);
            else next.delete(userId);
            return next;
        });
    }, []);

    const handleSelectAll = useCallback(
        () => setSelectedUserIds(new Set(users.map((u) => u.id))),
        [users],
    );
    const handleClearAll = useCallback(() => setSelectedUserIds(new Set()), []);

    const allSelected = useMemo(
        () => users.length > 0 && selectedUserIds.size === users.length,
        [selectedUserIds.size, users.length],
    );
    const someSelected = useMemo(
        () => selectedUserIds.size > 0 && selectedUserIds.size < users.length,
        [selectedUserIds.size, users.length],
    );

    const reloadInertia = useCallback((params: Record<string, unknown>) => {
        setIsLoading(true);
        router.get(stats(), params as Record<string, any>, {
            preserveState: true,
            preserveScroll: true,
            only: ['filter', 'users', 'rows', 'pagination'],
            onFinish: () => setIsLoading(false),
        });
    }, []);

    const fetchFromWhenIWork = useCallback(async () => {
        if (selectedUserIds.size === 0) {
            toast.error('Select at least one user');
            return;
        }
        const userIds = Array.from(selectedUserIds);
        const rangeDays =
            differenceInCalendarDays(
                new Date(filter.end_date),
                new Date(filter.start_date),
            ) + 1;
        if (rangeDays > 45)
            toast.info(
                'This may take a few minutes to fetch from When I Work.',
                { duration: 6000 },
            );

        setIsLoading(true);
        try {
            const token = getCookie('XSRF-TOKEN');
            const response = await fetch(route('admin.stats.sync'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...(token ? { 'X-XSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({
                    user_ids: userIds,
                    start_date: filter.start_date,
                    end_date: filter.end_date,
                }),
            });
            if (!response.ok)
                throw new Error(`Failed to queue sync (${response.status})`);
            toast.success('Sync jobs queued. Refresh stats after a minute.');
        } catch (e) {
            console.error(e);
            toast.error('Failed to queue sync jobs');
        } finally {
            setIsLoading(false);
        }
    }, [filter.end_date, filter.start_date, selectedUserIds]);

    const years = useMemo(() => {
        const y = new Date().getFullYear();
        return [y - 1, y, y + 1];
    }, []);
    const months = useMemo(
        () => Array.from({ length: 12 }).map((_, i) => i + 1),
        [],
    );
    const rangeLabel = useMemo(
        () => `${filter.start_date} → ${filter.end_date}`,
        [filter.end_date, filter.start_date],
    );

    const applyCustom = useCallback(() => {
        if (!customStart || !customEnd) {
            toast.error('Select start and end dates');
            return;
        }
        reloadInertia({
            filter_type: 'custom',
            start_date: toYmd(customStart),
            end_date: toYmd(customEnd),
            per_page: perPage,
            page: 1,
        });
    }, [customEnd, customStart, perPage, reloadInertia]);

    const handleFilterTypeChange = useCallback(
        (v: FilterType) => {
            setFilterType(v);
            if (v === 'month')
                reloadInertia({
                    filter_type: 'month',
                    year: selectedYear,
                    month: selectedMonth,
                    per_page: perPage,
                    page: 1,
                });
            else if (v === 'year')
                reloadInertia({
                    filter_type: 'year',
                    year: selectedYear,
                    per_page: perPage,
                    page: 1,
                });
        },
        [perPage, reloadInertia, selectedMonth, selectedYear],
    );

    const handleYearChange = useCallback(
        (v: string) => {
            const y = Number(v);
            setSelectedYear(y);
            if (filterType === 'month')
                reloadInertia({
                    filter_type: 'month',
                    year: y,
                    month: selectedMonth,
                    per_page: perPage,
                    page: 1,
                });
            else if (filterType === 'year')
                reloadInertia({
                    filter_type: 'year',
                    year: y,
                    per_page: perPage,
                    page: 1,
                });
        },
        [filterType, perPage, reloadInertia, selectedMonth],
    );

    const handleMonthChange = useCallback(
        (v: string) => {
            const m = Number(v);
            setSelectedMonth(m);
            if (filterType === 'month')
                reloadInertia({
                    filter_type: 'month',
                    year: selectedYear,
                    month: m,
                    per_page: perPage,
                    page: 1,
                });
        },
        [filterType, perPage, reloadInertia, selectedYear],
    );

    const handlePerPageChange = useCallback(
        (v: string) => {
            const pp = Number(v);
            setPerPage(pp);
            if (filterType === 'month')
                reloadInertia({
                    filter_type: 'month',
                    year: selectedYear,
                    month: selectedMonth,
                    per_page: pp,
                    page: 1,
                });
            else if (filterType === 'year')
                reloadInertia({
                    filter_type: 'year',
                    year: selectedYear,
                    per_page: pp,
                    page: 1,
                });
            else
                reloadInertia({
                    filter_type: 'custom',
                    start_date: filter.start_date,
                    end_date: filter.end_date,
                    per_page: pp,
                    page: 1,
                });
        },
        [
            filter.end_date,
            filter.start_date,
            filterType,
            reloadInertia,
            selectedMonth,
            selectedYear,
        ],
    );

    const goToPage = useCallback(
        (nextPage: number) => {
            const base: Record<string, unknown> = {
                per_page: perPage,
                page: nextPage,
                filter_type: filterType,
            };
            if (filterType === 'month')
                reloadInertia({
                    ...base,
                    year: selectedYear,
                    month: selectedMonth,
                });
            else if (filterType === 'year')
                reloadInertia({ ...base, year: selectedYear });
            else
                reloadInertia({
                    ...base,
                    start_date: filter.start_date,
                    end_date: filter.end_date,
                });
        },
        [
            filter.end_date,
            filter.start_date,
            filterType,
            perPage,
            reloadInertia,
            selectedMonth,
            selectedYear,
        ],
    );

    const selectionCount = selectedUserIds.size;

    return (
        <AdminLayout>
            <Head title="Records" />
            <AdminHeader />

            <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6">
                {/* ── Page Header ── */}
                <div className="mb-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                                Staff Records
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Period&nbsp;
                                <span className="font-medium text-red-700 tabular-nums">
                                    {rangeLabel}
                                </span>
                            </p>
                        </div>

                        {/* Primary action — always visible */}
                        <Button
                            size="sm"
                            className="h-9 cursor-pointer gap-2 bg-red-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 active:bg-red-800"
                            onClick={fetchFromWhenIWork}
                            disabled={isLoading}
                        >
                            {/* cloud-arrow-down icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M13 8a3 3 0 1 0-6 0v.17A4.5 4.5 0 0 0 5.5 17H14a3 3 0 0 0 .87-5.87A3 3 0 0 0 13 8.17V8Z" />
                                <path
                                    fillRule="evenodd"
                                    d="M10 10a.75.75 0 0 1 .75.75v3.69l1.22-1.22a.75.75 0 1 1 1.06 1.06l-2.5 2.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.22 1.22V10.75A.75.75 0 0 1 10 10Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Sync from When I Work
                        </Button>
                    </div>
                </div>

                {/* ── Main Card ── */}
                <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    {/* ── Toolbar ── */}
                    <CardHeader className="border-b border-gray-100 bg-white px-5 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* Left side: filter toggle + per-page */}
                            <div className="flex items-center gap-2.5">
                                <Collapsible
                                    open={filtersOpen}
                                    onOpenChange={setFiltersOpen}
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 cursor-pointer gap-1.5 border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-3.5 w-3.5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            Filters
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className={`h-3 w-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </Button>
                                    </CollapsibleTrigger>
                                </Collapsible>

                                <div className="h-4 w-px bg-gray-200" />

                                <Select
                                    value={String(perPage)}
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="h-8 w-[120px] cursor-pointer border-gray-200 text-xs text-gray-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[5, 10, 15, 30, 50, 100].map((n) => (
                                            <SelectItem
                                                key={n}
                                                value={String(n)}
                                                className="text-xs"
                                            >
                                                {n} / page
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Right side: selection controls */}
                            <div className="flex items-center gap-2">
                                {selectionCount > 0 && (
                                    <span className="text-xs text-gray-500">
                                        <span className="font-semibold text-red-700">
                                            {selectionCount}
                                        </span>{' '}
                                        selected
                                    </span>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 cursor-pointer px-3 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    onClick={
                                        allSelected
                                            ? handleClearAll
                                            : handleSelectAll
                                    }
                                >
                                    {allSelected
                                        ? 'Deselect all'
                                        : 'Select all'}
                                </Button>
                            </div>
                        </div>

                        {/* ── Filters panel ── */}
                        <Collapsible
                            open={filtersOpen}
                            onOpenChange={setFiltersOpen}
                        >
                            <CollapsibleContent>
                                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/60 p-4">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                        {/* Period type */}
                                        <div className="space-y-1.5 lg:col-span-2">
                                            <label className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                                Period
                                            </label>
                                            <Select
                                                value={filterType}
                                                onValueChange={(v) =>
                                                    handleFilterTypeChange(
                                                        v as FilterType,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-9 cursor-pointer border-gray-200 bg-white text-sm">
                                                    <SelectValue placeholder="Select period" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="month">
                                                        Month
                                                    </SelectItem>
                                                    <SelectItem value="year">
                                                        Year
                                                    </SelectItem>
                                                    <SelectItem value="custom">
                                                        Custom range
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Year (month + year modes) */}
                                        {filterType !== 'custom' && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                                    Year
                                                </label>
                                                <Select
                                                    value={String(selectedYear)}
                                                    onValueChange={
                                                        handleYearChange
                                                    }
                                                >
                                                    <SelectTrigger className="h-9 cursor-pointer border-gray-200 bg-white text-sm">
                                                        <SelectValue placeholder="Year" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {years.map((y) => (
                                                            <SelectItem
                                                                key={y}
                                                                value={String(
                                                                    y,
                                                                )}
                                                            >
                                                                {y}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Month (month mode only) */}
                                        {filterType === 'month' && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                                    Month
                                                </label>
                                                <Select
                                                    value={String(
                                                        selectedMonth,
                                                    )}
                                                    onValueChange={
                                                        handleMonthChange
                                                    }
                                                >
                                                    <SelectTrigger className="h-9 cursor-pointer border-gray-200 bg-white text-sm">
                                                        <SelectValue placeholder="Month" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {months.map((m) => (
                                                            <SelectItem
                                                                key={m}
                                                                value={String(
                                                                    m,
                                                                )}
                                                            >
                                                                {
                                                                    MONTH_NAMES[
                                                                        m - 1
                                                                    ]
                                                                }
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Custom date range */}
                                        {filterType === 'custom' && (
                                            <>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                                        Start date
                                                    </label>
                                                    <SimpleDateInput
                                                        date={customStart}
                                                        setDate={setCustomStart}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                                        End date
                                                    </label>
                                                    <SimpleDateInput
                                                        date={customEnd}
                                                        setDate={setCustomEnd}
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        size="sm"
                                                        className="h-9 w-full cursor-pointer bg-gray-900 text-sm font-medium text-white hover:bg-gray-800"
                                                        onClick={applyCustom}
                                                        disabled={isLoading}
                                                    >
                                                        Apply range
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </CardHeader>

                    {/* ── Table ── */}
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-gray-100 bg-gray-50/80 hover:bg-gray-50/80">
                                        <TableHead className="w-12 pr-3 pl-5 border-r border-gray-100">
                                            <Checkbox
                                                checked={
                                                    allSelected
                                                        ? true
                                                        : someSelected
                                                          ? 'indeterminate'
                                                          : false
                                                }
                                                onCheckedChange={(v) => {
                                                    if (Boolean(v))
                                                        handleSelectAll();
                                                    else handleClearAll();
                                                }}
                                                aria-label="Select all users"
                                                className="cursor-pointer border-gray-300"
                                            />
                                        </TableHead>
                                        <TableHead className="py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase border-r border-gray-100">
                                            User
                                        </TableHead>
                                        <TableHead className="text-right text-xs font-semibold tracking-wide text-gray-500 uppercase border-r border-gray-100">
                                            Duty Days
                                        </TableHead>
                                        <TableHead className="text-right text-xs font-semibold tracking-wide text-gray-500 uppercase border-r border-gray-100">
                                            Leave Taken
                                        </TableHead>
                                        <TableHead className="text-right text-xs font-semibold tracking-wide text-gray-500 uppercase border-r border-gray-100">
                                            Upcoming Leave
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                            Requirements
                                        </TableHead>                                       
                                        {/* <TableHead className="pr-5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                            Date Range
                                        </TableHead> */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        /* Loading skeleton */
                                        Array.from({ length: 5 }).map(
                                            (_, i) => (
                                                <TableRow
                                                    key={i}
                                                    className="border-b border-gray-50"
                                                >
                                                    <TableCell className="pr-3 pl-5">
                                                        <div className="h-4 w-4 animate-pulse rounded bg-gray-100" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1.5">
                                                            <div className="h-3.5 w-32 animate-pulse rounded bg-gray-100" />
                                                            <div className="h-3 w-44 animate-pulse rounded bg-gray-100" />
                                                        </div>
                                                    </TableCell>
                                                    {[...Array(5)].map(
                                                        (_, j) => (
                                                            <TableCell key={j}>
                                                                <div className="ml-auto h-3.5 w-12 animate-pulse rounded bg-gray-100" />
                                                            </TableCell>
                                                        ),
                                                    )}
                                                </TableRow>
                                            ),
                                        )
                                    ) : users.length ? (
                                        users.map((u, idx) => {
                                            const r = rowsByUserId.get(u.id);
                                            const isSelected =
                                                selectedUserIds.has(u.id);
                                            return (
                                                <TableRow
                                                    key={u.id}
                                                    className={`border-b border-gray-50 transition-colors ${isSelected ? 'bg-red-50/40' : 'hover:bg-gray-50/50'}`}
                                                >
                                                    <TableCell className="pr-3 pl-5 border-r border-gray-100">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(
                                                                v,
                                                            ) =>
                                                                toggleUser(
                                                                    u.id,
                                                                    Boolean(v),
                                                                )
                                                            }
                                                            aria-label={`Select ${u.name}`}
                                                            className="cursor-pointer border-gray-300"
                                                        />
                                                    </TableCell>

                                                    {/* User cell */}
                                                    <TableCell className="py-3.5 border-r border-gray-100">
                                                        <div className="flex items-center gap-2.5">
                                                            {/* Avatar placeholder */}
                                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 select-none">
                                                                {u.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <span className="truncate text-sm font-medium text-gray-900">
                                                                        {u.name}
                                                                    </span>
                                                                    {u.priority !=
                                                                        null && (
                                                                        <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200/60 ring-inset">
                                                                            P
                                                                            {
                                                                                u.priority
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="truncate text-xs text-gray-400">
                                                                    {u.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Numeric stat cells */}
                                                    <TableCell className="text-right border-r border-gray-100">
                                                        <span className="text-sm font-semibold text-gray-800 tabular-nums">
                                                            {r ? (
                                                                r.total_duty_days
                                                            ) : (
                                                                <span className="font-normal text-gray-300">
                                                                    —
                                                                </span>
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right border-r border-gray-100">
                                                        <span className="text-sm font-semibold text-gray-800 tabular-nums">
                                                            {r ? (
                                                                r.leave_taken
                                                            ) : (
                                                                <span className="font-normal text-gray-300">
                                                                    —
                                                                </span>
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right border-r border-gray-100">
                                                        <span className="text-sm font-semibold text-gray-800 tabular-nums">
                                                            {r ? (
                                                                r.upcoming_leave
                                                            ) : (
                                                                <span className="font-normal text-gray-300">
                                                                    —
                                                                </span>
                                                            )}
                                                        </span>
                                                    </TableCell>

                                                    {/* Requirements badge */}
                                                    <TableCell className="border-r border-gray-100">
                                                        {r ? (
                                                            <div className="flex w-auto gap-1">
                                                                <div
                                                                    className={cn(
                                                                        'inline-flex items-center gap-1 rounded-full p-2 text-xs font-medium ring-1 ring-inset',
                                                                        r.meets_current_week_requirements
                                                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
                                                                            : 'bg-gray-50 text-gray-500 ring-gray-200/60',
                                                                    )}
                                                                >
                                                                    <svg
                                                                        className="h-2.5 w-2.5"
                                                                        viewBox="0 0 6 6"
                                                                        fill="currentColor"
                                                                    >
                                                                        <circle
                                                                            cx="3"
                                                                            cy="3"
                                                                            r="3"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <div
                                                                    className={cn(
                                                                        'inline-flex items-center gap-1 rounded-full p-2 text-xs font-medium ring-1 ring-inset',
                                                                        r.meets_next_week_requirements
                                                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
                                                                            : 'bg-gray-50 text-gray-500 ring-gray-200/60',
                                                                    )}
                                                                >
                                                                    <svg
                                                                        className="h-2.5 w-2.5"
                                                                        viewBox="0 0 6 6"
                                                                        fill="currentColor"
                                                                    >
                                                                        <circle
                                                                            cx="3"
                                                                            cy="3"
                                                                            r="3"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // r.meets_current_week_requirements ? (
                                                            //     <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
                                                            //         <svg className="h-2.5 w-2.5" viewBox="0 0 6 6" fill="currentColor">
                                                            //             <circle cx="3" cy="3" r="3"/>
                                                            //         </svg>
                                                            //         Meets
                                                            //     </span>
                                                            // ) : (
                                                            //     <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/60">
                                                            //         <svg className="h-2.5 w-2.5" viewBox="0 0 6 6" fill="currentColor">
                                                            //             <circle cx="3" cy="3" r="3"/>
                                                            //         </svg>
                                                            //         Not met
                                                            //     </span>
                                                            // )
                                                            <span className="text-sm text-gray-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {/* Date range */}
                                                    {/* <TableCell className="pr-5">
                                                        {r ? (
                                                            <span className="text-xs whitespace-nowrap text-gray-500 tabular-nums">
                                                                {
                                                                    r.date_range
                                                                        .start
                                                                }
                                                                <span className="mx-1 text-gray-300">
                                                                    →
                                                                </span>
                                                                {
                                                                    r.date_range
                                                                        .end
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-gray-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell> */}
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="h-40 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-8 w-8 text-gray-200"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                                                        />
                                                    </svg>
                                                    <p className="text-sm text-gray-400">
                                                        No users found
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* ── Pagination ── */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/40 px-5 py-3.5">
                            <p className="text-xs text-gray-400">
                                Showing{' '}
                                <span className="font-medium text-gray-600">
                                    {pagination.from ?? 0}–{pagination.to ?? 0}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-gray-600">
                                    {pagination.total}
                                </span>{' '}
                                users
                            </p>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 border-gray-200 px-3 text-xs text-gray-600 hover:border-gray-300 disabled:opacity-40"
                                    onClick={() =>
                                        goToPage(
                                            Math.max(
                                                1,
                                                pagination.current_page - 1,
                                            ),
                                        )
                                    }
                                    disabled={
                                        pagination.current_page <= 1 ||
                                        isLoading
                                    }
                                >
                                    ← Prev
                                </Button>

                                <div className="flex items-center gap-1 px-2">
                                    <span className="text-xs font-semibold text-gray-700">
                                        {pagination.current_page}
                                    </span>
                                    <span className="text-xs text-gray-300">
                                        /
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {pagination.last_page}
                                    </span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 border-gray-200 px-3 text-xs text-gray-600 hover:border-gray-300 disabled:opacity-40"
                                    onClick={() =>
                                        goToPage(
                                            Math.min(
                                                pagination.last_page,
                                                pagination.current_page + 1,
                                            ),
                                        )
                                    }
                                    disabled={
                                        pagination.current_page >=
                                            pagination.last_page || isLoading
                                    }
                                >
                                    Next →
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
