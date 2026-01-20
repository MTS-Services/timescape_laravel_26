import { UserSidebar } from '@/layouts/partials/user/sidebar';
import { UserHeader } from '@/layouts/partials/user/header';
import { UserFooter } from '@/layouts/partials/user/footer';
import * as React from 'react';
import { type ReactNode } from 'react';
import { type BreadcrumbItem } from '@/types';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ breadcrumbs, children }: AppLayoutProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div className="flex min-h-screen">
            <UserSidebar isCollapsed={isCollapsed} />
            <div className="flex flex-1 flex-col">
                <UserHeader isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                <main className="flex-1 p-6">{children}</main>
                <UserFooter />
            </div>
        </div>
    );
}