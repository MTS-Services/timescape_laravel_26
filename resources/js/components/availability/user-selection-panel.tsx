import { router, usePage } from '@inertiajs/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    meets_current_week_requirements?: boolean;
}

interface UserSelectionPanelProps {
    users: User[];
    selectedUserId?: number;
    currentYear: number;
    currentMonth: number;
    maxHeight?: number;
}

export function UserSelectionPanel({ users, selectedUserId, currentYear, currentMonth, maxHeight }: UserSelectionPanelProps) {
    const { auth } = usePage<SharedData>().props;
    const handleUserSelect = (userId: number) => {
        if (userId === selectedUserId) return;

        router.get(
            '/availability',
            {
                user_id: userId,
                year: currentYear,
                month: currentMonth,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: [
                    'initialSelections',
                    'requirements',
                    'statistics',
                    'selectedUserId',
                    'targetUserPriority',
                    'weeklyRequirements',
                ],
            }
        );
    };

    const panelStyle = maxHeight ? { maxHeight, height: maxHeight } : undefined;
    const scrollAreaStyle = maxHeight ? { height: Math.max(maxHeight - 72, 200) } : undefined;

    return (
        <div
            className="rounded-lg border bg-card p-4 mb-4 h-auto overscroll-y-auto flex flex-col overflow-hidden min-h-0"
            style={panelStyle}
        >
            <h3 className="text-lg font-semibold mb-3">Staff List</h3>

            <ScrollArea className="flex-1 min-h-0 h-full overscroll-y-auto" style={scrollAreaStyle}>
                <div className="space-y-2 pr-4">
                    {users.map((user) => {
                        const isSelected = selectedUserId === user.id;
                        const isUnmet = user.meets_current_week_requirements === false;

                        return (
                            <Button
                                key={user.id}
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    'w-full justify-start cursor-pointer',
                                    isSelected ? 'bg-[#F64E06] font-semibold' : 'bg-transparent',
                                    user.id == auth.user.id ? 'border-destructive/30' : '',
                                    isUnmet && [
                                        isSelected
                                            ? 'ring-2 ring-orange-500 ring-offset-1'
                                            : 'border-orange-300 bg-orange-50 hover:bg-orange-100 dark:border-orange-800/60 dark:bg-orange-950/20',
                                    ]
                                )}
                                onClick={() => handleUserSelect(user.id)}
                            >
                                {user.name}
                            </Button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
