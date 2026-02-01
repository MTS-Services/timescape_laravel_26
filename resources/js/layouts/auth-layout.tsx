import * as React from 'react';
import AppLogo from '@/components/app-logo';
import { Head, Link } from '@inertiajs/react';
import { AuthHeader } from '@/layouts/partials/auth/header';
import { AuthFooter } from '@/layouts/partials/auth/footer';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';


interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
    showHeader?: boolean; // New prop
    showFooter?: boolean; // New prop
}

export default function AuthLayout({
    children,
    title,
    description,
    showHeader = false,
    showFooter = false,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col bg-background relative overflow-hidden">

            {/* Top Left Ellipse */}
            <span
                className='absolute blur-3xl pointer-events-none -top-[15%] -left-[35%] w-115 h-65 sm:w-150 sm:h-90 md:w-200 md:h-105 xl:-top-[30%] xl:-left-[35%] xl:w-300 xl:h-150 2xl:-top-[45%] 2xl:-left-[40%] 2xl:w-400 2xl:h-200 bg-radial from-[hsla(354,63%,84%,0.9)] from-0% to-transparent to-70%  opacity-80 xl:opacity-100'
            ></span>

            {/* Bottom Right Ellipse */}
            <span
                className='absolute blur-3xl pointer-events-none -bottom-[15%] -right-[35%] w-115 h-65 sm:w-150 sm:h-90 md:w-200 md:h-105 xl:-bottom-[30%] xl:-right-[35%] xl:w-300 xl:h-150 2xl:-bottom-[45%] 2xl:-right-[40%] 2xl:w-400 2xl:h-200 bg-radial from-[hsla(354,63%,84%,0.9)] from-0% to-transparent to-70%  opacity-80 xl:opacity-100'
            ></span>

            {showHeader && <AuthHeader />}

            <main className="flex flex-1 items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm space-y-8">
                    <div className="flex flex-col items-center gap-6">
                        <Link href={home()} className="flex flex-col items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5">
                                <AppLogoIcon className="size-10 fill-current text-foreground" />
                            </div>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>

                    {/* Content Slot */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>

            {showFooter && <AuthFooter />}
        </div>
    );
}