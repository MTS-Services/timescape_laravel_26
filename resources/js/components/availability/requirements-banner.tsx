import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { AvailabilityRequirements } from '@/types/availability';

export default function RequirementsBanner({ requirements }: { requirements: AvailabilityRequirements }) {
    return (
        <div className=" w-full sm:w-auto">
            <div>
                <h6 className="mb-2 font-semibold text-base text-destructive w-full">
                    Availability Requirements
                </h6>
                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        {requirements.weekday.is_met ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 hidden" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600 hidden" />
                        )}
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-destructive" />
                            <span className="text-destructive text-xs font-normal">
                                Minimum 3 weekday blocks (Mon-Fri) <span className="hidden">:{' '}</span>
                                <span
                                    className={cn(
                                        'font-semibold hidden ',
                                        requirements.weekday.is_met
                                            ? 'text-green-600'
                                            : 'text-amber-600'
                                    )}
                                >
                                    {requirements.weekday.total_blocks}/3
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {requirements.weekend.is_met ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 hidden" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600 hidden" />
                        )}
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-destructive" />
                            <span className="text-destructive text-xs font-normal">
                                Minimum 2 weekend blocks (Sat-Sun)<span className="hidden">:{' '}</span>
                                <span
                                    className={cn(
                                        'font-semibold hidden',
                                        requirements.weekend.is_met
                                            ? 'text-green-600'
                                            : 'text-amber-600'
                                    )}
                                >
                                    {requirements.weekend.total_blocks}/2
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}