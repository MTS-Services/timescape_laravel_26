import { Link, usePage } from '@inertiajs/react';
import { Menu, XIcon } from 'lucide-react';
import { useState } from 'react';

import AppLogo from '@/components/app-logo';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { login, register } from '@/routes';
import { type SharedData } from '@/types';


export function AuthHeader() {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Features', href: '#' },
        { name: 'Pricing', href: '#' },
        { name: 'About', href: '#' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/" className="transition-transform active:scale-95">
                        <AppLogo />
                    </Link>

                    <nav className="hidden items-center gap-1 md:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <AppearanceToggleDropdown />

                    <div className="hidden h-6 w-[1px] bg-border md:block" /> {/* Divider */}

                    {auth.user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-ring">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={auth.user.avatar_url || auth.user.avatar} alt={auth.user.name} />
                                        <AvatarFallback className="bg-violet-600 text-white text-xs">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="hidden items-center gap-2 md:flex">
                            <Link href={login()}>
                                <Button variant="ghost" size="sm" className="text-sm font-medium">Log in</Button>
                            </Link>
                            <Link href={register()}>
                                <Button size="sm" className="bg-violet-600 text-white shadow-sm hover:bg-violet-700">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Trigger */}
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
                            <SheetHeader className="flex-row items-center justify-between border-b p-6 space-y-0">
                                <AppLogo />
                                <SheetClose asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <XIcon className="h-5 w-5" />
                                    </Button>
                                </SheetClose>
                            </SheetHeader>

                            <div className="flex flex-1 flex-col justify-between p-6">
                                <nav className="flex flex-col gap-2">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            className="block rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-accent"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    ))}
                                </nav>

                                <div className="space-y-3">
                                    {!auth.user ? (
                                        <>
                                            <Link href={login()} className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                                                <Button variant="outline" className="w-full py-6">Log in</Button>
                                            </Link>
                                            <Link href={register()} className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                                                <Button className="w-full bg-violet-600 py-6 hover:bg-violet-700">Get Started</Button>
                                            </Link>
                                        </>
                                    ) : (
                                        <Link href={route('dashboard')} className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="w-full bg-violet-600 py-6">Dashboard</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}