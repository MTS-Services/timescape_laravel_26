export interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ColumnConfig<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

export interface ActionConfig<T = unknown> {
  label: string | ((item: T) => string);
  icon?: React.ReactNode | ((item: T) => React.ReactNode);
  onClick: (item: T, index: number) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  show?: (item: T) => boolean;
  className?: string;
}

export interface DataTableProps<T = unknown> {
  data: T[];
  columns: ColumnConfig<T>[];
  pagination: PaginationData;
  offset?: number;
  showNumbering?: boolean;
  numberingKey?: keyof T;
  filters?: FilterConfig[];
  actions?: ActionConfig<T>[];
  onSearch?: (search: string) => void;
  onFilterChange?: (filters: Record<string, unknown>) => void;
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onPerPageChange?: (perPage: number) => void;
  onPageChange?: (page: number) => void;
  searchValue?: string;
  filterValues?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isLoading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
}