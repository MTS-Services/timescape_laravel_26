<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait DataTableTrait
{
    /**
     * Apply DataTable filters, search, sorting, and pagination
     */
    public function applyDataTableFilters(
        Builder $query,
        Request $request,
        array $searchableColumns = [],
        array $filterableColumns = [],
        array $sortableColumns = []
    ): array {
        // Apply search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($searchableColumns, $search) {
                foreach ($searchableColumns as $column) {
                    if (str_contains($column, '.')) {
                        // Relationship search
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

        // Apply filters
        if ($request->filled('filters')) {
            $filters = $request->input('filters');
            foreach ($filters as $key => $value) {
                if (in_array($key, $filterableColumns) && ! empty($value)) {
                    if (str_contains($key, '.')) {
                        // Relationship filter
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

        // Apply sorting
        if ($request->filled('sort_by') && $request->filled('sort_order')) {
            $sortBy = $request->input('sort_by');
            $sortOrder = $request->input('sort_order', 'asc');

            if (in_array($sortBy, $sortableColumns)) {
                if (str_contains($sortBy, '.')) {
                    // Relationship sorting
                    [$relation, $relationColumn] = explode('.', $sortBy);
                    $query->with($relation)->orderBy(
                        $this->getRelationshipQuery($relation, $relationColumn),
                        $sortOrder
                    );
                } else {
                    $query->orderBy($sortBy, $sortOrder);
                }
            }
        }

        // Get pagination parameters
        $perPage = $request->input('per_page', 15);
        $currentPage = $request->input('page', 1);

        // Calculate offset for numbering
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
        ];
    }

    /**
     * Get relationship query for sorting
     */
    private function getRelationshipQuery($relation, $column)
    {
        $relationInstance = $this->$relation();
        $relatedTable = $relationInstance->getRelated()->getTable();

        return $relationInstance->getRelated()
            ->select($column)
            ->whereColumn(
                $relationInstance->getQualifiedForeignKeyName(),
                $relationInstance->getQualifiedParentKeyName()
            )
            ->limit(1);
    }
}
