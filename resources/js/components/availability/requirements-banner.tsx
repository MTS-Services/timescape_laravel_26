import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { AvailabilityRequirements } from '@/types/availability';

export default function RequirementsBanner({ requirements }: { requirements: AvailabilityRequirements }) {
    return (
        <div className=" w-full sm:w-auto">
            <div>
                <h6 className="mb-1 font-semibold text-xs md:text-sm lg:text-base text-destructive w-full">
                    Availability Requirements
                </h6>
                <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-destructive" />
                            <span className="text-destructive text-xs font-normal">
                                Minimum 3 weekday blocks (Mon-Fri)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-destructive" />
                            <span className="text-destructive text-xs font-normal">
                                Minimum 2 weekend blocks (Sat-Sun)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}