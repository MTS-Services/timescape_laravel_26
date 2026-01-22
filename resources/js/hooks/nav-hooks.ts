import * as React from 'react';

import { type NavItem, type DropdownPosition } from '@/types';

/**
 * Hook to check if item or any child has matching slug
 */
export function useHasActiveChild(item: NavItem, activeSlug?: string): boolean {
    return React.useMemo(() => {
        if (!activeSlug || !item.children) return false;

        const checkChildSlug = (navItem: NavItem): boolean => {
            if (navItem.slug === activeSlug) return true;
            if (navItem.children) {
                return navItem.children.some(child => checkChildSlug(child));
            }
            return false;
        };

        return item.children.some(child => checkChildSlug(child));
    }, [item, activeSlug]);
}

/**
 * Hook to manage active state checking for navigation items
 */
export function useNavActiveState(item: NavItem, currentRoute: string, isActive?: boolean, activeSlug?: string) {
    return React.useMemo(() => {
        // First check if slug matches activeSlug (highest priority)
        if (activeSlug && item.slug === activeSlug) {
            return true;
        }

        // Check if any child has matching slug (for parent highlighting)
        const checkChildSlug = (navItem: NavItem): boolean => {
            if (navItem.slug === activeSlug) return true;
            if (navItem.children) {
                return navItem.children.some(child => checkChildSlug(child));
            }
            return false;
        };

        if (activeSlug && item.children && checkChildSlug(item)) {
            return true;
        }

        // Then check route matching
        const checkIsActive = (navItem: NavItem): boolean => {
            if (navItem.href === currentRoute) return true;
            if (navItem.children) {
                return navItem.children.some(child => checkIsActive(child));
            }
            return false;
        };

        return checkIsActive(item) || isActive || false;
    }, [item, currentRoute, isActive, activeSlug]);
}

/**
 * Hook to filter children based on permissions
 */
export function useFilteredChildren(children?: NavItem[], permissions: string[] = []) {
    return React.useMemo(() => {
        if (!children) return [];

        return children.filter(child =>
            !child.permission || permissions.length === 0 || permissions.includes(child.permission)
        );
    }, [children, permissions]);
}

/**
 * Hook to manage collapsed dropdown positioning
 */
export function useDropdownPosition() {
    const [position, setPosition] = React.useState<DropdownPosition>({ top: 0, left: 0 });

    const calculatePosition = React.useCallback((triggerElement: HTMLElement) => {
        const rect = triggerElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        const DROPDOWN_MAX_HEIGHT = Math.min(viewportHeight * 0.6, 500);
        const SPACING = 12;
        const EDGE_PADDING = 20;

        // Position to the right of the trigger element
        let leftPosition = rect.right + SPACING;

        // Center vertically relative to trigger
        let topPosition = rect.top + (rect.height / 2);

        // Adjust if dropdown would go off screen to the right
        const estimatedWidth = 250; // Approximate dropdown width
        if (leftPosition + estimatedWidth > viewportWidth - EDGE_PADDING) {
            // Position to the left of the trigger instead
            leftPosition = rect.left - estimatedWidth - SPACING;

            // If still off screen, align with right edge
            if (leftPosition < EDGE_PADDING) {
                leftPosition = viewportWidth - estimatedWidth - EDGE_PADDING;
            }
        }

        // Adjust vertical position to keep dropdown on screen
        const halfHeight = DROPDOWN_MAX_HEIGHT / 2;

        if (topPosition - halfHeight < EDGE_PADDING) {
            topPosition = EDGE_PADDING;
        } else if (topPosition + halfHeight > viewportHeight - EDGE_PADDING) {
            topPosition = viewportHeight - DROPDOWN_MAX_HEIGHT - EDGE_PADDING;
        } else {
            topPosition = topPosition - halfHeight;
        }

        setPosition({ top: topPosition, left: leftPosition });
    }, []);

    return { position, calculatePosition };
}

/**
 * Hook to manage click outside behavior
 */
export function useClickOutside(
    refs: React.RefObject<HTMLElement>[],
    handler: () => void,
    active: boolean = true
) {
    React.useEffect(() => {
        if (!active) return;

        const handleClickOutside = (event: MouseEvent) => {
            const clickedOutside = refs.every(
                ref => ref.current && !ref.current.contains(event.target as Node)
            );

            if (clickedOutside) {
                handler();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [refs, handler, active]);
}