import { Head, Link } from '@inertiajs/react';
import * as React from 'react';

import AppLogo from '@/components/app-logo';
import { login } from '@/routes';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
    showHeader?: boolean;
    showFooter?: boolean;
}

export default function AuthLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative bg-background overflow-hidden">

            {/* Top Left Ellipse */}
            <span
                className='absolute blur-3xl pointer-events-none -top-[15%] -left-[35%] w-115 h-65 sm:w-150 sm:h-90 md:w-200 md:h-105 xl:-top-[30%] xl:-left-[35%] xl:w-300 xl:h-150 2xl:-top-[45%] 2xl:-left-[40%] 2xl:w-400 2xl:h-200 bg-radial from-[hsla(354,63%,84%,0.9)] from-0% to-transparent to-70%  opacity-80 xl:opacity-100'
            ></span>

            {/* Bottom Right Ellipse */}
            <span
                className='absolute blur-3xl pointer-events-none -bottom-[15%] -right-[35%] w-115 h-65 sm:w-150 sm:h-90 md:w-200 md:h-105 xl:-bottom-[30%] xl:-right-[35%] xl:w-300 xl:h-150 2xl:-bottom-[45%] 2xl:-right-[40%] 2xl:w-400 2xl:h-200 bg-radial from-[hsla(354,63%,84%,0.9)] from-0% to-transparent to-70%  opacity-80 xl:opacity-100'
            ></span>

            <main className='flex flex-col w-full max-w-115 shadow-card rounded-[8px] p-6 md:p-7.5 bg-white/80 dark:bg-transparent backdrop-blur-sm relative z-1'>
                <Head title={title} />

                <Link href={login()} className="flex flex-col items-center">
                    <AppLogo className="fill-current text-foreground h-12 w-auto md:h-auto" />
                </Link>

                <div className="space-y-2 text-center mt-6">
                    <h1 className="font-montserrat font-semibold text-2xl md:text-4xl leading-tight md:leading-[130%] text-[#595959]">
                        {title || "Availability Scheduler"}
                    </h1>
                    <p className="text-base md:text-xl leading-relaxed md:leading-[150%] text-center text-[#595959]">
                        {description || "Sign in to manage your availability"}
                    </p>
                </div>

                <div className="mt-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}