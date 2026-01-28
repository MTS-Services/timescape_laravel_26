import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Menu } from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { dashboard } from '@/routes';
import { type SharedData } from '@/types';


export function AdminHeader() {
    const { auth } = usePage<SharedData>().props;
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <header className='container mx-auto flex items-center justify-between py-4 px-4'>
            <Link href={dashboard()} className='flex items-center gap-2'>
                <AppLogo />
            </Link>
            <div className='hidden md:flex items-center gap-4'>
                <div className='flex items-center justify-end gap-2 w-full min-w-32'>
                    <UserInfo user={auth.user} showRole={true} />
                </div>
                <Link
                    className="flex gap-1 items-center w-full cursor-pointer font-open-sans"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut />
                    Sign Out
                </Link>
            </div>
            <div className='md:hidden'>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-md ring-offset-background transition-all hover:ring-2 hover:ring-ring">
                            <Menu className="size-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 shadow-sm border-none" align="end" sideOffset={8}>
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
