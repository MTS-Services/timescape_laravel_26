<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class DataTableService
{
    /**
     * Process DataTable request
     */
    public function process(Builder $query, Request $request, array $config): array
    {
        $searchableColumns = $config['searchable'] ?? [];
        $filterableColumns = $config['filterable'] ?? [];
        $sortableColumns = $config['sortable'] ?? [];

        // Apply search
        if ($request->filled('search')) {
            $this->applySearch($query, $request->input('search'), $searchableColumns);
        }

        // Apply filters
        if ($request->filled('filters')) {
            $this->applyFilters($query, $request->input('filters'), $filterableColumns);
        }

        // Apply sorting
        if ($request->filled('sort_by') && in_array($request->input('sort_by'), $sortableColumns)) {
            $this->applySorting($query, $request->input('sort_by'), $request->input('sort_order', 'asc'));
        }

        // Get pagination parameters
        $perPage = $request->input('per_page', 15);
        $currentPage = $request->input('page', 1);
        $offset = ($currentPage - 1) * $perPage;

        // Paginate
        $data = $query->paginate($perPage)->withQueryString();

        return [
            'data' => $data->items(),
            'pagination' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem(),
            ],
            'offset' => $offset,
            'filters' => $request->input('filters', []),
            'search' => $request->input('search', ''),
            'sort_by' => $request->input('sort_by', ''),
            'sort_order' => $request->input('sort_order', 'asc'),
        ];
    }

    /**
     * Apply search to query
     */
    private function applySearch(Builder $query, string $search, array $columns): void
    {
        $query->where(function ($q) use ($columns, $search) {
            foreach ($columns as $column) {
                if (str_contains($column, '.')) {
                    [$relation, $relationColumn] = explode('.', $column);
                    $q->orWhereHas($relation, function ($relationQuery) use ($relationColumn, $search) {
                        $relationQuery->where($relationColumn, 'like', "%{$search}%");
                    });
                } else {
                    $q->orWhere($column, 'like', "%{$search}%");
                }
            }
        });
    }

    /**
     * Apply filters to query
     */
    private function applyFilters(Builder $query, array $filters, array $filterableColumns): void
    {
        foreach ($filters as $key => $value) {
            if (in_array($key, $filterableColumns) && ! empty($value)) {
                if (str_contains($key, '.')) {
                    [$relation, $relationColumn] = explode('.', $key);
                    $query->whereHas($relation, function ($relationQuery) use ($relationColumn, $value) {
                        $relationQuery->where($relationColumn, $value);
                    });
                } else {
                    $query->where($key, $value);
                }
            }
        }
    }

    /**
     * Apply sorting to query
     */
    private function applySorting(Builder $query, string $sortBy, string $sortOrder): void
    {
        if (str_contains($sortBy, '.')) {
            [$relation, $relationColumn] = explode('.', $sortBy);
            $query->with($relation)->orderBy(
                function ($q) use ($relation, $relationColumn) {
                    return $q->from($relation)->select($relationColumn)->limit(1);
                },
                $sortOrder
            );
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }
    }
}
