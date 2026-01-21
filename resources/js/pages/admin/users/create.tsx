import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { store, index } from '@/actions/App/Http/Controllers/Admin/UserController';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateUser() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    is_admin: false,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post(store.url());
  }

  return (
    <AdminLayout>
      <Head title="Create User" />

      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
              />
              {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
              />
              {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                required
              />
              {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password_confirmation">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_admin"
                checked={data.is_admin}
                onCheckedChange={(checked) => setData('is_admin', !!checked)}
              />
              <Label htmlFor="is_admin">Is Admin?</Label>
            </div>
            {errors.is_admin && <div className="text-red-500 text-sm">{errors.is_admin}</div>}

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={processing}>
                {processing ? 'Creating...' : 'Create User'}
              </Button>
              <Link href={index.url()}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
