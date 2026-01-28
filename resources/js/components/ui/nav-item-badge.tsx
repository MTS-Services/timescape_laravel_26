import * as React from 'react';

import { formatBadge } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';

interface NavItemBadgeProps {
    badge: string | number;
    className?: string;
}

export const NavItemBadge = React.memo<NavItemBadgeProps>(({ badge, className }) => {
    return (
        <span
            className={cn(
                "px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full shrink-0 min-w-1.5rem text-center",
                className
            )}
        >
            {formatBadge(badge)}
        </span>
    );
});

NavItemBadge.displayName = 'NavItemBadge';