<?php

namespace App\Jobs;

use App\Services\WhenIWorkUserService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SyncWhenIWorkUsersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        protected int $userId,
        protected string $token
    ) {}

    public function handle(WhenIWorkUserService $userService): void
    {
        Log::info('SyncWhenIWorkUsersJob: Starting user sync', [
            'triggered_by_user_id' => $this->userId,
        ]);

        $result = $userService->syncAllUsers($this->token);

        if (! $result['success']) {
            Log::error('SyncWhenIWorkUsersJob: Sync completed with errors', [
                'created' => $result['created'],
                'updated' => $result['updated'],
                'failed' => $result['failed'],
                'errors' => $result['errors'],
            ]);

            // Store error in cache for frontend to display
            Cache::put(
                "user_sync_error_{$this->userId}",
                [
                    'message' => 'Failed to sync some users from When I Work',
                    'details' => $result['errors'],
                    'created' => $result['created'],
                    'updated' => $result['updated'],
                    'failed' => $result['failed'],
                ],
                now()->addMinutes(5)
            );

            return;
        }

        Log::info('SyncWhenIWorkUsersJob: Sync completed successfully', [
            'created' => $result['created'],
            'updated' => $result['updated'],
        ]);

        // Store success in cache for frontend to display
        Cache::put(
            "user_sync_success_{$this->userId}",
            [
                'message' => 'Users synced successfully from When I Work',
                'created' => $result['created'],
                'updated' => $result['updated'],
            ],
            now()->addMinutes(5)
        );
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SyncWhenIWorkUsersJob: Job failed completely', [
            'user_id' => $this->userId,
            'message' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Store error in cache for frontend to display
        Cache::put(
            "user_sync_error_{$this->userId}",
            [
                'message' => 'Failed to sync users: '.$exception->getMessage(),
                'details' => [],
            ],
            now()->addMinutes(5)
        );
    }
}
