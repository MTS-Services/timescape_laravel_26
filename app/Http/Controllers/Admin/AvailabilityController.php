<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAvailabilityRequest;
use App\Services\AvailabilityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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

        return Inertia::render('admin/availability/index', [
            'initialSelections' => $availabilities,
            'requirements' => $requirements,
            'currentYear' => $year,
            'currentMonth' => $month,
        ]);
    }

    public function store(StoreAvailabilityRequest $request): RedirectResponse
    {
        $user = $request->user();

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

        return back()->with([
            'success' => 'Availability updated successfully!',
            'requirements' => $requirements,
        ]);
    }

    public function getMonth(Request $request)
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'between:2020,2030'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);

        $user = $request->user();

        $availabilities = $this->availabilityService->getAvailabilitiesForMonth(
            $user->id,
            $validated['year'],
            $validated['month']
        );

        $requirements = $this->availabilityService->checkRequirements(
            $user->id,
            $validated['year'],
            $validated['month']
        );

        return response()->json([
            'availabilities' => $availabilities,
            'requirements' => $requirements,
        ]);
    }
}
