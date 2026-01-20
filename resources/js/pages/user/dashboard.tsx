import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Dashboard',
        href: route('user.dashboard'),
    },
];

export default function Dashboard() {
    return (
        <AppLayout>
            <Head title="User Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h1 className="text-2xl font-bold">Welcome to your dashboard!</h1>
            </div>
        </AppLayout>
    );
}
