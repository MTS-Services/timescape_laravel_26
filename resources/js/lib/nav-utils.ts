import { Folder, File, Circle, Dot } from 'lucide-react';

import { type NavItem } from '@/types';

/**
 * Check if user has permission to view nav item
 */
export function hasPermission(item: NavItem, permissions: string[]): boolean {
    return !item.permission || permissions.length === 0 || permissions.includes(item.permission);
}

/**
 * Get default icon based on nesting level
 */
export function getDefaultIcon(level: number) {
    const defaultIcons = [
        Folder,    // Level 0: Parent items
        File,      // Level 1: First level children
        Circle,    // Level 2: Second level children
        Dot        // Level 3+: Deeper nested items
    ];

    return defaultIcons[Math.min(level, defaultIcons.length - 1)];
}

/**
 * Count total children (recursively)
 */
export function countChildren(items: NavItem[]): number {
    return items.reduce((count, item) => {
        let total = 1;
        if (item.children) {
            total += countChildren(item.children);
        }
        return count + total;
    }, 0);
}

/**
 * Format badge value
 */
export function formatBadge(badge: string | number): string {
    if (typeof badge === 'number') {
        if (badge > 99) return '99+';
        return badge.toString();
    }
    return badge;
}