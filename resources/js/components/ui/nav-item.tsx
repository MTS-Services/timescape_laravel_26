import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    useNavActiveState,
    useFilteredChildren,
    useDropdownPosition,
    useClickOutside,
    useHasActiveChild
} from '@/hooks/nav-hooks';
import { hasPermission } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';
import { type NavItemProps } from '@/types';


import { NavItemBadge } from './nav-item-badge';
import { NavItemDropdown } from './nav-item-dropdown';
import { NavItemIcon } from './nav-item-icon';


export const NavItem = React.memo<NavItemProps>(({
    item,
    isCollapsed,
    level = 0,
    isActive = false,
    currentRoute = '',
    permissions = [],
    activeSlug
}) => {
    const hasActiveChild = useHasActiveChild(item, activeSlug);
    const [isOpen, setIsOpen] = React.useState(hasActiveChild);
    const [showDropdown, setShowDropdown] = React.useState(false);

    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Custom hooks
    const itemIsActive = useNavActiveState(item, currentRoute, isActive, activeSlug);
    const filteredChildren = useFilteredChildren(item.children, permissions);
    const { position, calculatePosition } = useDropdownPosition();

    // Derived state
    const hasChildren = filteredChildren.length > 0;
    const userHasPermission = hasPermission(item, permissions);

    // Auto-expand parent when child is active
    React.useEffect(() => {
        if (hasActiveChild && !isCollapsed) {
            setIsOpen(true);
        }
    }, [hasActiveChild, isCollapsed]);

    // Click outside handler
    useClickOutside(
        [dropdownRef as React.RefObject<HTMLElement>, triggerRef as React.RefObject<HTMLElement>],
        () => setShowDropdown(false),
        showDropdown
    );

    // Handlers
    const handleClick = React.useCallback((event: React.MouseEvent) => {
        if (item.onClick) {
            item.onClick(item, event);
        }

        if (hasChildren) {
            if (isCollapsed) {
                setShowDropdown(prev => !prev);
                if (triggerRef.current && !showDropdown) {
                    calculatePosition(triggerRef.current);
                }
            } else {
                setIsOpen(prev => !prev);
            }
        }
    }, [item, hasChildren, isCollapsed, showDropdown, calculatePosition]);

    const handleLinkClick = React.useCallback((event: React.MouseEvent) => {
        if (item.onClick) {
            item.onClick(item, event);
        }
    }, [item]);

    if (!userHasPermission) return null;

    // Parent item with children
    if (hasChildren) {
        return (
            <div className="relative">
                <Collapsible open={!isCollapsed && isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger
                        ref={triggerRef}
                        onClick={handleClick}
                        disabled={item.disabled}
                        className={cn(
                            'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                            'text-muted-foreground transition-all duration-200',
                            'hover:bg-accent hover:text-accent-foreground',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            'w-full text-left',
                            isCollapsed ? 'justify-center px-2' : '',
                            level > 0 && !isCollapsed && 'ml-4',
                            itemIsActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                            item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                            item.className
                        )}
                    >
                        <NavItemIcon item={item} level={level} />

                        {!isCollapsed && (
                            <>
                                <span className="flex-1 truncate">{item.title}</span>
                                {item.badge && <NavItemBadge badge={item.badge} />}
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                                        isOpen && "rotate-180"
                                    )}
                                />
                            </>
                        )}

                        {/* Active indicator */}
                        {isCollapsed && itemIsActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full">
                                <div className="absolute inset-0 bg-primary rounded-full animate-ping" />
                            </div>
                        )}
                    </CollapsibleTrigger>

                    {/* Expanded state */}
                    {!isCollapsed && (
                        <CollapsibleContent className="mt-1 space-y-1 border-l-2 border-border/30 pl-4 pr-2 ml-4">
                            {filteredChildren.map((child, index) => (
                                <NavItem
                                    key={`${child.title}-${index}`}
                                    item={child}
                                    isCollapsed={isCollapsed}
                                    level={level + 1}
                                    currentRoute={currentRoute}
                                    permissions={permissions}
                                    activeSlug={activeSlug}
                                />
                            ))}
                        </CollapsibleContent>
                    )}
                </Collapsible>

                {/* Collapsed dropdown */}
                {isCollapsed && showDropdown && (
                    <NavItemDropdown
                        item={item}
                        position={position}
                        childrenCount={filteredChildren.length}
                        dropdownRef={dropdownRef as React.RefObject<HTMLDivElement>}
                    >
                        {filteredChildren.map((child, index) => (
                            <NavItem
                                key={`${child.title}-${index}`}
                                item={child}
                                isCollapsed={false}
                                level={0}
                                currentRoute={currentRoute}
                                permissions={permissions}
                                activeSlug={activeSlug}
                            />
                        ))}
                    </NavItemDropdown>
                )}
            </div>
        );
    }

    // Leaf item (no children)
    return (
        <Link
            href={item.disabled ? '#' : item.href}
            onClick={handleLinkClick}
            className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                'text-muted-foreground transition-all duration-200',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'w-full',
                isCollapsed ? 'justify-center px-2' : '',
                level > 0 && !isCollapsed && 'ml-4',
                itemIsActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                item.className
            )}
            {...(item.external && { target: item.target || '_blank', rel: 'noopener noreferrer' })}
        >
            <NavItemIcon item={item} level={level} />

            {!isCollapsed && (
                <>
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.badge && <NavItemBadge badge={item.badge} />}
                </>
            )}

            {/* Active indicators */}
            {isCollapsed && itemIsActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full">
                    <div className="absolute inset-0 bg-primary rounded-full animate-ping" />
                </div>
            )}

            {!isCollapsed && itemIsActive && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0">
                    <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                </div>
            )}
        </Link>
    );
});

NavItem.displayName = 'NavItem';