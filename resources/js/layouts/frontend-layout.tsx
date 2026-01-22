import * as React from 'react';

import { FrontendFooter } from '@/layouts/partials/frontend/footer';
import { FrontendHeader } from '@/layouts/partials/frontend/header';

interface FrontendLayoutProps {
    children: React.ReactNode;
}

export default function FrontendLayout({ children }: FrontendLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <FrontendHeader />
            <main className="flex-1 flex flex-col">{children}</main>
            <FrontendFooter />
        </div>
    );
}