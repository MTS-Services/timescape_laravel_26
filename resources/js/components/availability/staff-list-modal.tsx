import { router, usePage } from '@inertiajs/react';
import { forwardRef, useImperativeHandle, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    meets_current_week_requirements?: boolean;
    meets_next_week_requirements?: boolean;
}

interface StaffListModalProps {
    users: User[];
    selectedUserId?: number;
    currentYear: number;
    currentMonth: number;
}

export interface StaffListModalRef {
    open: () => void;
    close: () => void;
}

export const StaffListModal = forwardRef<
    StaffListModalRef,
    StaffListModalProps
>(({ users, selectedUserId, currentYear, currentMonth }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectingUserId, setSelectingUserId] = useState<number | null>(null);
    const { auth } = usePage<SharedData>().props;

    const handleClose = () => {
        setIsOpen(false);
        setSelectingUserId(null);
    };

    useImperativeHandle(ref, () => ({
        open: () => setIsOpen(true),
        close: handleClose,
    }));
    const handleUserSelect = (userId: number) => {
        if (userId === selectedUserId) {
            setIsOpen(false);
            return;
        }

        setSelectingUserId(userId);
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
                onSuccess: () => {
                    setIsOpen(false);
                },
                onError: () => {
                    setSelectingUserId(null);
                },
            },
        );
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => !open && setIsOpen(false)}
        >
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
                            const isCurrentWeekUnmet =
                                user.meets_current_week_requirements ===
                                    false ||
                                (user.meets_current_week_requirements as unknown) ===
                                    0;
                            const isNextWeekUnmet =
                                user.meets_next_week_requirements === false ||
                                (user.meets_next_week_requirements as unknown) ===
                                    0;

                            const isAdmin =
                                auth.user.is_admin && user.id === auth.user.id;

                            return (
                                <Button
                                    key={user.id}
                                    variant={isSelected ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        'flex w-full items-center justify-start gap-2 text-left',
                                        isSelected
                                            ? 'bg-[#F64E06] font-semibold ring-2 ring-offset-1'
                                            : 'bg-transparent',
                                        user.id == auth.user.id
                                            ? 'border-destructive/30'
                                            : '',
                                    )}
                                    onClick={() => handleUserSelect(user.id)}
                                >
                                    <div className="flex flex-1 items-center gap-2 truncate text-left">
                                        {user.name}
                                        {/* {isSelected && (
                                            <span className="ml-auto text-xs opacity-70">
                                                (Selected)
                                            </span>
                                        )} */}
                                        {selectingUserId === user.id && (
                                            <Spinner className="ml-auto size-4 text-destructive" />
                                        )}
                                    </div>
                                    {!isAdmin && (
                                        <div className="flex items-center gap-1">
                                            {/* Current Week */}
                                            <span
                                                className={cn(
                                                    'block h-2 w-2 rounded-full',
                                                    isCurrentWeekUnmet
                                                        ? 'bg-gray-400'
                                                        : 'bg-teal-500',
                                                )}
                                            />
                                            {/* Next Week */}
                                            <span
                                                className={cn(
                                                    'block h-2 w-2 rounded-full',
                                                    isNextWeekUnmet
                                                        ? 'bg-gray-400'
                                                        : 'bg-teal-500',
                                                )}
                                            />
                                        </div>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </ScrollArea>
                <DialogDescription></DialogDescription>
            </DialogContent>
        </Dialog>
    );
});

StaffListModal.displayName = 'StaffListModal';
