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
        <div className="rounded-lg border bg-card shadow-sm p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3">Staff List</h3>

            <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                    {users.map((user) => (
                        <Button
                            key={user.id}
                            variant={selectedUserId === user.id ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleUserSelect(user.id)}
                        >
                            {user.name}
                            {selectedUserId === user.id && (
                                <span className="ml-2 text-xs">(Selected)</span>
                            )}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
