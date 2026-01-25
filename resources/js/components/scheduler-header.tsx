import { usePage } from "@inertiajs/react";
import { AvailabilityRequirements } from "@/types/availability";
import { Suspense, lazy } from "react";
// lazy load requirements banner
const RequirementsBanner = lazy(() => import("./availability/requirements-banner"));

interface PageProps {
    requirements: AvailabilityRequirements;
    [key: string]: unknown;
}

export default function SchedulerHeader() {
    const { requirements } = usePage<PageProps>().props;
    return (
        <div className="container px-4 mx-auto flex items-center justify-between mt-10 mb-5">
            <div>
                <h4 className="text-[32px] font-semibold">Availability Scheduler</h4>
                <h6 className="text-base font-semibold text-text-muted">Calendar Dashboard</h6>
            </div>
            <Suspense fallback={<span className="hidden"></span>}>
                {requirements && (
                    <RequirementsBanner requirements={requirements} />
                )}
            </Suspense>
        </div>
    )
}