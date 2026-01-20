import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-emerald-500 text-white shadow-md shadow-violet-500/20">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
                Team<span className="text-violet-600 dark:text-violet-400">Artisan</span>
            </span>
        </div>
    );
}