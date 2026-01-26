import { router } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    name: string;
    email: string;
}

interface StaffListModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    selectedUserId?: number;
    currentYear: number;
    currentMonth: number;
}

export function StaffListModal({
    isOpen,
    onClose,
    users,
    selectedUserId,
    currentYear,
    currentMonth,
}: StaffListModalProps) {
    const handleUserSelect = (userId: number) => {
        if (userId === selectedUserId) {
            onClose();
            return;
        }

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
                only: ['initialSelections', 'requirements', 'statistics', 'selectedUserId'],
                onSuccess: () => {
                    onClose();
                },
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        Staff List
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-2 py-2">
                        {users.map((user) => {
                            const isSelected = selectedUserId === user.id;

                            return (
                                <Button
                                    key={user.id}
                                    variant={isSelected ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        'w-full justify-start text-left',
                                        isSelected && 'ring-2 ring-offset-1'
                                    )}
                                    onClick={() => handleUserSelect(user.id)}
                                >
                                    {user.name}
                                    {isSelected && (
                                        <span className="ml-auto text-xs opacity-70">
                                            (Selected)
                                        </span>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
