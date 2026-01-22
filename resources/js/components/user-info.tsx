import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    showRole = false,
}: {
    user: User;
    showEmail?: boolean;
    showRole?: boolean;
}) {
    const getInitials = useInitials();
    return (
        <>
            <Avatar className="h-12 w-12 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar_url || user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-primary text-white text-lg font-semibold font-montserrat">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-base font-semibold text-text-secondary font-montserrat">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-base text-text-primary">
                        {user.email}
                    </span>
                )}
                {showRole && (
                    <span className="text-base text-text-primary font-normal">
                        {user.role_label || 'Employee'}
                    </span>
                )}
            </div>
        </>
    );
}
