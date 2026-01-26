import { usePage } from "@inertiajs/react";

import { useIsMobile } from "@/hooks/use-mobile";
import type { User } from "@/types";
import { AvailabilityRequirements } from "@/types/availability";

import RequirementsBanner from "./availability/requirements-banner";

interface PageProps {
    auth: {
        user: User;
    };
    requirements: AvailabilityRequirements;
    [key: string]: unknown;
}

export default function SchedulerHeader() {
    const { auth, requirements } = usePage<PageProps>().props;
    const isMobile = useIsMobile();

    const isAdmin = auth?.user?.can_manage_users;
    const shouldShowRequirements = requirements && !(isMobile && isAdmin);

    return (
        <div className="container px-4 mx-auto flex items-center justify-between mt-10 mb-5">
            <div>
                <h4 className="text-[32px] font-semibold">Availability Scheduler</h4>
                <h6 className="text-base font-semibold text-text-muted">Calendar Dashboard</h6>
            </div>
            {shouldShowRequirements && (
                <RequirementsBanner requirements={requirements} />
            )}
        </div>
    )
}