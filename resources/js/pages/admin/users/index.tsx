import React from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { show, edit, destroy, create } from '@/actions/App/Http/Controllers/Admin/UserController';
import { Pencil, Trash2, Eye } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { DataTable } from '@/components/ui/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { PaginationData, ColumnConfig, ActionConfig } from '@/types/data-table.types';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types/index';
import { Button } from '@/components/ui/button';

interface Props {
  users: User[];
  pagination: PaginationData;
  offset: number;
  filters: Record<string, string | number>;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function UsersIndex({
  users,
  pagination,
  offset,
  filters,
  search,
  sortBy,
  sortOrder,
}: Props) {
  const {
    isLoading,
    handleSearch,
    handleFilterChange,
    handleSort,
    handlePerPageChange,
    handlePageChange,
  } = useDataTable();

  const columns: ColumnConfig<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (user) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {user.name}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user) => (
        <div className="text-gray-600 dark:text-gray-400">
          {user.email}
        </div>
      ),
    },
    {
        key: 'is_admin',
        label: 'Is Admin',
        sortable: false,
        render: (user) => (
            <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                {user.is_admin ? 'Yes' : 'No'}
            </Badge>
        ),
    },
    {
      key: 'created_at',
      label: 'Joined Date',
      sortable: true,
      render: (user) => (
        <div className="text-gray-600 dark:text-gray-400">
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const actions: ActionConfig<User>[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (user) => {
        router.visit(show.url(user.id));
      },
    },
    {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (user) => {
        router.visit(edit.url(user.id));
      },
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (user) => {
        if (confirm(`Are you sure you want to delete ${user.name}?`)) {
          router.delete(destroy.url(user.id));
        }
      },
      variant: 'destructive',
    },
  ];

  return (
    <AdminLayout activeSlug="admin-users">
      <Head title="Users" />

      <div className="flex justify-end mb-6">
        <Link href={create.url()}>
          <Button>Create User</Button>
        </Link>
      </div>

      <div className="mx-auto">
        <DataTable
          data={users}
          columns={columns}
          pagination={pagination}
          offset={offset}
          showNumbering={true}
          actions={actions}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onPerPageChange={handlePerPageChange}
          onPageChange={handlePageChange}
          searchValue={search}
          filterValues={filters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          isLoading={isLoading}
          emptyMessage="No users found"
          searchPlaceholder="Search users by name, email..."
        />
      </div>
    </AdminLayout>
  );
}