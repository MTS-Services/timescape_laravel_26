<?php

namespace App\Http\Controllers;

use App\Jobs\SyncUserAvailabilityRangeJob;
use App\Models\Availability;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class UserStatsController extends Controller
{
    public function stats(Request $request, AvailabilityService $availabilityService): Response
    {
        $currentUser = $request->user();

        $validated = $request->validate([
            'filter_type' => ['nullable', 'string', 'in:month,year,custom'],
            'year' => ['nullable', 'integer', 'between:2020,2035'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'per_page' => ['nullable', 'integer', 'in:5,10,15,30,50,100'],
        ]);

        $filterType = $validated['filter_type'] ?? 'month';
        $now = now();
        $year = (int) ($validated['year'] ?? $now->year);
        $month = (int) ($validated['month'] ?? $now->month);
        $perPage = (int) ($validated['per_page'] ?? 15);

        [$start, $end] = $this->resolveDateRange(
            $filterType,
            $year,
            $month,
            $validated['start_date'] ?? null,
            $validated['end_date'] ?? null
        );

        $usersQuery = User::query()
            ->notSelf() // Exclude the current user
            ->select('id', 'first_name', 'last_name', 'email', 'account_id', 'priority')
            ->orderByRaw("CASE WHEN priority IS NULL OR priority = '' THEN 1 ELSE 0 END ASC")
            ->orderBy('priority', 'asc')
            ->orderBy('first_name')
            ->orderBy('last_name');

        if (! config('availability.can_manage_all', false)) {
            $usersQuery->where('account_id', $currentUser->account_id)
                ->activeAtLocation(User::workContextLocationId($currentUser));
        }

        $usersCollection = $usersQuery->get();
        $users = $usersCollection->map(function ($u) {
            return [
                'id' => (int) $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'account_id' => $u->account_id,
                'priority' => $u->priority,
            ];
        })->values();

        $rows = $this->buildStatsRowsForUsers($users, $start, $end, $availabilityService, User::workContextLocationId($currentUser));
        $this->autoDispatchRangeSyncIfNeeded($request, $currentUser, $usersCollection, $start, $end);
        $totalHolidays = collect($rows)->sum('total_holidays');

        return Inertia::render('availability/stats', [
            'filter' => [
                'filter_type' => $filterType,
                'year' => $year,
                'month' => $month,
                'start_date' => $start->format('Y-m-d'),
                'end_date' => $end->format('Y-m-d'),
                'per_page' => $perPage,
            ],
            'users' => $users,
            'rows' => array_values($rows),
            'summary' => [
                'total_holidays' => (int) $totalHolidays,
            ],
            'pagination' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $usersCollection->count(),
                'total' => $usersCollection->count(),
                'from' => $usersCollection->isEmpty() ? null : 1,
                'to' => $usersCollection->isEmpty() ? null : $usersCollection->count(),
            ],
        ]);
    }

    public function data(Request $request, AvailabilityService $availabilityService)
    {
        $currentUser = $request->user();

        $validated = $request->validate([
            'filter_type' => ['nullable', 'string', 'in:month,year,custom'],
            'year' => ['nullable', 'integer', 'between:2020,2035'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'in:5,10,15,30,50,100'],
        ]);

        $filterType = $validated['filter_type'] ?? 'month';
        $now = now();
        $year = (int) ($validated['year'] ?? $now->year);
        $month = (int) ($validated['month'] ?? $now->month);
        $perPage = (int) ($validated['per_page'] ?? 10);

        [$start, $end] = $this->resolveDateRange(
            $filterType,
            $year,
            $month,
            $validated['start_date'] ?? null,
            $validated['end_date'] ?? null
        );

        $usersQuery = User::query()
            ->select('id', 'first_name', 'last_name', 'email', 'account_id', 'priority')
            ->orderByRaw("CASE WHEN priority IS NULL OR priority = '' THEN 1 ELSE 0 END ASC")
            ->orderBy('priority', 'asc')
            ->orderBy('first_name')
            ->orderBy('last_name');

        if (! config('availability.can_manage_all', false)) {
            $usersQuery->where('account_id', $currentUser->account_id)
                ->activeAtLocation(User::workContextLocationId($currentUser));
        }

        $usersCollection = $usersQuery->get();
        $users = $usersCollection->map(function ($u) {
            return [
                'id' => (int) $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'account_id' => $u->account_id,
                'priority' => $u->priority,
            ];
        })->values();

        $rows = $this->buildStatsRowsForUsers($users, $start, $end, $availabilityService, User::workContextLocationId($currentUser));
        $totalHolidays = collect($rows)->sum('total_holidays');

        return response()->json([
            'filter' => [
                'filter_type' => $filterType,
                'year' => $year,
                'month' => $month,
                'start_date' => $start->format('Y-m-d'),
                'end_date' => $end->format('Y-m-d'),
                'per_page' => $perPage,
            ],
            'users' => $users,
            'rows' => array_values($rows),
            'summary' => [
                'total_holidays' => (int) $totalHolidays,
            ],
            'pagination' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $usersCollection->count(),
                'total' => $usersCollection->count(),
                'from' => $usersCollection->isEmpty() ? null : 1,
                'to' => $usersCollection->isEmpty() ? null : $usersCollection->count(),
            ],
        ]);
    }

    public function sync(Request $request)
    {
        $currentUser = $request->user();

        $validated = $request->validate([
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $userIds = array_values(array_unique(array_map('intval', $validated['user_ids'] ?? [])));
        if ($userIds === []) {
            return response()->json(['error' => 'No users provided'], 422);
        }

        if (! config('availability.can_manage_all', false)) {
            $allowedIds = User::query()
                ->where('account_id', $currentUser->account_id)
                ->activeAtLocation(User::workContextLocationId($currentUser))
                ->whereIn('id', $userIds)
                ->pluck('id')
                ->map(fn($id) => (int) $id)
                ->all();

            if (count($allowedIds) !== count($userIds)) {
                return response()->json(['error' => 'Cannot access users from other accounts or location'], 403);
            }
        }

        $start = Carbon::parse($validated['start_date'])->startOfDay();
        $end = Carbon::parse($validated['end_date'])->startOfDay();

        $jobs = [];
        foreach ($userIds as $uid) {
            $jobs[] = new SyncUserAvailabilityRangeJob(
                userId: $uid,
                startDate: $start->format('Y-m-d'),
                endDate: $end->format('Y-m-d')
            );
        }

        // Dispatch jobs individually (no batching required).
        foreach ($jobs as $job) {
            dispatch($job);
        }

        return response()->json([
            'message' => 'Sync jobs queued.',
            'queued_users' => count($jobs),
        ]);
    }

    private function resolveDateRange(string $filterType, int $year, int $month, ?string $startDate, ?string $endDate): array
    {
        if ($filterType === 'year') {
            return [
                Carbon::create($year, 1, 1)->startOfDay(),
                Carbon::create($year, 12, 31)->endOfDay(),
            ];
        }

        if ($filterType === 'custom' && $startDate && $endDate) {
            return [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ];
        }

        return [
            Carbon::create($year, $month, 1)->startOfMonth()->startOfDay(),
            Carbon::create($year, $month, 1)->endOfMonth()->endOfDay(),
        ];
    }

    /**
     * @param  Collection<int, array{id:int,name:string,email:string,account_id:mixed,priority:mixed}>  $users
     * @return array<int, array<string, mixed>>
     */
    private function buildStatsRowsForUsers($users, Carbon $start, Carbon $end, AvailabilityService $availabilityService, ?int $locationId = null): array
    {
        $userIds = $users->pluck('id')->map(fn($id) => (int) $id)->all();

        $rows = [];
        foreach ($users as $u) {
            $uid = (int) $u['id'];
            $rows[$uid] = [
                'user_id' => $uid,
                'user_name' => $u['name'],
                'total_duty_days' => 0,
                'leave_taken' => 0,
                'upcoming_leave' => 0,
                'total_holidays' => 0,
                'meets_current_week_requirements' => false,
                'meets_next_week_requirements' => false,
                'date_range' => [
                    'start' => $start->format('Y-m-d'),
                    'end' => $end->format('Y-m-d'),
                ],
            ];
        }

        if ($userIds === []) {
            return [];
        }

        $includeHolidayInDutyDays = (bool) config('availability.include_holiday_in_duty_days', false);

        $availabilities = Availability::query()
            ->whereIn('user_id', $userIds)
            ->whereBetween('availability_date', [$start, $end])
            ->when($locationId !== null, function ($q) use ($locationId): void {
                $q->whereHas('user', fn($uq) => $uq->activeAtLocation($locationId));
            })
            ->get(['user_id', 'availability_date', 'time_slot']);

        foreach ($availabilities as $a) {
            $uid = (int) $a->user_id;
            if (! isset($rows[$uid])) {
                continue;
            }

            $slot = (string) $a->time_slot;

            if ($includeHolidayInDutyDays || $slot !== 'holiday') {
                $rows[$uid]['total_duty_days']++;
            }

            if ($slot === 'holiday') {
                if ($availabilityService->isDatePast($a->availability_date)) {
                    $rows[$uid]['leave_taken']++;
                } elseif ($availabilityService->isDateFuture($a->availability_date)) {
                    $rows[$uid]['upcoming_leave']++;
                }

                $rows[$uid]['total_holidays']++;
            }
        }

        $currentWeekStatusMap = $availabilityService->getWeekRequirementsStatusMap($userIds, null, $locationId);
        $nextWeekStatusMap = $availabilityService->getWeekRequirementsStatusMap($userIds, now()->addWeek(), $locationId);
        foreach ($rows as $uid => $row) {
            $rows[$uid]['meets_current_week_requirements'] = (bool) ($currentWeekStatusMap[(int) $uid] ?? false);
            $rows[$uid]['meets_next_week_requirements'] = (bool) ($nextWeekStatusMap[(int) $uid] ?? false);
        }

        return $rows;
    }

    /**
     * Dispatch sync jobs once per date range per admin/session in one hour.
     *
     * @param  Collection<int, User>  $users
     */
    private function autoDispatchRangeSyncIfNeeded(Request $request, User $currentUser, Collection $users, Carbon $start, Carbon $end): void
    {
        if (! $currentUser->can_manage_users) {
            return;
        }

        if ($users->isEmpty()) {
            return;
        }

        $sessionKey = $this->buildAutoSyncSessionKey(
            (int) $currentUser->id,
            $start->format('Y-m-d'),
            $end->format('Y-m-d')
        );

        $lastDispatchedAt = Session::get($sessionKey);
        if (is_string($lastDispatchedAt) && Carbon::parse($lastDispatchedAt)->addHour()->isFuture()) {
            return;
        }

        foreach ($users as $user) {
            SyncUserAvailabilityRangeJob::dispatch(
                userId: (int) $user->id,
                startDate: $start->format('Y-m-d'),
                endDate: $end->format('Y-m-d')
            );
        }

        Session::put($sessionKey, now()->toIso8601String());

        Log::info('Auto-dispatched When I Work stats sync jobs', [
            'admin_user_id' => $currentUser->id,
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),
            'queued_users' => $users->count(),
            'session_key' => $sessionKey,
        ]);
    }

    private function buildAutoSyncSessionKey(int $adminUserId, string $startDate, string $endDate): string
    {
        return "admin_stats_auto_sync_{$adminUserId}_{$startDate}_{$endDate}";
    }
}
