import { ChevronUp, ChevronDown, Search, X, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DataTableProps } from '@/types/data-table.types';

export function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    pagination,
    offset = 0,
    showNumbering = true,
    numberingKey,
    filters = [],
    actions = [],
    onSearch,
    onFilterChange,
    onSort,
    onPerPageChange,
    onPageChange,
    searchValue = '',
    filterValues = {},
    sortBy = '',
    sortOrder = 'asc',
    isLoading = false,
    emptyMessage = 'No data available',
    searchPlaceholder = 'Search...',
}: DataTableProps<T>) {
    const [localSearch, setLocalSearch] = useState(searchValue);
    const [localFilters, setLocalFilters] = useState(filterValues);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== searchValue) {
                onSearch?.(localSearch);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localSearch, searchValue, onSearch]);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const clearFilter = (key: string) => {
        const newFilters = { ...localFilters };
        delete newFilters[key];
        setLocalFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const handleSort = (columnKey: string) => {
        const column = columns.find(col => col.key === columnKey);
        if (!column?.sortable) return;

        const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
        if (onSort) {
            onSort(columnKey, newSortOrder);
        }
    };

    const renderNumbering = (index: number, item: T) => {
        if (!showNumbering) return null;

        if (numberingKey && item[numberingKey] !== undefined) {
            return <td className="datatable-cell datatable-cell-number">{item[numberingKey] as React.ReactNode}</td>;
        }

        return <td className="datatable-cell datatable-cell-number">{offset + index + 1}</td>;
    };

    const renderPagination = () => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisible / 2));
        const endPage = Math.min(pagination.last_page, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pages.push(
                <Button
                    key={1}
                    onClick={() => onPageChange && onPageChange(1)}
                    variant="outline"
                    size="sm"
                    className="datatable-pagination-number"
                >
                    1
                </Button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="dots-start" className="datatable-pagination-dots">
                        ...
                    </span>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    onClick={() => onPageChange && onPageChange(i)}
                    variant={i === pagination.current_page ? 'default' : 'outline'}
                    size="sm"
                    className="datatable-pagination-number"
                >
                    {i}
                </Button>
            );
        }

        if (endPage < pagination.last_page) {
            if (endPage < pagination.last_page - 1) {
                pages.push(
                    <span key="dots-end" className="datatable-pagination-dots">
                        ...
                    </span>
                );
            }
            pages.push(
                <Button
                    key={pagination.last_page}
                    onClick={() => onPageChange && onPageChange(pagination.last_page)}
                    variant="outline"
                    size="sm"
                    className="datatable-pagination-number"
                >
                    {pagination.last_page}
                </Button>
            );
        }

        return pages;
    };

    return (
        <div className="datatable-container">
            {/* Header Section */}
            <div className="datatable-header">
                <div className="datatable-header-left">
                    {/* Search */}
                    <div className="datatable-search-wrapper">
                        <Search className="datatable-search-icon" />
                        <Input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="datatable-search-input"
                        />
                        {localSearch && (
                            <button
                                onClick={() => setLocalSearch('')}
                                className="datatable-search-clear"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    {filters.length > 0 && (
                        <div className="datatable-filters">
                            {filters.map((filter) => (
                                <div key={filter.key} className="datatable-filter-item">
                                    <Select
                                        value={String(localFilters[filter.key] || '')}
                                        onValueChange={(value) => handleFilterChange(filter.key, value)}
                                    >
                                        <SelectTrigger className="datatable-select">
                                            <SelectValue placeholder={filter.placeholder || filter.label} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filter.options.map((option) => (
                                                <SelectItem key={option.value} value={String(option.value)}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {localFilters[filter.key] ? (
                                        <button
                                            onClick={() => clearFilter(filter.key)}
                                            className="datatable-filter-clear"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Per Page */}
                <div className="datatable-perpage">
                    <span className="datatable-perpage-label">Show</span>
                    <Select
                        value={String(pagination.per_page)}
                        onValueChange={(value) => onPerPageChange && onPerPageChange(Number(value))}
                    >
                        <SelectTrigger className="datatable-select-small">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 15, 30, 50, 100].map((value) => (
                                <SelectItem key={value} value={String(value)}>
                                    {value}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="datatable-wrapper">
                <table className="datatable">
                    <thead className="datatable-thead">
                        <tr>
                            {showNumbering && (
                                <th className="datatable-th datatable-th-number">#</th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`datatable-th ${column.sortable ? 'datatable-th-sortable' : ''} ${column.className || ''}`}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="datatable-th-content">
                                        <span>{column.label}</span>
                                        {column.sortable && (
                                            <div className="datatable-sort-icons">
                                                <ChevronUp
                                                    className={`datatable-sort-icon ${sortBy === column.key && sortOrder === 'asc'
                                                        ? 'datatable-sort-icon-active'
                                                        : ''
                                                        }`}
                                                />
                                                <ChevronDown
                                                    className={`datatable-sort-icon ${sortBy === column.key && sortOrder === 'desc'
                                                        ? 'datatable-sort-icon-active'
                                                        : ''
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions.length > 0 && (
                                <th className="datatable-th datatable-th-actions">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="datatable-tbody">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (showNumbering ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                                    className="datatable-cell-center"
                                >
                                    <div className="datatable-loading">
                                        <div className="datatable-spinner"></div>
                                        <span>Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (showNumbering ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                                    className="datatable-cell-center"
                                >
                                    <div className="datatable-empty">
                                        <svg
                                            className="datatable-empty-icon"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                            />
                                        </svg>
                                        <p>{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr key={index} className="datatable-row">
                                    {renderNumbering(index, item)}
                                    {columns.map((column) => (
                                        <td key={column.key} className={`datatable-cell ${column.className || ''}`}>
                                            {column.render
                                                ? column.render(item, index)
                                                : (item[column.key] as React.ReactNode)}
                                        </td>
                                    ))}
                                    {actions.length > 0 && (
                                        <td className="datatable-cell datatable-cell-actions">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="datatable-actions-trigger"
                                                    >
                                                        <Settings className="datatable-actions-icon" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="datatable-actions-menu">
                                                    {actions.map((action, actionIndex) => {
                                                        const shouldShow = action.show ? action.show(item) : true;
                                                        if (!shouldShow) return null;

                                                        const label = typeof action.label === 'function' ? action.label(item) : action.label;
                                                        const icon = typeof action.icon === 'function' ? action.icon(item) : action.icon;

                                                        return (
                                                            <React.Fragment key={actionIndex}>
                                                                <DropdownMenuItem
                                                                    onClick={() => action.onClick(item, index)}
                                                                    className={`datatable-action-item ${action.variant === 'destructive' ? 'datatable-action-item-destructive' : ''}`}
                                                                >
                                                                    {icon && <span className="datatable-action-icon">{icon}</span>}
                                                                    <span>{label}</span>
                                                                </DropdownMenuItem>
                                                                {actionIndex < actions.length - 1 && action.variant === 'destructive' && (
                                                                    <DropdownMenuSeparator />
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="datatable-footer">
                <div className="datatable-info">
                    Showing <span className="datatable-info-highlight">{pagination.from || 0}</span> to{' '}
                    <span className="datatable-info-highlight">{pagination.to || 0}</span> of{' '}
                    <span className="datatable-info-highlight">{pagination.total}</span> entries
                </div>
                <div className="datatable-pagination">
                    <Button
                        onClick={() => onPageChange && onPageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        variant="outline"
                        size="sm"
                        className="datatable-pagination-nav"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="datatable-pagination-nav-text">Previous</span>
                    </Button>
                    <div className="datatable-pagination-numbers">
                        {renderPagination()}
                    </div>
                    <Button
                        onClick={() => onPageChange && onPageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        variant="outline"
                        size="sm"
                        className="datatable-pagination-nav"
                    >
                        <span className="datatable-pagination-nav-text">Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}