import { router, usePage } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    meets_current_week_requirements?: boolean;
    meets_next_week_requirements?: boolean;
}

interface UserSelectionPanelProps {
    users: User[];
    selectedUserId?: number;
    currentYear: number;
    currentMonth: number;
    maxHeight?: number;
}

export function UserSelectionPanel({
    users,
    selectedUserId,
    currentYear,
    currentMonth,
    maxHeight,
}: UserSelectionPanelProps) {
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
            },
        );
    };

    const panelStyle = maxHeight ? { maxHeight, height: maxHeight } : undefined;
    const scrollAreaStyle = maxHeight
        ? { height: Math.max(maxHeight - 72, 200) }
        : undefined;

    return (
        <div
            className="mb-4 flex h-auto min-h-0 flex-col overflow-hidden overscroll-y-auto rounded-lg border bg-card p-4"
            style={panelStyle}
        >
            <h3 className="mb-3 text-lg font-semibold">Staff List</h3>

            <ScrollArea
                className="h-full min-h-0 flex-1 overscroll-y-auto"
                style={scrollAreaStyle}
            >
                <div className="space-y-2 p-1 pr-4">
                    {users.map((user) => {
                        const isSelected = selectedUserId === user.id;
                        const isCurrentWeekUnmet =
                            user.meets_current_week_requirements === false ||
                            (user.meets_current_week_requirements as unknown) ===
                                0;
                        const isNextWeekUnmet =
                            user.meets_next_week_requirements === false ||
                            (user.meets_next_week_requirements as unknown) ===
                                0;
                        return (
                            <Button
                                key={user.id}
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    'flex w-full cursor-pointer items-center justify-start gap-2',
                                    isSelected
                                        ? 'bg-[#F64E06] font-semibold'
                                        : 'bg-transparent',
                                    user.id == auth.user.id
                                        ? 'border-destructive/30'
                                        : '',
                                )}
                                onClick={() => handleUserSelect(user.id)}
                            >
                                <p className="flex-1 truncate text-left">
                                    {user.name}
                                </p>
                                <div className="flex items-center gap-1">
                                    {/* Current Week Requirements Meets */}
                                    <span
                                        className={cn(
                                            'block h-2 w-2 rounded-full',
                                            isCurrentWeekUnmet && [
                                                isSelected
                                                    ? 'bg-teal-500 ring-2 ring-orange-500 ring-offset-1'
                                                    : 'bg-gray-400',
                                            ],
                                        )}
                                    ></span>
                                    {/* Next Week Requirements Meets */}
                                    <span
                                        className={cn(
                                            'block h-2 w-2 rounded-full',
                                            isNextWeekUnmet && [
                                                isSelected
                                                    ? 'bg-teal-500 ring-2 ring-orange-500 ring-offset-1'
                                                    : 'bg-gray-400',
                                            ],
                                        )}
                                    ></span>
                                </div>
                            </Button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
