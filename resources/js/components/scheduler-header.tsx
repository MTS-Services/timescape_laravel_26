import { usePage } from "@inertiajs/react";
import type { User } from "@/types";
import { AvailabilityRequirements } from "@/types/availability";
import { toast } from "sonner";
import RequirementsBanner from "./availability/requirements-banner";
import { useRef } from "react";

interface PageProps {
    auth: { user: User };
    requirements: AvailabilityRequirements;
    [key: string]: unknown;
}

export default function SchedulerHeader() {
    const { auth, requirements } = usePage<PageProps>().props;
    const isAdmin = auth?.user?.can_manage_users;

    const hasTriggeredThisSession = useRef(false);

    const shouldShowRequirements = requirements && !isAdmin;

    // Direct Logic (No useEffect)
    if (!isAdmin && requirements && !requirements.overall_status && !hasTriggeredThisSession.current) {
        const now = new Date();
        const userId = auth.user.id;
        const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        const storageKey = `toast_suppress_${userId}_${dateStr}`;

        const storedData = localStorage.getItem(storageKey);
        let shouldShowToast = false;

        if (storedData) {
            const lastShownTime = parseInt(storedData);
            const hoursPassed = (now.getTime() - lastShownTime) / (1000 * 60 * 60);
            if (hoursPassed >= 4) {
                shouldShowToast = true;
            }
        } else {
            shouldShowToast = true;
        }


        if (shouldShowToast) {
            // Update the Ref immediately to prevent re-renders from triggering it again
            hasTriggeredThisSession.current = true;

            // setTimeout ensures the Toaster component is ready in the DOM
            setTimeout(() => {
                console.log('Executing toast.warning now');
                toast.warning('weekly availability Fis currently incomplete (Requirement: 3 weekday & 2 weekend blocks). Please finalize your entries by the end of Saturday to ensure you are included in next week\'s roster.Thank you!', {
                    duration: 10000,
                    position: "top-center"
                });
            }, 0);

            // Update localStorage
            localStorage.setItem(storageKey, now.getTime().toString());
        } else {
            hasTriggeredThisSession.current = true;
        }
    }

    return (
        <div className="container px-3 sm:px-4 lg:px-6 xl:px-8 mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between mt-2 lg:mt-10 mb-5 gap-4 lg:gap-0">
            <div>
                <h4 className="text-2xl md:text-[32px] font-semibold">Availability Scheduler</h4>
                <h6 className="text-sm sm:text-base font-semibold text-text-muted">Calendar Dashboard</h6>
            </div>

            {!isAdmin && (
                <div className="font-bold font-montserrat text-destructive text-left lg:text-center text-base md:text-lg w-full max-w-[578px]">
                    Availability for the following week must be entered by the end of Saturday each week.
                </div>
            )}

            {shouldShowRequirements && (
                <RequirementsBanner requirements={requirements} />
            )}
        </div>
    );
}