import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Menu } from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useResponsiveMode } from '@/hooks/use-responsive-mode';
import { dashboard, logout } from '@/routes';
import { stats } from '@/routes/admin';
import { type SharedData } from '@/types';

export function AdminHeader() {
    const { auth } = usePage<SharedData>().props;
    const cleanup = useMobileNavigation();
    const isMobile = useResponsiveMode({ isAdmin: auth.user.can_manage_users });

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <header className="container mx-auto flex items-center justify-between px-4 py-2 lg:py-4">
            <Link href={dashboard()} className="flex items-center gap-2">
                <AppLogo isMobile={isMobile} />
            </Link>
            {auth.user.can_manage_users && (
                <Link href={stats()}>
                    <Button variant="link" className="cursor-pointer">
                        Records
                    </Button>
                </Link>
            )}
            <div className="hidden items-center gap-4 md:flex">
                <div className="flex w-full min-w-32 items-center justify-end gap-2">
                    <UserInfo user={auth.user} showRole={true} />
                </div>
                <Link
                    className="flex w-full cursor-pointer items-center gap-1 font-open-sans"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut />
                    Sign Out
                </Link>
            </div>
            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="relative h-9 w-9 rounded-md ring-offset-background transition-all hover:ring-2 hover:ring-ring"
                        >
                            <Menu className="size-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-64 border-none p-2 shadow-sm"
                        align="end"
                        sideOffset={8}
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
