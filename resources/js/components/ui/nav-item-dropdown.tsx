import * as React from 'react';

import { cn } from '@/lib/utils';
import { type NavItem, type DropdownPosition } from '@/types';

import { NavItemIcon } from './nav-item-icon';

interface NavItemDropdownProps {
    item: NavItem;
    position: DropdownPosition;
    children: React.ReactNode;
    childrenCount: number;
    dropdownRef: React.RefObject<HTMLDivElement>;
}

export const NavItemDropdown = React.memo<NavItemDropdownProps>(({
    item,
    position,
    children,
    childrenCount,
    dropdownRef
}) => {
    return (
        <div
            ref={dropdownRef}
            className={cn(
                "fixed z-50 w-auto min-w-200px max-w-400px bg-background",
                "border border-border rounded-lg shadow-lg",
                "animate-in fade-in-0 zoom-in-95 slide-in-from-left-2",
                "duration-200"
            )}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            {/* Header */}
            <div className="p-3 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <NavItemIcon item={item} level={0} className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">
                            {childrenCount} {childrenCount === 1 ? 'item' : 'items'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="px-3 py-2 space-y-1 max-h-[60vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
                {children}
            </div>
        </div>
    );
});

NavItemDropdown.displayName = 'NavItemDropdown';