<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'selections' => ['required', 'array'],
            'selections.*' => ['nullable', 'string', 'in:9:30-4:30,3:30-10:30,all-day,holiday'],
            'year' => ['sometimes', 'integer', 'between:2020,2030'],
            'month' => ['sometimes', 'integer', 'between:1,12'],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $this->validateDatePermissions($validator);
            },
        ];
    }

    protected function validateDatePermissions(Validator $validator): void
    {
        $selections = $this->input('selections', []);
        $today = Carbon::now()->startOfDay();
        $canEditToday = config('availability.can_edit_today', false);

        foreach ($selections as $date => $timeSlot) {
            $dateCarbon = Carbon::createFromFormat('Y-m-d', $date)?->startOfDay();

            if (! $dateCarbon) {
                $validator->errors()->add(
                    "selections.{$date}",
                    "Invalid date format: {$date}"
                );

                continue;
            }

            if ($dateCarbon->lt($today)) {
                $validator->errors()->add(
                    "selections.{$date}",
                    "Cannot modify availability for past date: {$date}"
                );
            }

            if ($dateCarbon->eq($today) && ! $canEditToday) {
                $validator->errors()->add(
                    "selections.{$date}",
                    "Cannot modify availability for current date. Editing today's availability is disabled."
                );
            }
        }
    }

    public function messages(): array
    {
        return [
            'selections.required' => 'Please select at least one availability slot.',
            'selections.*.in' => 'Invalid time slot selected.',
        ];
    }
}
