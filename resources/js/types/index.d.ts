import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    permissions?: string[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | string | null;
    slug?: string;
    isActive?: boolean;
    children?: NavItem[];
    permission?: string;
    onClick?: (item: NavItem, event?: React.MouseEvent) => void;
    badge?: string | number;
    disabled?: boolean;
    external?: boolean;
    target?: '_blank' | '_self' | '_parent' | '_top';
    className?: string;
    description?: string;
    [key: string]: unknown;
}

// Alias for backward compatibility
export type NavItem = NavItem;

export interface SharedData {
    name: string;
    auth: Auth;
    features: Features;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface Features {
    canRegister: boolean;
    canResetPassword: boolean;
    canVerifyEmail: boolean;
    canUseTwoFactorAuthentication: boolean;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    is_admin?: boolean;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    permissions?: string[];
    all_permissions?: string[];
    created_at: string;
    updated_at: string;
    // When I Work fields
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    employee_code?: string;
    role?: number;
    role_label?: string;
    can_manage_users?: boolean;
    avatar_url?: string;
    [key: string]: unknown;
}

export interface NavItemProps {
    item: NavItem;
    isCollapsed: boolean;
    level?: number;
    isActive?: boolean;
    currentRoute?: string;
    permissions?: string[];
    activeSlug?: string;
}

export interface DropdownPosition {
    top: number;
    left: number;
}