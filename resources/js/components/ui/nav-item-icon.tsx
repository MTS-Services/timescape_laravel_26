import * as React from 'react';

import { getDefaultIcon } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';

interface NavItemIconProps {
    item: NavItem;
    level: number;
    className?: string;
}

export const NavItemIcon = React.memo<NavItemIconProps>(({ item, level, className }) => {
    const DefaultIconComponent = getDefaultIcon(level);

    if (item.icon) {
        if (typeof item.icon === 'string') {
            return (
                <img
                    src={item.icon}
                    alt={item.title}
                    className={cn("h-5 w-5 object-contain", className)}
                />
            );
        }
        const IconComponent = item.icon;
        return <IconComponent className={cn("h-5 w-5", className)} />;
    }

    return React.createElement(DefaultIconComponent, { className: cn("h-5 w-5", className) });
});

NavItemIcon.displayName = 'NavItemIcon';