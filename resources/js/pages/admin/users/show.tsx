import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { index, edit } from '@/actions/App/Http/Controllers/Admin/UserController';
import AdminLayout from '@/layouts/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types/index';

interface Props {
  user: User;
}

export default function ShowUser({ user }: Props) {
  return (
    <AdminLayout>
      <Head title={`User: ${user.name}`} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Details</CardTitle>
          <Link href={index.url()}>
            <Button variant="outline">Back to Users</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-1">
            <span className="font-semibold">ID</span>
            <span>{user.id}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-semibold">Name</span>
            <span>{user.name}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-semibold">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-semibold">Is Admin</span>
            <Badge variant={user.is_admin ? 'default' : 'secondary'}>
              {user.is_admin ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-semibold">Created At</span>
            <span>{new Date(user.created_at).toLocaleString()}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-semibold">Updated At</span>
            <span>{new Date(user.updated_at).toLocaleString()}</span>
          </div>

          <div className="flex gap-2 mt-6">
            <Link href={edit.url(user.id)}>
              <Button>Edit</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
