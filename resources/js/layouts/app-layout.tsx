import * as React from 'react';
import { type ReactNode } from 'react';

import { Toaster } from "@/components/ui/sonner"
import { type BreadcrumbItem } from '@/types';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children }: AppLayoutProps) {

    return (
        <div className="flex min-h-screen">
            <main>{children}</main>
            <Toaster position="top-right" richColors />
            {/* <UserSidebar isCollapsed={isCollapsed} />
            <div className="flex flex-1 flex-col">
                <UserHeader isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                <main className="flex-1 p-6">{children}</main>
                <UserFooter />
            </div> */}
        </div>
    );
}