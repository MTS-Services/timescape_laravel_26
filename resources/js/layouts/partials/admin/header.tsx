import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { type BreadcrumbItem, type SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronsLeft, ChevronsRight, Search, BellIcon, } from 'lucide-react';
import * as React from 'react';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { cn, toUrl } from '@/lib/utils';
import { Icon } from '@/components/icon';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useActiveUrl } from '@/hooks/use-active-url';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Separator } from '@radix-ui/react-separator';

interface AdminHeaderProps {
    isCollapsed: boolean;
    setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

export function AdminHeader({ isCollapsed, setIsCollapsed }: AdminHeaderProps) {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();
    const page = usePage<SharedData>();
    const { urlIsActive } = useActiveUrl();

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-all ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </Button>
            {/* <div className="hidden h-full items-center space-x-6 lg:flex">
                <NavigationMenu className="flex h-full items-stretch">
                    <NavigationMenuList className="flex h-full items-stretch space-x-2">

                        <NavigationMenuItem
                            key="dashboard"
                            className="relative flex h-full items-center"
                        >

                            <Link
                                href="#"
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    urlIsActive('#') && activeItemStyles,
                                    'h-9 cursor-pointer px-3',
                                )}
                            >

                                <Icon
                                    iconNode={ChevronsRight}
                                    className="mr-2 h-4 w-4"
                                />
                            </Link>
                            {urlIsActive('#') && (
                                <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                            )}
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div> */}

            <div className="ml-auto flex items-center space-x-2">
                <div className="relative flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="group h-9 w-9 cursor-pointer"
                    >
                        <Search className="size-5! opacity-80 group-hover:opacity-100" />
                    </Button>
                    <Separator orientation="vertical"/>
                    <AppearanceToggleDropdown />
                    <div className="hidden lg:flex">
                        <TooltipProvider
                            key="notification"
                            delayDuration={0}
                        >
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="group h-9 w-9 cursor-pointer"
                                    >
                                        <BellIcon className="size-5! opacity-80 group-hover:opacity-100" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Notification</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="size-10 rounded-full p-1"
                        >
                            <Avatar className="size-8 overflow-hidden rounded-full">
                                <AvatarImage
                                    src={auth.user.avatar}
                                    alt={auth.user.name}
                                />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

        </header>
    );
}
