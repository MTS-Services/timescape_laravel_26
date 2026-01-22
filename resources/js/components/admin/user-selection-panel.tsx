import axios from 'axios';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/types/availability';

interface UserSelectionPanelProps {
    onUserSelect: (userId: number) => void;
    selectedUserId?: number;
}

export function UserSelectionPanel({ onUserSelect, selectedUserId }: UserSelectionPanelProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch users on component mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/admin/users/list');
                setUsers(response.data.users);
                setError(null);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to load user list');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="rounded-lg border bg-card shadow-sm p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3">Staff List</h3>

            {loading && <p className="text-sm text-muted-foreground">Loading users...</p>}

            {error && (
                <div className="text-sm text-destructive mb-2">
                    {error}
                </div>
            )}

            <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                    {users.map((user) => (
                        <Button
                            key={user.id}
                            variant={selectedUserId === user.id ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => onUserSelect(user.id)}
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
