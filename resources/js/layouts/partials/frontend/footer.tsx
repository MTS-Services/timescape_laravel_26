import { Link } from '@inertiajs/react';

import AppLogo from '@/components/app-logo';

export function FrontendFooter() {
    return (
        <footer className="border-t bg-muted/40 dark:bg-muted/10">
            <div className="container mx-auto px-4 py-12 md:px-8 lg:py-16">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <AppLogo />
                        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                            Crafting beautiful digital experiences for modern teams. Build, ship, and scale with confidence.
                        </p>
                    </div>

                    {/* Links Grid */}
                    <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Product</h3>
                                <ul className="mt-4 space-y-3">
                                    <li><Link href="#" className="text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Features</Link></li>
                                    <li><Link href="#" className="text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Pricing</Link></li>
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold text-foreground">Support</h3>
                                <ul className="mt-4 space-y-3">
                                    <li><Link href="#" className="text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Documentation</Link></li>
                                    <li><Link href="#" className="text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors">API Status</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Company</h3>
                            <ul className="mt-4 space-y-3">
                                <li><Link href="#" className="text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors">About Us</Link></li>
                                <li><Link href="#" className="text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Privacy</Link></li>
                                <li><Link href="#" className="text-sm text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Terms</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} Team Artisan Inc. All rights reserved.
                    </p>
                    <div className="flex items-center space-x-4">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-xs text-muted-foreground">Version 2.4.0</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}