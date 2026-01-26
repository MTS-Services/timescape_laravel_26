import { useSyncExternalStore } from 'react';

// Custom breakpoints for permission-based responsive behavior
const USER_DESKTOP_BREAKPOINT = 1300; // Non-admin users switch at 1300px
const ADMIN_DESKTOP_BREAKPOINT = 1500; // Admin users switch at 1500px

interface ResponsiveModeOptions {
    isAdmin?: boolean;
}

function createMediaQueryListener(breakpoint: number) {
    const mql =
        typeof window === 'undefined'
            ? undefined
            : window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    return {
        mql,
        subscribe: (callback: (event: MediaQueryListEvent) => void) => {
            if (!mql) {
                return () => { };
            }

            mql.addEventListener('change', callback);

            return () => {
                mql.removeEventListener('change', callback);
            };
        },
        getSnapshot: (): boolean => {
            return mql?.matches ?? false;
        },
    };
}

const userListener = createMediaQueryListener(USER_DESKTOP_BREAKPOINT);
const adminListener = createMediaQueryListener(ADMIN_DESKTOP_BREAKPOINT);

function getServerSnapshot(): boolean {
    return false;
}

/**
 * Hook to determine if mobile UI should be shown based on screen width AND user permissions
 * 
 * Rules:
 * - Non-admin users: Mobile UI when width < 1300px
 * - Admin users: Mobile UI when width < 1500px
 * 
 * @param options.isAdmin - Whether the current user has admin permissions
 * @returns true if mobile UI should be shown
 */
export function useResponsiveMode({ isAdmin = false }: ResponsiveModeOptions = {}): boolean {
    const listener = isAdmin ? adminListener : userListener;

    return useSyncExternalStore(
        listener.subscribe,
        listener.getSnapshot,
        getServerSnapshot
    );
}
