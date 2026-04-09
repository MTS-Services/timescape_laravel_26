<?php

namespace App\Services;

use App\Models\Availability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class WhenIWorkAvailabilitySyncService
{
    public function __construct(
        private WhenIWorkAvailabilityService $wiwService
    ) {}

    /**
     * Sync fetched When I Work events to local database.
     *
     * Rules:
     * - Past/current: insert only (skip updates)
     * - Future: upsert, but skip records updated very recently (race protection)
     *
     * @return array{created:int,updated:int,unchanged:int,skipped:int}
     */
    public function syncEventsToLocal(User $user, array $events): array
    {
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $unchanged = 0;

        $recentUpdateThreshold = Carbon::now()->subSeconds(30);

        foreach ($events as $event) {
            $localData = $this->wiwService->mapEventToLocal($event, $user->timezone_name);
            $date = $localData['availability_date'];
            $category = $this->wiwService->categorizeDate($date);

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

                continue;
            }

            // future
            if ($existingRecord) {
                if ($existingRecord->updated_at && $existingRecord->updated_at->gt($recentUpdateThreshold)) {
                    Log::debug('WhenIWorkAvailabilitySyncService: Skipping recently updated record', [
                        'user_id' => $user->id,
                        'date' => $date,
                        'updated_at' => $existingRecord->updated_at->toIso8601String(),
                    ]);
                    $skipped++;
                    continue;
                }

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

        return [
            'created' => $created,
            'updated' => $updated,
            'unchanged' => $unchanged,
            'skipped' => $skipped,
        ];
    }
}

