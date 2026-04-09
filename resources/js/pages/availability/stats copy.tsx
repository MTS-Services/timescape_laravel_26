import { Head, router, usePage } from '@inertiajs/react';
import { differenceInCalendarDays, format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleDateInput } from '@/components/ui/simple-date-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { AdminHeader } from '@/layouts/partials/admin/header';
import type { User } from '@/types';
import { stats } from '@/routes/admin';

type FilterType = 'month' | 'year' | 'custom';

interface StatsRow {
    user_id: number;
    user_name: string;
    total_duty_days: number;
    leave_taken: number;
    upcoming_leave: number;
    meets_current_week_requirements: boolean;
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
        if (key === name) {
            return decodeURIComponent(cookie.slice(idx + 1));
        }
    }
    return null;
};

const toYmd = (d: Date) => format(d, 'yyyy-MM-dd');

export default function StatsPage() {
    const { filter, users, rows, pagination } = usePage<PageProps>().props;

    const [filterType, setFilterType] = useState<FilterType>(filter.filter_type ?? 'month');
    const [selectedYear, setSelectedYear] = useState<number>(filter.year);
    const [selectedMonth, setSelectedMonth] = useState<number>(filter.month);
    const [customStart, setCustomStart] = useState<Date | undefined>(() => (filter.start_date ? new Date(filter.start_date) : undefined));
    const [customEnd, setCustomEnd] = useState<Date | undefined>(() => (filter.end_date ? new Date(filter.end_date) : undefined));

    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(() => new Set());
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

    const handleSelectAll = useCallback(() => {
        setSelectedUserIds(new Set(users.map((u) => u.id)));
    }, [users]);

    const handleClearAll = useCallback(() => {
        setSelectedUserIds(new Set());
    }, []);

    const allSelected = useMemo(() => users.length > 0 && selectedUserIds.size === users.length, [selectedUserIds.size, users.length]);
    const someSelected = useMemo(() => selectedUserIds.size > 0 && selectedUserIds.size < users.length, [selectedUserIds.size, users.length]);

    const selectedCountLabel = useMemo(() => {
        if (selectedUserIds.size === 0) return 'No users selected';
        if (selectedUserIds.size === 1) return '1 user selected';
        return `${selectedUserIds.size} users selected`;
    }, [selectedUserIds.size]);

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

        const rangeDays = differenceInCalendarDays(new Date(filter.end_date), new Date(filter.start_date)) + 1;
        if (rangeDays > 45) {
            toast.info("It's take a few minutes to fetch data from when i work.", { duration: 6000 });
        }

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

            if (!response.ok) throw new Error(`Failed to queue sync (${response.status})`);
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

    const months = useMemo(() => Array.from({ length: 12 }).map((_, i) => i + 1), []);

    const rangeLabel = useMemo(() => `${filter.start_date} → ${filter.end_date}`, [filter.end_date, filter.start_date]);

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

    const handleFilterTypeChange = useCallback((v: FilterType) => {
        setFilterType(v);
        if (v === 'month') {
            reloadInertia({ filter_type: 'month', year: selectedYear, month: selectedMonth, per_page: perPage, page: 1 });
        } else if (v === 'year') {
            reloadInertia({ filter_type: 'year', year: selectedYear, per_page: perPage, page: 1 });
        }
    }, [perPage, reloadInertia, selectedMonth, selectedYear]);

    const handleYearChange = useCallback((v: string) => {
        const y = Number(v);
        setSelectedYear(y);
        if (filterType === 'month') {
            reloadInertia({ filter_type: 'month', year: y, month: selectedMonth, per_page: perPage, page: 1 });
        } else if (filterType === 'year') {
            reloadInertia({ filter_type: 'year', year: y, per_page: perPage, page: 1 });
        }
    }, [filterType, perPage, reloadInertia, selectedMonth]);

    const handleMonthChange = useCallback((v: string) => {
        const m = Number(v);
        setSelectedMonth(m);
        if (filterType === 'month') {
            reloadInertia({ filter_type: 'month', year: selectedYear, month: m, per_page: perPage, page: 1 });
        }
    }, [filterType, perPage, reloadInertia, selectedYear]);

    const handlePerPageChange = useCallback((v: string) => {
        const pp = Number(v);
        setPerPage(pp);
        if (filterType === 'month') {
            reloadInertia({ filter_type: 'month', year: selectedYear, month: selectedMonth, per_page: pp, page: 1 });
        } else if (filterType === 'year') {
            reloadInertia({ filter_type: 'year', year: selectedYear, per_page: pp, page: 1 });
        } else {
            reloadInertia({ filter_type: 'custom', start_date: filter.start_date, end_date: filter.end_date, per_page: pp, page: 1 });
        }
    }, [filter.end_date, filter.start_date, filterType, reloadInertia, selectedMonth, selectedYear]);

    const goToPage = useCallback((nextPage: number) => {
        const base: Record<string, unknown> = { per_page: perPage, page: nextPage, filter_type: filterType };
        if (filterType === 'month') {
            reloadInertia({ ...base, year: selectedYear, month: selectedMonth });
        } else if (filterType === 'year') {
            reloadInertia({ ...base, year: selectedYear });
        } else {
            reloadInertia({ ...base, start_date: filter.start_date, end_date: filter.end_date });
        }
    }, [filter.end_date, filter.start_date, filterType, perPage, reloadInertia, selectedMonth, selectedYear]);

    return (
        <AdminLayout>
            <Head title="Records" />
            <AdminHeader />

            <div className="container mx-auto px-3 sm:px-4 py-4 space-y-4">
                <Card className="border-red-100/70">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="min-w-[220px]">
                                <CardTitle className="text-lg tracking-tight">Records</CardTitle>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Period <span className="text-red-700 font-medium">{rangeLabel}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-red-200/70 hover:border-red-300">
                                            Filters
                                        </Button>
                                    </CollapsibleTrigger>
                                </Collapsible>

                                <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                                    <SelectTrigger className="h-9 w-[110px] border-red-200/70">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[5, 10, 15, 30, 50, 100].map((n) => (
                                            <SelectItem key={n} value={String(n)}>
                                                {n}/page
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="hidden sm:flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="border-red-200/70" onClick={handleSelectAll}>
                                        Select all (page)
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-700 hover:text-red-800" onClick={handleClearAll}>
                                        Clear
                                    </Button>
                                </div>

                                <Badge variant="secondary" className="bg-red-50 text-red-800 border border-red-200/60">
                                    {selectedCountLabel}
                                </Badge>

                                <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                    onClick={fetchFromWhenIWork}
                                    disabled={isLoading}
                                >
                                    Fetch from When I Work
                                </Button>
                            </div>
                        </div>
                        <div className="mt-2 flex sm:hidden items-center gap-2">
                            <Button size="sm" variant="outline" className="border-red-200/70" onClick={handleSelectAll}>
                                Select all (page)
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-700 hover:text-red-800" onClick={handleClearAll}>
                                Clear
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                            <CollapsibleContent className="mb-4">
                                <div className="rounded-md border border-red-200/60 bg-red-50/30 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <div className="space-y-1 md:col-span-2">
                                            <div className="text-sm text-muted-foreground">Period</div>
                                            <Select value={filterType} onValueChange={(v) => handleFilterTypeChange(v as FilterType)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select period" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="month">Month</SelectItem>
                                                    <SelectItem value="year">Year</SelectItem>
                                                    <SelectItem value="custom">Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {filterType !== 'custom' ? (
                                            <div className="space-y-1">
                                                <div className="text-sm text-muted-foreground">Year</div>
                                                <Select value={String(selectedYear)} onValueChange={handleYearChange}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Year" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {years.map((y) => (
                                                            <SelectItem key={y} value={String(y)}>
                                                                {y}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : null}

                                        {filterType === 'month' ? (
                                            <div className="space-y-1">
                                                <div className="text-sm text-muted-foreground">Month</div>
                                                <Select value={String(selectedMonth)} onValueChange={handleMonthChange}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Month" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {months.map((m) => (
                                                            <SelectItem key={m} value={String(m)}>
                                                                {format(new Date(2024, m - 1, 1), 'MMMM')}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : null}

                                        {filterType === 'custom' ? (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="text-sm text-muted-foreground">Start date</div>
                                                    <SimpleDateInput date={customStart} setDate={setCustomStart} />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm text-muted-foreground">End date</div>
                                                    <SimpleDateInput date={customEnd} setDate={setCustomEnd} />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full border-red-200/70 hover:border-red-300 hover:bg-white"
                                                        onClick={applyCustom}
                                                        disabled={isLoading}
                                                    >
                                                        Apply
                                                    </Button>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        <div className="overflow-hidden rounded-md border border-red-100/70">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-red-50/40">
                                        <TableHead className="w-[44px]">
                                            <Checkbox
                                                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                                onCheckedChange={(v) => {
                                                    const next = Boolean(v);
                                                    if (next) handleSelectAll();
                                                    else handleClearAll();
                                                }}
                                                aria-label="Select all users"
                                            />
                                        </TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-right">Total Duty Days</TableHead>
                                        <TableHead className="text-right">Leave Taken</TableHead>
                                        <TableHead className="text-right">Upcoming Leave</TableHead>
                                        <TableHead>Requirements</TableHead>
                                        <TableHead>Date Range</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length ? (
                                        users.map((u) => {
                                            const r = rowsByUserId.get(u.id);
                                            return (
                                                <TableRow key={u.id} className="hover:bg-red-50/20">
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedUserIds.has(u.id)}
                                                            onCheckedChange={(v) => toggleUser(u.id, Boolean(v))}
                                                            aria-label={`Select ${u.name}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <span>{u.name}</span>
                                                            {u.priority != null ? <Badge variant="outline">P{u.priority}</Badge> : null}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{u.email}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{r ? r.total_duty_days : '-'}</TableCell>
                                                    <TableCell className="text-right">{r ? r.leave_taken : '-'}</TableCell>
                                                    <TableCell className="text-right">{r ? r.upcoming_leave : '-'}</TableCell>
                                                    <TableCell>
                                                        {r ? (
                                                            r.meets_current_week_requirements ? (
                                                                <Badge className="bg-red-600 hover:bg-red-600 text-white">Meets</Badge>
                                                            ) : (
                                                                <Badge variant="destructive">Not met</Badge>
                                                            )
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {r ? `${r.date_range.start} → ${r.date_range.end}` : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                            <div className="text-xs text-muted-foreground">
                                Showing {pagination.from ?? 0}-{pagination.to ?? 0} of {pagination.total}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200/70"
                                    onClick={() => goToPage(Math.max(1, pagination.current_page - 1))}
                                    disabled={pagination.current_page <= 1}
                                >
                                    Previous
                                </Button>
                                <Badge variant="secondary" className="bg-red-50 text-red-800 border border-red-200/60">
                                    {pagination.current_page}/{pagination.last_page}
                                </Badge>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200/70"
                                    onClick={() => goToPage(Math.min(pagination.last_page, pagination.current_page + 1))}
                                    disabled={pagination.current_page >= pagination.last_page}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
