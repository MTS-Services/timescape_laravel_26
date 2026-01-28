import * as React from 'react';

import { AdminHeader } from '@/layouts/partials/admin/header';

import { AdminFooter } from './partials/admin/footer';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <AdminHeader />
            <main className="flex-1 flex flex-col">{children}</main>
            <AdminFooter />
        </div>
    );
}
