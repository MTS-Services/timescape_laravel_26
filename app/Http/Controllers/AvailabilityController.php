<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAvailabilityRequest;
use App\Services\AvailabilityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class AvailabilityController extends Controller
{
    public function __construct(
        private AvailabilityService $availabilityService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $now = now();
        $year = (int) $request->get('year', $now->year);
        $month = (int) $request->get('month', $now->month);

        Log::info('Loading availability page', [
            'user_id' => $user->id,
            'year' => $year,
            'month' => $month,
        ]);

        $availabilities = $this->availabilityService->getAvailabilitiesForMonth(
            $user->id,
            $year,
            $month
        );

        $requirements = $this->availabilityService->checkRequirements(
            $user->id,
            $year,
            $month
        );

        Log::info('Returning availability data', [
            'availabilities_count' => count($availabilities),
            'availabilities' => $availabilities,
            'requirements' => $requirements,
        ]);

        return Inertia::render('availability/index', [
            'initialSelections' => $availabilities,
            'requirements' => $requirements,
            'currentYear' => $year,
            'currentMonth' => $month,
        ]);
    }

    public function store(StoreAvailabilityRequest $request): RedirectResponse
    {
        $user = $request->user();

        Log::info('Storing availability', [
            'user_id' => $user->id,
            'selections' => $request->validated('selections'),
        ]);

        $this->availabilityService->saveAvailabilities(
            $user->id,
            $request->validated('selections')
        );

        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $requirements = $this->availabilityService->checkRequirements(
            $user->id,
            $year,
            $month
        );

        Log::info('Availability saved successfully', [
            'requirements' => $requirements,
        ]);

        return back()->with([
            'success' => 'Availability updated successfully!',
            'requirements' => $requirements,
        ]);
    }
}
