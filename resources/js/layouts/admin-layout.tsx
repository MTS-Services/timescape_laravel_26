import React, { useEffect } from 'react';

import { useAppearance } from '@/hooks/use-appearance';
import { AdminHeader } from '@/layouts/partials/admin/header';

import { AdminFooter } from './partials/admin/footer';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {

    const { appearance, updateAppearance } = useAppearance();
    useEffect(() => {
        if (appearance !== 'light') {
            updateAppearance('light');
        }
    }, [appearance, updateAppearance]);

    return (
        <div className="flex min-h-screen flex-col">
            {/* <AdminHeader /> */}
            <main className="flex-1 flex flex-col">{children}</main>
            {/* <AdminFooter /> */}
        </div>
    );
}
