import { router } from '@inertiajs/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
    id: number;
    name: string;
    email: string;
}

interface UserSelectionPanelProps {
    users: User[];
    selectedUserId?: number;
    currentYear: number;
    currentMonth: number;
}

export function UserSelectionPanel({ users, selectedUserId, currentYear, currentMonth }: UserSelectionPanelProps) {
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
                only: ['initialSelections', 'requirements', 'statistics', 'selectedUserId']
            }
        );
    };

    return (
        <div className="rounded-lg border bg-card shadow-sm p-4 mb-4 h-auto overscroll-y-auto bg-red-50 flex flex-col">
            <h3 className="text-lg font-semibold mb-3">Staff List</h3>

            <ScrollArea className="flex-1 min-h-42 overscroll-y-auto">
                <div className="space-y-2 pr-4">
                    {users.map((user) => (
                        <Button
                            key={user.id}
                            variant={selectedUserId === user.id ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start cursor-pointer"
                            onClick={() => handleUserSelect(user.id)}
                        >
                            {user.name}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
