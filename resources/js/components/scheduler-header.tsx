import { usePage } from "@inertiajs/react";

import { useResponsiveMode } from "@/hooks/use-responsive-mode";
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
    const isAdmin = auth?.user?.can_manage_users;
    const isMobile = useResponsiveMode({ isAdmin });

    const shouldShowRequirements = requirements && !isAdmin;

    return (
        <div className="container px-3 sm:px-4 lg:px-6 xl:px-8 mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 lg:mt-10 mb-5 gap-4 sm:gap-0">
            <div>
                <h4 className="text-2xl md:text-[32px] font-semibold">Availability Scheduler</h4>
                <h6 className="text-sm sm:text-base font-semibold text-text-muted">Calendar Dashboard</h6>
            </div>

            {!isAdmin && (
                <div className="font-bold font-montserrat text-xl md:text-2xl w-full max-w-[578px]">"Availability for the following week must be entered by the end of Saturday each week."</div>
            )}

            {shouldShowRequirements && (
                <RequirementsBanner requirements={requirements} />
            )}
        </div>
    )
}