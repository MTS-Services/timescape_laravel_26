<?php

namespace App\Jobs;

use App\Models\Availability;
use App\Models\User;
use App\Services\WhenIWorkAvailabilityService;
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

    public function handle(WhenIWorkAvailabilityService $wiwService): void
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
            $this->syncMonth($user, $wiwService, $token, $this->year, $this->month);
        } else {
            $this->syncFullRange($user, $wiwService, $token);
        }
    }

    /**
     * Sync a full date range (for login sync mode)
     */
    protected function syncFullRange(User $user, WhenIWorkAvailabilityService $wiwService, string $token): void
    {
        $startDate = Carbon::now()->subMonths(1)->startOfMonth()->format('Y-m-d');
        $endDate = Carbon::now()->addMonths(3)->endOfMonth()->format('Y-m-d');

        Log::info('SyncUserAvailabilityJob: Starting full sync', [
            'user_id' => $user->id,
            'wheniwork_id' => $user->wheniwork_id,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        $events = $wiwService->fetchUserAvailabilities($user->wheniwork_id, $startDate, $endDate, $token);

        $this->processEvents($user, $events, $wiwService);
    }

    /**
     * Sync a specific month (for periodic sync mode)
     */
    protected function syncMonth(User $user, WhenIWorkAvailabilityService $wiwService, string $token, int $year, int $month): void
    {
        $startDate = Carbon::create($year, $month, 1)->startOfMonth()->format('Y-m-d');
        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');

        Log::info('SyncUserAvailabilityJob: Starting month sync', [
            'user_id' => $user->id,
            'wheniwork_id' => $user->wheniwork_id,
            'year' => $year,
            'month' => $month,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        $events = $wiwService->fetchUserAvailabilities($user->wheniwork_id, $startDate, $endDate, $token);

        $this->processEvents($user, $events, $wiwService);
    }

    /**
     * Process fetched events and sync to local database
     *
     * CRITICAL: Avoid race conditions with manual updates:
     * - Skip records updated in the last 30 seconds (likely manual update in progress)
     * - Only update if data actually changed
     * - Pass user timezone for correct time slot extraction
     */
    protected function processEvents(User $user, array $events, WhenIWorkAvailabilityService $wiwService): void
    {
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $unchanged = 0;

        // Grace period: skip records updated very recently to avoid race conditions
        $recentUpdateThreshold = Carbon::now()->subSeconds(30);

        foreach ($events as $event) {
            // Pass user timezone for correct time slot extraction
            $localData = $wiwService->mapEventToLocal($event, $user->timezone_name);
            $date = $localData['availability_date'];
            $category = $wiwService->categorizeDate($date);

            $existingRecord = Availability::where('user_id', $user->id)
                ->where('availability_date', $date)
                ->first();

            if ($category === 'past' || $category === 'current') {
                if ($existingRecord) {
                    $skipped++;

                    continue;
                }

                Availability::create([
                    'user_id' => $user->id,
                    'wheniwork_availability_id' => $localData['wheniwork_availability_id'],
                    'availability_date' => $localData['availability_date'],
                    'time_slot' => $localData['time_slot'],
                    'status' => $localData['status'],
                    'notes' => $localData['notes'],
                ]);
                $created++;
            } elseif ($category === 'future') {
                if ($existingRecord) {
                    // Skip if record was updated very recently (avoid race condition)
                    if ($existingRecord->updated_at && $existingRecord->updated_at->gt($recentUpdateThreshold)) {
                        Log::debug('SyncUserAvailabilityJob: Skipping recently updated record', [
                            'date' => $date,
                            'updated_at' => $existingRecord->updated_at->toIso8601String(),
                        ]);
                        $skipped++;

                        continue;
                    }

                    // Only update if data actually changed
                    $hasChanges = $existingRecord->time_slot !== $localData['time_slot']
                        || $existingRecord->wheniwork_availability_id !== $localData['wheniwork_availability_id'];

                    if ($hasChanges) {
                        $existingRecord->update([
                            'wheniwork_availability_id' => $localData['wheniwork_availability_id'],
                            'time_slot' => $localData['time_slot'],
                            'status' => $localData['status'],
                            'notes' => $localData['notes'],
                        ]);
                        $updated++;
                    } else {
                        $unchanged++;
                    }
                } else {
                    Availability::create([
                        'user_id' => $user->id,
                        'wheniwork_availability_id' => $localData['wheniwork_availability_id'],
                        'availability_date' => $localData['availability_date'],
                        'time_slot' => $localData['time_slot'],
                        'status' => $localData['status'],
                        'notes' => $localData['notes'],
                    ]);
                    $created++;
                }
            }
        }

        Log::info('SyncUserAvailabilityJob: Sync completed', [
            'user_id' => $user->id,
            'events_fetched' => count($events),
            'created' => $created,
            'updated' => $updated,
            'unchanged' => $unchanged,
            'skipped' => $skipped,
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
