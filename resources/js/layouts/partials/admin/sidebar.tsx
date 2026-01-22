import { Link, usePage } from '@inertiajs/react';
import { Users, User, BarChart, Shield, LayoutGrid, Settings } from 'lucide-react';
import * as React from 'react';

import AppLogo from '@/components/app-logo';
import { NavItem as NavItemComponent} from '@/components/ui/nav-item';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
// Navigation configuration
const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        slug: 'dashboard',
    },
    {
        title: 'User Management',
        href: '#',
        icon: Users,
        badge: 42,
        children: [
            {
                title: 'Admins',
                href: '#',
                icon: Shield,
                permission: 'manage admins',
                children: [
                    { title: 'All Admins', href: '#' },
                    { title: 'Active', href: '#' },
                    {
                        title: 'Inactive',
                        href: '#',
                        children: [
                            { title: 'Recently Inactive', href: '#' },
                            { title: 'Long Inactive', href: '#' },
                            {
                                title: 'Archive',
                                href: '#',
                                children: [
                                    { title: 'Over 1 year', href: '#' },
                                    { title: 'Over 2 years', href: '#' },
                                ]
                            }
                        ]
                    },
                ],
            },
            {
                title: 'Users',
                href: '#',
                icon: User,
                children: [
                    {
                        title: 'All',
                        href: route('admin.users.index'),
                        icon: User,
                        slug: 'admin-users'
                    },
                    { title: 'Active', href: '#' },
                    { title: 'Premium', href: '#', badge: 15 },
                ],
            },
        ],
    },
    {
        title: 'Analytics',
        href: '#',
        icon: BarChart,
        permission: 'view analytics',
    },
    {
        title: 'Settings',
        href: '#',
        icon: Settings,
        badge: 3,
    },
    {
        title: 'Disabled Item',
        href: '#',
        icon: Shield,
        disabled: true,
    },
];

interface AdminSidebarProps {
    isCollapsed: boolean;
    activeSlug?: string | null;
}

export const AdminSidebar = React.memo<AdminSidebarProps>(({ isCollapsed, activeSlug }) => {
    const { url, props } = usePage();
    const currentRoute = url;

    // Extract permissions from auth props
    const userPermissions = React.useMemo(() => {
        const auth = props.auth as SharedData['auth'];
        return auth?.user?.permissions ||
               auth?.user?.all_permissions ||
               auth?.permissions ||
               [];
    }, [props.auth]);

    return (
        <aside
            className={cn(
                'relative hidden h-screen border-r bg-background',
                'transition-all duration-300 ease-in-out',
                'md:flex flex-col',
                isCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo Section */}
            <div className={cn(
                "flex h-16 items-center border-b",
                isCollapsed ? "justify-center px-2" : "px-6"
            )}>
                <Link
                    href="/"
                    className="flex items-center gap-2 transition-opacity hover:opacity-80"
                >
                    {isCollapsed ? (
                        <LayoutGrid className="h-6 w-6 text-primary" />
                    ) : (
                        <AppLogo />
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                <nav className="space-y-1">
                    {adminNavItems.map((item, index) => (
                        <NavItemComponent
                            key={`${item.title}-${index}`}
                            item={item}
                            isCollapsed={isCollapsed}
                            currentRoute={currentRoute}
                            isActive={activeSlug === item.slug}
                            permissions={userPermissions}
                        />
                    ))}
                </nav>
            </div>

            {/* Footer Section (Optional) */}
            {!isCollapsed && (
                <div className="border-t p-4">
                    <div className="text-xs text-muted-foreground text-center">
                        v1.0.0
                    </div>
                </div>
            )}
        </aside>
    );
});

AdminSidebar.displayName = 'AdminSidebar';