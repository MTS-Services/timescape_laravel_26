<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'selections.*' => ['nullable', 'string', 'in:9:30-4:30,3:30-10:30,all-day,holyday'],
            'year' => ['sometimes', 'integer', 'between:2020,2030'],
            'month' => ['sometimes', 'integer', 'between:1,12'],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'selections.required' => 'Please select at least one availability slot.',
            'selections.*.in' => 'Invalid time slot selected.',
        ];
    }
}
