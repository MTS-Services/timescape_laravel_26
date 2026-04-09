<?php

namespace App\Jobs;

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

class SyncUserAvailabilityRangeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        public int $userId,
        public string $startDate,
        public string $endDate,
        public ?string $token = null,
    ) {}

    public function handle(WhenIWorkAvailabilityService $wiwService, WhenIWorkAvailabilitySyncService $syncService): void
    {
        $user = User::find($this->userId);

        if (! $user || ! $user->wheniwork_id) {
            Log::warning('SyncUserAvailabilityRangeJob: User not found or missing wheniwork_id', [
                'user_id' => $this->userId,
            ]);
            return;
        }

        $token = $this->token ?? $user->wheniwork_token;
        if (! $token) {
            Log::warning('SyncUserAvailabilityRangeJob: No token available for user', [
                'user_id' => $this->userId,
            ]);
            return;
        }

        $start = Carbon::parse($this->startDate)->startOfDay();
        $endInclusive = Carbon::parse($this->endDate)->startOfDay();
        $endExclusive = $endInclusive->copy()->addDay(); // align with existing month sync behavior (end is exclusive)

        $rangeDays = $start->diffInDays($endExclusive);

        Log::info('SyncUserAvailabilityRangeJob: Starting range sync', [
            'user_id' => $user->id,
            'wheniwork_id' => $user->wheniwork_id,
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $endInclusive->format('Y-m-d'),
            'range_days' => $rangeDays,
        ]);

        $chunkDays = $rangeDays <= 45 ? $rangeDays : 30;

        $current = $start->copy();
        $chunkIndex = 0;
        $totals = ['created' => 0, 'updated' => 0, 'unchanged' => 0, 'skipped' => 0];

        while ($current->lt($endExclusive)) {
            $chunkIndex++;
            $chunkStart = $current->copy();
            $chunkEnd = $current->copy()->addDays($chunkDays);
            if ($chunkEnd->gt($endExclusive)) {
                $chunkEnd = $endExclusive->copy();
            }

            Log::info('SyncUserAvailabilityRangeJob: API call', [
                'user_id' => $user->id,
                'chunk' => $chunkIndex,
                'start' => $chunkStart->format('Y-m-d'),
                'end' => $chunkEnd->format('Y-m-d'),
                'chunk_days' => $chunkStart->diffInDays($chunkEnd),
            ]);

            $events = $wiwService->fetchUserAvailabilities(
                $user->wheniwork_id,
                $chunkStart->format('Y-m-d'),
                $chunkEnd->format('Y-m-d'),
                $token
            );

            $counts = $syncService->syncEventsToLocal($user, $events);
            foreach ($counts as $k => $v) {
                $totals[$k] += (int) $v;
            }

            $current = $chunkEnd->copy();
        }

        Log::info('SyncUserAvailabilityRangeJob: Range sync completed', [
            'user_id' => $user->id,
            'api_calls' => $chunkIndex,
            ...$totals,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SyncUserAvailabilityRangeJob failed', [
            'user_id' => $this->userId,
            'message' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}

