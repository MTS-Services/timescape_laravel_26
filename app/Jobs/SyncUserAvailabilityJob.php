<?php

namespace App\Jobs;

use App\Models\Availability;
use App\Models\User;
use App\Services\WhenIWorkAvailabilityService;
use App\Services\WhenIWorkAvailabilitySyncService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncUserAvailabilityJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        protected int $userId,
        protected ?string $token = null,
        protected ?int $year = null,
        protected ?int $month = null
    ) {}

    public function handle(WhenIWorkAvailabilityService $wiwService, WhenIWorkAvailabilitySyncService $syncService): void
    {
        $user = User::find($this->userId);

        if (! $user || ! $user->wheniwork_id) {
            Log::warning('SyncUserAvailabilityJob: User not found or missing wheniwork_id', [
                'user_id' => $this->userId,
            ]);

            return;
        }

        $token = $this->token ?? $user->wheniwork_token;

        if (! $token) {
            Log::warning('SyncUserAvailabilityJob: No token available for user', [
                'user_id' => $this->userId,
            ]);

            return;
        }

        $syncMode = config('availability.sync_mode', 'login');

        if ($syncMode === 'periodic' && $this->year && $this->month) {
            $this->syncMonth($user, $wiwService, $syncService, $token, $this->year, $this->month);
        } else {
            $this->syncFullRange($user, $wiwService, $syncService, $token);
        }
    }

    /**
     * Sync current calendar year (for login sync mode).
     * When I Work API only supports up to 45 days per request, so we call the API once per month:
     * 12 API calls = Jan through Dec of current year.
     */
    protected function syncFullRange(User $user, WhenIWorkAvailabilityService $wiwService, WhenIWorkAvailabilitySyncService $syncService, string $token): void
    {
        $rangeStart = Carbon::now()->startOfYear();
        $rangeEnd = Carbon::now()->endOfYear();

        Log::info('SyncUserAvailabilityJob: Starting current-year sync (12 months, 12 API calls)', [
            'user_id' => $user->id,
            'wheniwork_id' => $user->wheniwork_id,
            'start_date' => $rangeStart->format('Y-m-d'),
            'end_date' => $rangeEnd->format('Y-m-d'),
            'year' => $rangeStart->year,
        ]);

        $current = $rangeStart->copy();
        $chunkIndex = 0;
        $totals = ['created' => 0, 'updated' => 0, 'unchanged' => 0, 'skipped' => 0];

        while ($current->lte($rangeEnd)) {
            $chunkStart = $current->format('Y-m-d');
            $chunkEnd = $current->copy()->addMonth()->startOfMonth()->format('Y-m-d');
            $chunkIndex++;

            Log::info('SyncUserAvailabilityJob: API call', [
                'user_id' => $user->id,
                'chunk' => $chunkIndex,
                'of' => 12,
                'start' => $chunkStart,
                'end' => $chunkEnd,
            ]);

            $events = $wiwService->fetchUserAvailabilities($user->wheniwork_id, $chunkStart, $chunkEnd, $token);
            $counts = $syncService->syncEventsToLocal($user, $events);
            foreach ($counts as $k => $v) {
                $totals[$k] += (int) $v;
            }

            $current->addMonth();
        }

        Log::info('SyncUserAvailabilityJob: Current-year sync completed', [
            'user_id' => $user->id,
            'api_calls' => $chunkIndex,
            ...$totals,
        ]);
    }

    /**
     * Sync a specific month (for periodic sync mode)
     */
    protected function syncMonth(User $user, WhenIWorkAvailabilityService $wiwService, WhenIWorkAvailabilitySyncService $syncService, string $token, int $year, int $month): void
    {
        $startDate = Carbon::create($year, $month, 1)->startOfMonth()->format('Y-m-d');
        $endDate = Carbon::create($year, $month, 1)->addMonth()->startOfMonth()->format('Y-m-d');

        Log::info('SyncUserAvailabilityJob: Starting month sync', [
            'user_id' => $user->id,
            'wheniwork_id' => $user->wheniwork_id,
            'year' => $year,
            'month' => $month,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        $events = $wiwService->fetchUserAvailabilities($user->wheniwork_id, $startDate, $endDate, $token);

        $counts = $syncService->syncEventsToLocal($user, $events);
        Log::info('SyncUserAvailabilityJob: Sync completed (month)', [
            'user_id' => $user->id,
            'events_fetched' => count($events),
            ...$counts,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SyncUserAvailabilityJob failed', [
            'user_id' => $this->userId,
            'message' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
